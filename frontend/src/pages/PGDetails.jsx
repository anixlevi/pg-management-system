import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { SinglePGMap } from "../components/MapView.jsx";
import RatingStars from "../components/RatingStars.jsx";
import StarRatingInput from "../components/StarRatingInput.jsx";
import { ADDON_PRICES, KITCHEN_MIN_RENT } from "../components/pricing.js";
import { BASIC_KITCHEN_APPLIANCES, KITCHEN_EXTRAS } from "../components/kitchenInfo.js";

const CRITERIA = [
  ["cleanliness", "Cleanliness"],
  ["wifi_rating", "WiFi"],
  ["price_value", "Price for value"],
  ["safety", "Safety"],
  ["owner_behavior", "Owner behaviour"],
];

const CATEGORY_LABELS = {
  cover: "Overview",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  lobby: "Lobby",
  garden: "Garden / Outdoor",
  exterior: "Exterior",
};

// Basic room appliances & furniture: included in every room at no extra charge
// (keep this list the same as BASIC_ROOM_ITEMS in StudentPGDashboard.jsx)
const BASIC_ROOM_ITEMS = [
  { id: "bed", icon: "🛏️", label: "Bed with Mattress", detail: "Single bed with a mattress and pillow" },
  { id: "table", icon: "📚", label: "Study Table", detail: "Table with a small shelf for books and a laptop" },
  { id: "chair", icon: "🪑", label: "Chair", detail: "Study chair with back support" },
  { id: "fan", icon: "🌀", label: "Ceiling Fan", detail: "Fan with regulator" },
  { id: "wardrobe", icon: "🚪", label: "Wardrobe", detail: "Cupboard with a lock for clothes and belongings" },
  { id: "light", icon: "💡", label: "Lights & Power Sockets", detail: "LED light with charging points near the bed and table" },
  { id: "bathroom", icon: "🚿", label: "Personal Bathroom", detail: "Private attached bathroom with shower and toilet, only for your use" },
];

// Guest stay policy summary (keep in line with GUEST_TERMS in StudentPGDashboard.jsx)
const GUEST_FREE_NIGHTS_PER_MONTH = 2;
const GUEST_POLICY = [
  `A guest can stay up to ${GUEST_FREE_NIGHTS_PER_MONTH} nights in a month at a reasonable per-night charge.`,
  `If a guest needs more than ${GUEST_FREE_NIGHTS_PER_MONTH} nights in a month, the charge for the whole month applies.`,
  "Same room: the guest stays in your room, and the charge depends on your room's rent.",
  "Other room: the guest gets a separate room, and the charge depends on that room's rent.",
  "Every guest stay needs the owner's approval before arrival.",
  "Your guest does not pay a separate security deposit. It is covered by your own deposit, and any damage by your guest is charged to you.",
];

// Security deposit summary (keep in line with SECURITY_TERMS in StudentPGDashboard.jsx)
const SECURITY_SUMMARY = [
  "One-time deposit equal to one month's base room rent, collected only with your first rent payment.",
  "Fully refundable when you vacate and return the digital key, within 7 to 10 working days after checkout and room inspection.",
  "Deductions only for damage beyond normal wear and tear, unpaid rent or dues, and unpaid add-on charges.",
  "No interest is paid on the deposit.",
];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function PGGallery({ images }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="card" style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        No photos uploaded yet
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
      <img
        src={images[active].url}
        alt={CATEGORY_LABELS[images[active].category] || images[active].category}
        style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }}
      />
      <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto" }}>
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            style={{
              flexShrink: 0,
              padding: 0,
              border: idx === active ? "2px solid var(--teal)" : "2px solid transparent",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              background: "none",
            }}
          >
            <img
              src={img.url}
              alt={CATEGORY_LABELS[img.category] || img.category}
              style={{ width: 90, height: 64, objectFit: "cover", display: "block" }}
            />
            <div style={{ fontSize: 10, textAlign: "center", padding: "2px 0", color: "var(--muted)" }}>
              {CATEGORY_LABELS[img.category] || img.category}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PGDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  // The app is for everyone, not only students: any logged-in user except the PG owner can book, rate and raise complaints
  const isResident = !!user && user.role !== "owner";
  const [pg, setPg] = useState(null);
  const [images, setImages] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [myBooking, setMyBooking] = useState(null);
  const [msg, setMsg] = useState("");
  const [ratingForm, setRatingForm] = useState({ cleanliness: 0, wifi_rating: 0, price_value: 0, safety: 0, owner_behavior: 0, comment: "" });

  const load = async () => {
    const { data } = await api.get(`/pgs/${id}`);
    setPg(data.pg);
    setImages(data.images || []);
    const r = await api.get(`/ratings/pg/${id}`);
    setRatings(r.data.ratings);
  };

  const loadComplaints = async () => {
    try {
      const { data } = await api.get(`/pgs/${id}/complaints`);
      setComplaints(data.complaints || []);
    } catch {
      // endpoint might not be ready yet — ignore silently
    }
  };

  const loadMyBooking = async () => {
    if (!isResident) return;
    try {
      const { data } = await api.get("/bookings/student/mine");
      const match = (data.bookings || []).find(
        (b) => String(b.pg_id) === String(id) && b.status === "accepted"
      );
      setMyBooking(match || null);
    } catch {
      // ignore if not available
    }
  };

  useEffect(() => { load(); loadComplaints(); loadMyBooking(); }, [id]); // eslint-disable-line

  const requestBooking = async () => {
    setMsg("");
    try {
      await api.post("/bookings", { pg_id: id });
      setMsg("Request sent! Track it from My Dashboard.");
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not send request.");
    }
  };

  const submitRating = async (e) => {
    e.preventDefault();
    setMsg("");
    if (Object.entries(ratingForm).some(([k, v]) => k !== "comment" && v === 0)) {
      setMsg("Please rate all 5 categories.");
      return;
    }
    try {
      await api.post("/ratings", { pg_id: id, ...ratingForm });
      setMsg("Thanks — your rating was saved.");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not save rating.");
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmittingComplaint(true);
    try {
      await api.post(`/pgs/${id}/complaints`, { message: complaintText });
      setComplaintText("");
      loadComplaints();
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (!pg) return <div className="container" style={{ padding: 40 }}>Loading...</div>;

  // Kitchen is included only in PGs priced above KITCHEN_MIN_RENT
  const kitchenAvailable = Number(pg.price) > KITCHEN_MIN_RENT;

  // Food is not part of the rent, so it is not listed as an amenity. Electricity is always included in rent.
  const amenities = [
    pg.wifi && "WiFi", pg.laundry && "Laundry",
    pg.ac && "AC", pg.parking && "Parking", pg.power_backup && "Power backup",
    "Electricity included",
    "Personal bathroom",
    kitchenAvailable && "Kitchen included",
  ].filter(Boolean);

  return (
    <div className="container" style={{ paddingBottom: 60, paddingTop: 30 }}>
      <div className="eyebrow">{pg.locality}, {pg.city}</div>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>{pg.name}</h1>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 6 }}>
        <RatingStars value={pg.rating.overall} count={pg.rating.count} />
        <span className="price-tag">₹{pg.price}/mo</span>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{pg.available_rooms}/{pg.total_rooms} rooms available</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Listed on {formatDate(pg.created_at)}
      </div>

      <PGGallery images={images} />

      <div className="two-col">
        <div>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>About this PG</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{pg.description || "No description provided by the owner yet."}</p>
            <div className="amenity-row" style={{ marginTop: 12 }}>
              {amenities.map((a) => <span className="amenity" key={a}>{a}</span>)}
              <span className="amenity">Gender: {pg.gender_allowed}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>{pg.address}</p>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Room details</h3>
            <p><strong>Room type:</strong> {pg.room_type || "Shared / Single available"}</p>
            <p><strong>Total rooms:</strong> {pg.total_rooms}</p>
            <p><strong>Available rooms:</strong> {pg.available_rooms}</p>
            <p><strong>Furnishing:</strong> {pg.furnishing || "Semi-furnished"}</p>
            <p><strong>Available from:</strong> {formatDate(pg.available_from)}</p>
          </div>

          {/* Basic room items: included in every room */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Included in your room</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
              Basic furniture and appliances that come with every room at no extra charge.
            </p>

            {/* Highlight: electricity is included in rent for every room */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14, borderRadius: 10, border: "1px solid var(--teal)", background: "rgba(0,184,148,0.08)" }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <div>
                <strong style={{ display: "block", fontSize: 14, color: "var(--teal)" }}>No electricity bills</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Electricity is included in your rent. Use fan, lights, charger and appliances without a separate bill.</span>
              </div>
            </div>

            {/* Highlight: food is not included, resident chooses in Meal Preferences */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14, borderRadius: 10, border: "1px solid #e67e22", background: "rgba(230,126,34,0.08)" }}>
              <span style={{ fontSize: 22 }}>🍽️</span>
              <div>
                <strong style={{ display: "block", fontSize: 14, color: "#e67e22" }}>Food is not included</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Meals are not part of your rent. You can choose any food option you like in Meal Preferences: own food, PG Kitchen, or a cloud kitchen.</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {BASIC_ROOM_ITEMS.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
                  <span>{item.icon}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional add-ons (monthly) */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Optional add-ons</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
              Customise your room after booking. You can choose either an AC or a cooler, not both.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="criteria-row" style={{ fontSize: 14 }}><span>Air Conditioner</span><strong>+₹{ADDON_PRICES.ac}/mo</strong></div>
              <div className="criteria-row" style={{ fontSize: 14 }}><span>Air Cooler</span><strong>+₹{ADDON_PRICES.cooler}/mo</strong></div>
              <div className="criteria-row" style={{ fontSize: 14 }}><span>Personal Laundry Service</span><strong>+₹{ADDON_PRICES.laundry}/mo</strong></div>
            </div>
          </div>

          {/* Kitchen: included in PGs priced above KITCHEN_MIN_RENT, premium extras are monthly add-ons */}
          {kitchenAvailable && (
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>🍳 Kitchen included</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
                Every room in this PG comes with a kitchen at no extra charge. Premium appliances can be added monthly after booking.
              </p>

              <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>Basic appliances (included)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {BASIC_KITCHEN_APPLIANCES.map((a) => (
                  <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
                    <span>{a.icon}</span>
                    <span>
                      <strong>{a.label}</strong>
                      <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>{a.detail}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>Premium extras (charged monthly)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {KITCHEN_EXTRAS.map((ex) => (
                  <div key={ex.id} className="criteria-row" style={{ fontSize: 14 }}>
                    <span>{ex.label}</span>
                    <strong>+₹{ex.price}/mo</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Food: not included in rent, resident chooses */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Food</h3>
            <p><strong>Included in rent:</strong> No</p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
              You choose how you want your meals after booking, in Meal Preferences: arrange your own food, eat from the PG Kitchen, or order from a cloud kitchen, per meal or on a weekly or monthly plan. Nothing is compulsory.
            </p>
            <p style={{ marginTop: 10 }}><strong>Diets supported:</strong> Veg, Non-veg and Jain</p>
            <p><strong>Mess timing:</strong> {pg.mess_timing || "8–10 AM, 1–3 PM, 8–10 PM"}</p>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Utilities</h3>
            <p><strong>WiFi:</strong> {pg.wifi ? `Available — ${pg.wifi_speed || "up to 100 Mbps"}` : "Not available"}</p>
            <p><strong>Water supply:</strong> {pg.water_supply || "24x7 supply, RO purified"}</p>
            <p><strong>Electricity backup:</strong> {pg.electricity_backup ? "Available (inverter)" : "No backup"}</p>
            <p style={{ fontSize: 13, color: "var(--teal)" }}>
              ⚡ Electricity is included in rent. No separate electricity bill.
            </p>
          </div>

          {/* Guest stay policy */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Guest stay policy</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
              Residents can host guests in the same room or in another room. You can request a guest stay from your dashboard after booking.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
              {GUEST_POLICY.map((t, idx) => <li key={idx} style={{ marginBottom: 4 }}>{t}</li>)}
            </ul>
          </div>

          {/* Security deposit summary */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>🔐 Security deposit</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
              Refundable deposit of ₹{pg.price}, paid once with your first rent payment.
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
              {SECURITY_SUMMARY.map((t, idx) => <li key={idx} style={{ marginBottom: 4 }}>{t}</li>)}
            </ul>
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Rating breakdown</h3>
            {pg.rating.count === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>No ratings yet — be the first to review.</p>
            ) : (
              CRITERIA.map(([key, label]) => (
                <div className="criteria-row" key={key}>
                  <span>{label}</span>
                  <strong>{pg.rating[key]} / 5</strong>
                </div>
              ))
            )}
          </div>

          {isResident && (
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Rate this PG</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>Submitting again updates your previous rating.</p>
              <form onSubmit={submitRating}>
                {CRITERIA.map(([key, label]) => (
                  <StarRatingInput key={key} label={label} value={ratingForm[key]} onChange={(v) => setRatingForm({ ...ratingForm, [key]: v })} />
                ))}
                <div className="field">
                  <label>Comment (optional)</label>
                  <textarea rows={3} value={ratingForm.comment} onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })} />
                </div>
                <button className="form-submit">Submit rating</button>
              </form>
            </div>
          )}

          {ratings.length > 0 && (
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>Resident reviews</h3>
              {ratings.map((r) => (
                <div key={r.id} className="criteria-row" style={{ display: "block", padding: "12px 0" }}>
                  <strong style={{ fontSize: 14 }}>{r.student_name}</strong>
                  {r.comment && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{r.comment}</p>}
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    Posted on {formatDate(r.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isResident && (
            <div className="card card-pad">
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>Complaints</h3>
              <form onSubmit={submitComplaint} style={{ marginBottom: 16 }}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Describe the issue (e.g. water not working, room not clean)..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                />
                <button className="pill" style={{ marginTop: 10 }} disabled={submittingComplaint}>
                  {submittingComplaint ? "Submitting..." : "Submit complaint"}
                </button>
              </form>

              {complaints.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No complaints raised yet.</p>
              ) : (
                complaints.map((c) => (
                  <div key={c.id} className="criteria-row" style={{ display: "block", padding: "12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14 }}>{c.message}</span>
                      <span className={`status-tag ${c.status || "pending"}`}>{c.status || "pending"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                      Raised on {formatDate(c.created_at)}
                      {c.resolved_at && ` · Resolved on ${formatDate(c.resolved_at)}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <SinglePGMap latitude={pg.latitude} longitude={pg.longitude} name={pg.name} address={pg.address} tall />

          {myBooking && (
            <div className="card card-pad" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>Your stay</h3>
              <p><strong>Joining date:</strong> {formatDate(myBooking.check_in_date || myBooking.created_at)}</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                Booking status: <span className={`status-tag ${myBooking.status}`}>{myBooking.status}</span>
              </p>
            </div>
          )}

          {isResident && (
            <div className="card card-pad" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>Interested?</h3>
              <button className="pill" style={{ width: "100%" }} onClick={requestBooking}>Request to book</button>
              {msg && <p style={{ fontSize: 13, marginTop: 10, color: "var(--teal)" }}>{msg}</p>}
            </div>
          )}
          {!user && (
            <div className="card card-pad" style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
              Log in to request a booking or leave a rating.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}