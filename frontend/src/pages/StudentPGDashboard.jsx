import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api.js";
import { SinglePGMap } from "../components/MapView.jsx";
import { ADDON_PRICES, KITCHEN_MIN_RENT, GUEST_RATE } from "../components/pricing.js";
import { BASIC_KITCHEN_APPLIANCES, KITCHEN_EXTRAS } from "../components/kitchenInfo.js";

const CATEGORY_LABELS = {
  cover: "Overview",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
};

// Basic room appliances & furniture: included in every room at no extra charge
// (sample details - owner should finalise these, or move this list to pricing.js)
const BASIC_ROOM_ITEMS = [
  { id: "bed", icon: "🛏️", label: "Bed with Mattress", detail: "Single bed with a mattress and pillow" },
  { id: "table", icon: "📚", label: "Study Table", detail: "Table with a small shelf for books and a laptop" },
  { id: "chair", icon: "🪑", label: "Chair", detail: "Study chair with back support" },
  { id: "fan", icon: "🌀", label: "Ceiling Fan", detail: "Fan with regulator" },
  { id: "wardrobe", icon: "🚪", label: "Wardrobe", detail: "Cupboard with a lock for clothes and belongings" },
  { id: "light", icon: "💡", label: "Lights & Power Sockets", detail: "LED light with charging points near the bed and table" },
  { id: "bathroom", icon: "🚿", label: "Personal Bathroom", detail: "Private attached bathroom with shower and toilet, only for your use" },
];

// Meal sources: own food (self-arranged) + PG Kitchen + cloud kitchens (sample data - replace with API data later)
// Every kitchen has: menu (price + rating per dish), weekly/monthly subscription plans (3 meals a day), and a weekly menu.
// Cloud kitchens: delivery fee per order, free pickup, delivery included in subscriptions. PG Kitchen: served in the PG dining area.
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const JAIN_BREAKFASTS = ["Moong Dal Chilla", "Thepla & Curd", "Poha (no onion)", "Idli Sambar"];

const MEAL_SOURCES = [
  { id: "own", icon: "🏠", name: "Own Food", cuisine: "I'll arrange my own meals", rating: null, eta: "Your choice", diets: ["veg", "nonveg", "jain"] },
  {
    id: "pgkitchen", icon: "🍽️", name: "PG Kitchen", cuisine: "Home-style meals cooked at your PG", rating: 4.2, eta: "Served in PG dining area", dineIn: true,
    plans: { weekly: 1400, monthly: 5200 }, diets: ["veg", "nonveg", "jain"],
    breakfasts: ["Poha", "Aloo Paratha", "Upma", "Idli Sambar"],
    menu: [
      { id: "pk1", name: "Veg Thali", price: 70, rating: 4.1, diets: ["veg", "nonveg"] },
      { id: "pk2", name: "Rajma Chawal", price: 65, rating: 4.0, diets: ["veg", "nonveg"] },
      { id: "pk3", name: "Kadhi Chawal", price: 60, rating: 4.0, diets: ["veg", "nonveg"] },
      { id: "pk4", name: "Chicken Curry Meal", price: 110, rating: 4.3, diets: ["nonveg"] },
      { id: "pk5", name: "Egg Curry Meal", price: 85, rating: 4.2, diets: ["nonveg"] },
      { id: "pk6", name: "Jain Thali", price: 80, rating: 4.1, diets: ["jain"] },
      { id: "pk7", name: "Jain Dal Khichdi", price: 70, rating: 4.0, diets: ["jain"] },
      { id: "pk8", name: "Jain Roti Sabzi", price: 65, rating: 4.0, diets: ["jain"] },
    ],
  },
  {
    id: "freshbox", name: "FreshBox Kitchen", cuisine: "North Indian", rating: 4.5, eta: "30 min", deliveryFee: 30, pickupDistance: "1.2 km",
    plans: { weekly: 2100, monthly: 7800 }, diets: ["veg", "nonveg", "jain"],
    breakfasts: ["Aloo Paratha", "Poha", "Chole Kulcha", "Upma"],
    menu: [
      { id: "fb1", name: "Dal Makhani Meal", price: 140, rating: 4.5, diets: ["veg", "nonveg"] },
      { id: "fb2", name: "Paneer Butter Masala Meal", price: 180, rating: 4.4, diets: ["veg", "nonveg"] },
      { id: "fb3", name: "Butter Chicken Meal", price: 220, rating: 4.6, diets: ["nonveg"] },
      { id: "fb4", name: "Veg Pulao Meal", price: 130, rating: 4.2, diets: ["veg", "nonveg"] },
      { id: "fb5", name: "Jain Dal Rice", price: 110, rating: 4.1, diets: ["jain"] },
      { id: "fb6", name: "Jain Thali", price: 150, rating: 4.3, diets: ["jain"] },
      { id: "fb7", name: "Jain Paneer Meal", price: 160, rating: 4.2, diets: ["jain"] },
    ],
  },
  {
    id: "greentiffin", name: "Green Tiffin", cuisine: "Home-style pure veg", rating: 4.3, eta: "25 min", deliveryFee: 25, pickupDistance: "0.8 km",
    plans: { weekly: 1500, monthly: 5600 }, diets: ["veg", "jain"],
    breakfasts: ["Poha", "Sabudana Khichdi", "Aloo Paratha", "Idli Sambar"],
    menu: [
      { id: "gt1", name: "Home Thali", price: 95, rating: 4.3, diets: ["veg"] },
      { id: "gt2", name: "Chole Rice", price: 90, rating: 4.2, diets: ["veg"] },
      { id: "gt3", name: "Mix Veg & Roti", price: 80, rating: 4.1, diets: ["veg"] },
      { id: "gt4", name: "Jain Tiffin", price: 100, rating: 4.3, diets: ["jain"] },
      { id: "gt5", name: "Jain Dal Khichdi", price: 85, rating: 4.1, diets: ["jain"] },
      { id: "gt6", name: "Jain Roti Sabzi", price: 80, rating: 4.0, diets: ["jain"] },
    ],
  },
  {
    id: "spiceroute", name: "Spice Route Cloud Kitchen", cuisine: "Non-veg specials", rating: 4.6, eta: "40 min", deliveryFee: 40, pickupDistance: "2.0 km",
    plans: { weekly: 2600, monthly: 9600 }, diets: ["nonveg", "veg"],
    breakfasts: ["Egg Bhurji Paratha", "Poha", "Aloo Paratha", "Omelette & Toast"],
    menu: [
      { id: "sr1", name: "Chicken Biryani", price: 180, rating: 4.7, diets: ["nonveg"] },
      { id: "sr2", name: "Egg Curry Rice", price: 130, rating: 4.4, diets: ["nonveg"] },
      { id: "sr3", name: "Fish Curry Meal", price: 210, rating: 4.5, diets: ["nonveg"] },
      { id: "sr4", name: "Paneer Tikka Roll", price: 120, rating: 4.3, diets: ["veg", "nonveg"] },
      { id: "sr5", name: "Veg Biryani", price: 150, rating: 4.3, diets: ["veg", "nonveg"] },
      { id: "sr6", name: "Dal Tadka Rice", price: 110, rating: 4.2, diets: ["veg", "nonveg"] },
    ],
  },
  {
    id: "jainrasoi", name: "Jain Rasoi", cuisine: "Jain meals only", rating: 4.4, eta: "35 min", deliveryFee: 30, pickupDistance: "1.5 km",
    plans: { weekly: 1700, monthly: 6200 }, diets: ["jain"],
    breakfasts: JAIN_BREAKFASTS,
    menu: [
      { id: "jr1", name: "Jain Thali", price: 120, rating: 4.5, diets: ["jain"] },
      { id: "jr2", name: "Jain Dal Khichdi", price: 90, rating: 4.3, diets: ["jain"] },
      { id: "jr3", name: "Jain Pav Bhaji", price: 100, rating: 4.4, diets: ["jain"] },
    ],
  },
];

// Builds a 7-day menu (breakfast / lunch / dinner) from the kitchen's dishes for the chosen diet
const buildWeekMenu = (source, diet) => {
  const dishes = (source.menu || []).filter((m) => m.diets.includes(diet)).map((m) => m.name);
  const bf = diet === "jain" ? JAIN_BREAKFASTS : source.breakfasts || [];
  if (dishes.length === 0) return [];
  return DAYS.map((day, i) => ({
    day,
    breakfast: bf[i % bf.length] || "—",
    lunch: dishes[i % dishes.length],
    dinner: dishes[(i + 2) % dishes.length],
  }));
};

// Security deposit terms (sample wording - owner should finalise these)
const SECURITY_TERMS = [
  "The security deposit is a one-time payment equal to one month's base room rent. It is collected only with your first rent payment.",
  "It is fully refundable when you vacate the room and return the digital key and room access.",
  "The refund is processed within 7 to 10 working days after checkout and a room inspection.",
  "Deductions may be made only for damage to the room, furniture or appliances beyond normal wear and tear, unpaid rent or dues, and unpaid service or add-on charges.",
  "Please inform the owner before you plan to vacate. Notice rules set by the PG owner apply to the refund.",
  "The deposit cannot be adjusted against monthly rent unless the owner agrees in writing.",
  "No interest is paid on the security deposit.",
  "Any deduction will be shared with you with the reason before the refund is made.",
];

// Guest stay rules (sample values - owner should finalise these)
const GUEST_FREE_NIGHTS_PER_MONTH = 2; // up to 2 nights a month at the per-night price

// Rooms a guest can be given if they don't stay in the resident's room
const GUEST_OTHER_ROOMS = [
  { id: "std", label: "Standard Room", rent: 6000 },
  { id: "ac", label: "AC Room", rent: 9000 },
  { id: "premium", label: "Premium Room (with kitchen)", rent: 12000 },
];

const GUEST_TERMS = [
  "A guest can stay for a maximum of 2 nights in a month at the per-night guest charge.",
  "If a guest needs to stay for more than 2 nights in a month, the charge for the whole month applies, not per night.",
  "Same room: the guest stays in your room. The charge depends on your room's rent, including AC or cooler if you have chosen it.",
  "Other room: the guest gets a separate room. The charge depends on the rent of the room type you choose, and availability is confirmed by the owner.",
  "Every guest stay needs the owner's approval before arrival.",
  "The guest must carry a valid ID and follow all PG rules. You are responsible for your guest.",
  "Visitors are not allowed in the rooms of other residents, and quiet hours must be followed.",
  "The owner can cancel a guest stay if PG rules are broken, and the charge is not refunded in that case.",
  "Your guest does not pay a separate security deposit. It is covered by your own security deposit as the resident. Any damage caused by your guest to the room, furniture, appliances or PG property will be charged to you and can be deducted from your security deposit.",
];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// 1-Month Duration Calculate karne ke liye helper
const getTenureDates = (startDateStr) => {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(start)) return { startFormatted: "—", endFormatted: "—" };

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1); // 1 Month Tenure Limit

  return {
    startFormatted: formatDate(start),
    endFormatted: formatDate(end),
  };
};

export default function StudentPGDashboard() {
  const { id } = useParams();

  const [pg, setPg] = useState(null);
  const [booking, setBooking] = useState(null);
  const [images, setImages] = useState([]);
  const [activeCat, setActiveCat] = useState("all");
  const [activeImg, setActiveImg] = useState(0);

  // Customization & Food States
  const [addons, setAddons] = useState({ ac: false, cooler: false, laundry: false });
  const [kitchenExtras, setKitchenExtras] = useState({}); // e.g. { microwave: true, fridge: false }
  const [foodPref, setFoodPref] = useState({ diet: "veg", items: [] });
  const [mealSource, setMealSource] = useState("own");
  const [mealMsg, setMealMsg] = useState("");
  const [cart, setCart] = useState({});
  const [fulfilment, setFulfilment] = useState("delivery"); // "delivery" | "pickup"
  const [plan, setPlan] = useState("order"); // "order" | "weekly" | "monthly"
  const [planStart, setPlanStart] = useState("");
  const [showWeek, setShowWeek] = useState(false);

  // Guest stay states
  const [guestForm, setGuestForm] = useState({ name: "", phone: "", date: "", nights: 1, stayType: "same", otherRoom: "std" });
  const [guestTermsAccepted, setGuestTermsAccepted] = useState(false);
  const [showGuestTerms, setShowGuestTerms] = useState(false);
  const [guestRequests, setGuestRequests] = useState([]);
  const [guestMsg, setGuestMsg] = useState("");
  const [cleaningSlot, setCleaningSlot] = useState({ type: "schedule", date: "", time: "10:00 AM" });

  // Complaint state
  const [complaintText, setComplaintText] = useState("");
  const [msg, setMsg] = useState("");

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [isPaying, setIsPaying] = useState(false);
  const [securityPaid, setSecurityPaid] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [lastPaid, setLastPaid] = useState(0);

  const basePrice = pg?.price || 0;
  const addonPrices = ADDON_PRICES; // shared with PGDetails (see pricing.js)
  const kitchenAvailable = basePrice > KITCHEN_MIN_RENT; // kitchen is included only in rooms priced above ₹10,000

  // Monthly total of the selected premium kitchen extras (only for rooms that have a kitchen)
  const kitchenExtrasTotal = () =>
    kitchenAvailable
      ? KITCHEN_EXTRAS.reduce((sum, e) => sum + (kitchenExtras[e.id] ? e.price : 0), 0)
      : 0;

  const calculateTotalRent = () => {
    let extra = 0;
    if (addons.ac) extra += addonPrices.ac;
    if (addons.cooler) extra += addonPrices.cooler;
    if (addons.laundry) extra += addonPrices.laundry;
    extra += kitchenExtrasTotal(); // kitchen itself is free/included, only extras are charged
    return basePrice + extra;
  };

  // Security deposit: one-time, same as one month's base room rent, charged with the first payment only
  const securityDeposit = basePrice;
  const isFirstPayment = !securityPaid && !booking?.security_paid;
  const amountDue = () => calculateTotalRent() + (isFirstPayment ? securityDeposit : 0);

  const loadData = async () => {
    try {
      const { data: pgData } = await api.get(`/pgs/${id}`);
      setPg(pgData.pg);
      setImages(pgData.images || []);

      const { data: bookingData } = await api.get("/bookings/student/mine");
      const match = (bookingData.bookings || []).find(
        (b) => String(b.pg_id) === String(id) && (b.status === "accepted" || b.status === "Completed")
      );
      setBooking(match || null);
    } catch (err) {
      console.error("Error loading PG personal details:", err);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // Diet badalne par agar selected kitchen us diet ko serve nahi karta to pehla matching kitchen select ho jata hai
  const handleDietChange = (diet) => {
    const current = MEAL_SOURCES.find((s) => s.id === mealSource);
    if (current && !current.diets.includes(diet)) {
      const next = MEAL_SOURCES.find((s) => s.diets.includes(diet));
      setMealSource(next ? next.id : "");
    }
    setFoodPref({ diet, items: [] });
    setCart({});
    setMealMsg("");
  };

  const availableSources = MEAL_SOURCES.filter((s) => s.diets.includes(foodPref.diet));
  const selectedSource = MEAL_SOURCES.find((s) => s.id === mealSource);

  // Menu of the selected kitchen, filtered by the resident's diet
  const kitchenMenu = selectedSource?.menu ? selectedSource.menu.filter((m) => m.diets.includes(foodPref.diet)) : [];

  const changeQty = (itemId, delta) => {
    setCart((prev) => {
      const q = Math.max(0, (prev[itemId] || 0) + delta);
      const next = { ...prev };
      if (q === 0) delete next[itemId];
      else next[itemId] = q;
      return next;
    });
    setMealMsg("");
  };

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const foodTotal = kitchenMenu.reduce((sum, m) => sum + (cart[m.id] || 0) * m.price, 0);
  // Pickup = no delivery charge
  const deliveryCharge = selectedSource?.deliveryFee && fulfilment === "delivery" && foodTotal > 0 ? selectedSource.deliveryFee : 0;
  const planPrice = plan !== "order" && selectedSource?.plans ? selectedSource.plans[plan] : 0;
  const mealGrandTotal = plan === "order" ? foodTotal + deliveryCharge : planPrice;
  const weekMenu = selectedSource?.menu ? buildWeekMenu(selectedSource, foodPref.diet) : [];
  const weekVisible = plan !== "order" || showWeek;

  const saveMealChoice = () => {
    if (selectedSource?.id === "own") {
      setMealMsg("Meal choice saved: Own Food");
      return;
    }
    if (plan !== "order") {
      if (!planStart) {
        setMealMsg("Please choose a start date for your plan.");
        return;
      }
      setMealMsg(`Subscribed to ${plan} plan with ${selectedSource.name} from ${formatDate(planStart)}: ₹${planPrice}`);
      return;
    }
    if (itemCount === 0) {
      setMealMsg("Add at least one dish to place an order.");
      return;
    }
    setMealMsg(`Order placed with ${selectedSource.name}: ₹${mealGrandTotal} (${selectedSource.dineIn ? "Dine-in at PG" : fulfilment === "pickup" ? "Pickup" : "Delivery"})`);
    setCart({});
  };

  // Rent of the room the guest will use: your room (with AC/Cooler) or the chosen other room
  const guestRoomRent = () => {
    if (guestForm.stayType === "other") {
      const r = GUEST_OTHER_ROOMS.find((x) => x.id === guestForm.otherRoom);
      return r ? r.rent : 0;
    }
    return basePrice + (addons.ac ? addonPrices.ac : 0) + (addons.cooler ? addonPrices.cooler : 0);
  };
  const guestPerNight = () => Math.round((guestRoomRent() / 30) * GUEST_RATE);

  // Nights already requested in the same month as the chosen arrival date
  const guestNightsUsedThisMonth = () => {
    if (!guestForm.date) return 0;
    const month = guestForm.date.slice(0, 7);
    return guestRequests.filter((g) => g.date.slice(0, 7) === month).reduce((s, g) => s + g.nights, 0);
  };
  // More than 2 nights in a month = whole month charge
  const guestIsMonthly = () => Number(guestForm.nights) + guestNightsUsedThisMonth() > GUEST_FREE_NIGHTS_PER_MONTH;
  const guestTotal = () => (guestIsMonthly() ? guestRoomRent() : guestPerNight() * Number(guestForm.nights));

  const submitGuestRequest = (e) => {
    e.preventDefault();
    if (!guestForm.name.trim() || !guestForm.date) {
      setGuestMsg("Please enter the guest name and arrival date.");
      return;
    }
    if (!guestTermsAccepted) {
      setGuestMsg("Please accept the guest stay terms to continue.");
      return;
    }
    const roomLabel =
      guestForm.stayType === "other"
        ? GUEST_OTHER_ROOMS.find((x) => x.id === guestForm.otherRoom)?.label || "Other room"
        : "Your room";
    setGuestRequests((prev) => [
      ...prev,
      { ...guestForm, nights: Number(guestForm.nights), total: guestTotal(), monthly: guestIsMonthly(), roomLabel, status: "Pending approval" },
    ]);
    setGuestForm({ name: "", phone: "", date: "", nights: 1, stayType: "same", otherRoom: "std" });
    setGuestTermsAccepted(false);
    setGuestMsg("Guest stay request sent to the owner for approval.");
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    try {
      await api.post(`/pgs/${id}/complaints`, { message: complaintText });
      setComplaintText("");
      setMsg("Complaint submitted successfully!");
      loadData();
    } catch {
      setMsg("Failed to submit complaint.");
    }
  };

  const handlePayment = () => {
    if (isFirstPayment && !termsAccepted) return;
    const paying = amountDue();
    const includesDeposit = isFirstPayment;
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentStatus("Paid");
      setLastPaid(paying);
      if (includesDeposit) setSecurityPaid(true);
      alert(includesDeposit
        ? `Payment Successful! ₹${paying} paid (rent + refundable security deposit).`
        : "Payment Successful! Monthly rent updated.");
    }, 1500);
  };

  if (!pg) return <div className="container" style={{ padding: 40 }}>Loading your PG Dashboard...</div>;

  const joinDateSource = booking?.check_in_date || booking?.created_at;
  const tenure = getTenureDates(joinDateSource);

  // Gallery helpers
  const getImgUrl = (img) => img.url || img.image_url || img.path || "";
  const imageCategories = ["all", ...Array.from(new Set(images.map((i) => i.category).filter(Boolean)))];
  const visibleImages = activeCat === "all" ? images : images.filter((i) => i.category === activeCat);
  const currentImage = visibleImages[activeImg] || visibleImages[0];

  return (
    <div className="container" style={{ paddingBottom: 60, paddingTop: 30 }}>
      {/* Header Banner */}
      <div style={{ background: "var(--card-bg)", padding: 24, borderRadius: 12, marginBottom: 24, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="eyebrow">My Resident Dashboard</span>
            <h1 style={{ fontSize: 32, margin: "4px 0" }}>{pg.name}</h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{pg.address}, {pg.locality}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Room No: <strong style={{ color: "var(--text)" }}>{booking?.room_number || "204-B"}</strong></div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Joining Date: <strong style={{ color: "var(--text)" }}>{tenure.startFormatted}</strong>
            </div>
            <div style={{ fontSize: 12, color: "var(--teal)", marginTop: 2 }}>
              Active Tenure: <strong>1 Month</strong> ({tenure.startFormatted} - {tenure.endFormatted})
            </div>
            <div className="status-tag completed" style={{ marginTop: 6, display: "inline-block" }}>Active Stay</div>
          </div>
        </div>
      </div>

      {/* PG Photo Gallery */}
      {images.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>PG Photos</h3>

          {imageCategories.length > 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {imageCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveCat(cat); setActiveImg(0); }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid var(--teal)",
                    background: activeCat === cat ? "var(--teal)" : "transparent",
                    color: activeCat === cat ? "#fff" : "var(--text)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          )}

          {currentImage && (
            <img
              src={getImgUrl(currentImage)}
              alt={CATEGORY_LABELS[currentImage.category] || pg.name}
              style={{ width: "100%", height: 340, objectFit: "cover", borderRadius: 12, display: "block" }}
            />
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
            {visibleImages.map((img, idx) => (
              <img
                key={img.id || idx}
                src={getImgUrl(img)}
                alt={CATEGORY_LABELS[img.category] || `Photo ${idx + 1}`}
                onClick={() => setActiveImg(idx)}
                style={{
                  width: 90,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                  flexShrink: 0,
                  border: currentImage === img ? "2px solid var(--teal)" : "2px solid transparent",
                  opacity: currentImage === img ? 1 : 0.7,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="two-col">
        <div>
          {/* Basic room items: included in every room */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Included in Your Room</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>Basic furniture and appliances that come with every room at no extra charge.</p>

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

          {/* Custom Appliance & Utility Selection */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Customise Room Appliances</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>Select optional amenities to customize your monthly pricing.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span>Air Conditioner (+₹{addonPrices.ac}/mo)</span>
                <input type="checkbox" checked={addons.ac} onChange={(e) => setAddons({ ...addons, ac: e.target.checked, cooler: e.target.checked ? false : addons.cooler })} />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span>Air Cooler (+₹{addonPrices.cooler}/mo)</span>
                <input type="checkbox" checked={addons.cooler} onChange={(e) => setAddons({ ...addons, cooler: e.target.checked, ac: e.target.checked ? false : addons.ac })} />
              </label>

              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span>Personal Laundry Service (+₹{addonPrices.laundry}/mo)</span>
                <input type="checkbox" checked={addons.laundry} onChange={(e) => setAddons({ ...addons, laundry: e.target.checked })} />
              </label>

              {/* Kitchen: already included in rooms priced above KITCHEN_MIN_RENT. Premium extras are monthly add-ons.
                  Rooms at or below that price have no kitchen, so nothing is shown. */}
              {kitchenAvailable && (
                <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                  <strong style={{ display: "block", fontSize: 14 }}>🍳 Kitchen included in your room</strong>
                  <small style={{ display: "block", color: "var(--muted)", fontSize: 12, marginBottom: 10 }}>
                    Kitchen is available in premium rooms (rent above ₹{KITCHEN_MIN_RENT}).
                  </small>

                  <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>Basic appliances (included, no extra charge)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    {BASIC_KITCHEN_APPLIANCES.map((a) => (
                      <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
                        <span>{a.icon}</span>
                        <span>
                          <strong>{a.label}</strong>
                          <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>{a.detail}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>Premium extras (charged monthly)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {KITCHEN_EXTRAS.map((ex) => (
                      <label key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 14 }}>
                        <span>{ex.label} (+₹{ex.price}/mo)</span>
                        <input
                          type="checkbox"
                          checked={!!kitchenExtras[ex.id]}
                          onChange={(e) => setKitchenExtras({ ...kitchenExtras, [ex.id]: e.target.checked })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr style={{ border: "0.5px solid var(--border)", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: "bold", display: "block" }}>Total Monthly Rent (1 Month Cycle):</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Period: {tenure.startFormatted} to {tenure.endFormatted}</span>
              </div>
              <span style={{ color: "var(--teal)", fontSize: 20, fontWeight: "bold" }}>₹{calculateTotalRent()}/mo</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="card card-pad" style={{ marginBottom: 20, borderLeft: "4px solid var(--teal)" }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Rent Payment</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
              Pay monthly rent for active cycle ({tenure.startFormatted} - {tenure.endFormatted}).
            </p>

            <p style={{ fontSize: 12, color: "var(--teal)", marginBottom: 10 }}>
              ⚡ Electricity is included in your rent. No separate electricity bill.
            </p>

            {/* Kitchen extras breakdown */}
            {kitchenAvailable && kitchenExtrasTotal() > 0 && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                Includes kitchen extras: ₹{kitchenExtrasTotal()}/mo
              </p>
            )}

            {/* First payment: rent + security deposit */}
            {paymentStatus !== "Paid" && isFirstPayment && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13 }}>
                <strong style={{ display: "block", marginBottom: 4 }}>🔐 First payment includes a security deposit</strong>
                <p style={{ color: "var(--muted)", marginBottom: 10 }}>
                  For your first payment only, you pay one extra month's room rent as a refundable security deposit. From the next cycle, you pay just the monthly rent.
                </p>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Monthly rent</span><span>₹{calculateTotalRent()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span>Security deposit (one-time, refundable)</span><span>₹{securityDeposit}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontWeight: "bold", color: "var(--teal)" }}><span>Total for first payment</span><span>₹{amountDue()}</span></div>

                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  style={{ marginTop: 10, background: "transparent", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: 13, padding: 0 }}
                >
                  {showTerms ? "Hide security deposit terms" : "Read security deposit terms & conditions"}
                </button>

                {showTerms && (
                  <ol style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.5 }}>
                    {SECURITY_TERMS.map((t, idx) => <li key={idx} style={{ marginBottom: 4 }}>{t}</li>)}
                  </ol>
                )}

                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
                  <span>I have read and agree to the security deposit terms and conditions.</span>
                </label>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14 }}>Status: <strong style={{ color: paymentStatus === "Paid" ? "green" : "#e67e22" }}>{paymentStatus}</strong></div>
                {paymentStatus === "Paid" ? (
                  <div style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>Amount Paid: ₹{lastPaid}</div>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>Amount Due: ₹{amountDue()}</div>
                )}
                {securityPaid && (
                  <div style={{ fontSize: 12, color: "var(--teal)", marginTop: 4 }}>Security deposit ₹{securityDeposit} paid (refundable)</div>
                )}
              </div>
              {paymentStatus === "Paid" ? (
                <span className="status-tag completed">Paid ✓</span>
              ) : (
                <button className="pill" onClick={handlePayment} disabled={isPaying || (isFirstPayment && !termsAccepted)}>
                  {isPaying ? "Processing..." : `Pay ₹${amountDue()} Now`}
                </button>
              )}
            </div>
            {paymentStatus !== "Paid" && isFirstPayment && !termsAccepted && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Please accept the security deposit terms to continue.</p>
            )}
          </div>

          {/* Food Preferences Customizer */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Meal Preferences</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>Arrange your own food, eat from the PG Kitchen, or order from a cloud kitchen, per meal or on a weekly/monthly plan. Nothing is compulsory.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Primary Diet</label>
              <select
                className="input"
                value={foodPref.diet}
                onChange={(e) => handleDietChange(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="veg">Pure Vegetarian</option>
                <option value="nonveg">Non-Vegetarian</option>
                <option value="jain">Jain Food Only</option>
              </select>
            </div>

            {/* Own food or cloud kitchen selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>How do you want your meals?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {availableSources.map((s) => {
                  const active = mealSource === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setMealSource(s.id); setCart({}); setPlan("order"); setShowWeek(false); setMealMsg(""); }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        textAlign: "left",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: active ? "2px solid var(--teal)" : "1px solid var(--border)",
                        background: active ? "rgba(0,184,148,0.08)" : "transparent",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      <span>
                        <strong style={{ display: "block", fontSize: 14 }}>
                          {s.icon || "🍱"} {s.name}
                        </strong>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          {s.cuisine}
                          {s.rating ? ` · ⭐ ${s.rating}` : ""}
                          {` · ${s.eta}`}
                        </span>
                      </span>
                      {s.id !== "own" && (
                        <span style={{ fontSize: 12, color: "var(--teal)", whiteSpace: "nowrap", textAlign: "right" }}>
                          {s.dineIn ? "Dine-in · no delivery" : `Delivery ₹${s.deliveryFee} · Pickup free`}
                          <br />
                          Plans from ₹{s.plans.weekly}/week
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedSource?.id === "own" && (
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
                  You'll arrange your own meals. You can switch to a cloud kitchen anytime.
                </p>
              )}

              {selectedSource && selectedSource.id !== "own" && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>How do you want to order from {selectedSource.name}?</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { id: "order", label: "Order per meal", note: "Pay only for what you order" },
                      { id: "weekly", label: `Weekly plan · ₹${selectedSource.plans.weekly}`, note: `3 meals a day · about ₹${Math.round(selectedSource.plans.weekly / 7)}/day` },
                      { id: "monthly", label: `Monthly plan · ₹${selectedSource.plans.monthly}`, note: `3 meals a day · about ₹${Math.round(selectedSource.plans.monthly / 30)}/day` },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setPlan(o.id); setMealMsg(""); }}
                        style={{
                          flex: 1,
                          minWidth: 160,
                          textAlign: "left",
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: plan === o.id ? "2px solid var(--teal)" : "1px solid var(--border)",
                          background: plan === o.id ? "rgba(0,184,148,0.08)" : "transparent",
                          color: "var(--text)",
                          cursor: "pointer",
                        }}
                      >
                        <strong style={{ display: "block", fontSize: 13 }}>{o.label}</strong>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{o.note}</span>
                      </button>
                    ))}
                  </div>

                  {plan !== "order" && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Plan start date</label>
                      <input
                        type="date"
                        className="input"
                        min={new Date().toISOString().split("T")[0]}
                        value={planStart}
                        onChange={(e) => { setPlanStart(e.target.value); setMealMsg(""); }}
                      />
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                        Includes breakfast, lunch and dinner every day{selectedSource.dineIn ? ", served in the PG dining area." : ", with delivery included."}
                      </p>
                    </div>
                  )}

                  {plan === "order" && (
                    <>
                      <div style={{ fontSize: 13, margin: "14px 0 8px" }}>Choose dishes:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {kitchenMenu.map((m) => (
                          <div
                            key={m.id}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
                          >
                            <div>
                              <strong style={{ fontSize: 14 }}>{m.name}</strong>
                              <div style={{ fontSize: 12, color: "var(--muted)" }}>⭐ {m.rating} · ₹{m.price}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button type="button" onClick={() => changeQty(m.id, -1)} disabled={!cart[m.id]}
                                style={{ width: 28, height: 28, borderRadius: 14, border: "1px solid var(--teal)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>−</button>
                              <span style={{ minWidth: 16, textAlign: "center", fontSize: 14 }}>{cart[m.id] || 0}</span>
                              <button type="button" onClick={() => changeQty(m.id, 1)}
                                style={{ width: 28, height: 28, borderRadius: 14, border: "none", background: "var(--teal)", color: "#fff", cursor: "pointer" }}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedSource.dineIn ? (
                        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>Served in the PG dining area. No delivery charge.</p>
                      ) : (
                        <>
                          <div style={{ fontSize: 13, margin: "14px 0 8px" }}>How do you want to get your food?</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {[
                              { id: "delivery", label: `🛵 Delivery (+₹${selectedSource.deliveryFee})`, note: selectedSource.eta },
                              { id: "pickup", label: "🏃 Pickup from kitchen (Free)", note: `${selectedSource.pickupDistance} away` },
                            ].map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => setFulfilment(o.id)}
                                style={{
                                  flex: 1,
                                  minWidth: 180,
                                  textAlign: "left",
                                  padding: "8px 12px",
                                  borderRadius: 10,
                                  border: fulfilment === o.id ? "2px solid var(--teal)" : "1px solid var(--border)",
                                  background: fulfilment === o.id ? "rgba(0,184,148,0.08)" : "transparent",
                                  color: "var(--text)",
                                  cursor: "pointer",
                                }}
                              >
                                <strong style={{ display: "block", fontSize: 13 }}>{o.label}</strong>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>{o.note}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {plan === "order" && (
                    <button
                      type="button"
                      onClick={() => setShowWeek(!showWeek)}
                      style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: 13, padding: 0 }}
                    >
                      {showWeek ? "Hide weekly menu" : "📅 View weekly menu"}
                    </button>
                  )}

                  {weekVisible && weekMenu.length > 0 && (
                    <div style={{ marginTop: 10, overflowX: "auto" }}>
                      <div style={{ minWidth: 520, border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 1fr", padding: "6px 10px", fontWeight: "bold", borderBottom: "1px solid var(--border)" }}>
                          <span>Day</span><span>Breakfast</span><span>Lunch</span><span>Dinner</span>
                        </div>
                        {weekMenu.map((d) => (
                          <div key={d.day} style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 1fr", padding: "6px 10px", borderBottom: "1px solid var(--border)", gap: 6 }}>
                            <strong>{d.day.slice(0, 3)}</strong><span>{d.breakfast}</span><span>{d.lunch}</span><span>{d.dinner}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
                    {plan === "order" ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Food total ({itemCount} item{itemCount === 1 ? "" : "s"})</span><span>₹{foodTotal}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span>{selectedSource.dineIn ? "Dine-in (no delivery charge)" : fulfilment === "pickup" ? "Pickup (no delivery charge)" : "Delivery charge"}</span>
                          <span>₹{deliveryCharge}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>{plan === "weekly" ? "Weekly" : "Monthly"} plan (3 meals a day)</span><span>₹{planPrice}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span>{selectedSource.dineIn ? "Served in PG dining area" : "Delivery"}</span><span>{selectedSource.dineIn ? "₹0" : "Included"}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontWeight: "bold", color: "var(--teal)", fontSize: 15 }}>
                      <span>Total</span><span>₹{mealGrandTotal}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="pill" onClick={saveMealChoice}>
                  {selectedSource?.id === "own" ? "Save Meal Choice" : plan === "order" ? "Place Order" : "Subscribe"}
                </button>
                {mealMsg && <span style={{ fontSize: 13, color: "var(--teal)" }}>{mealMsg}</span>}
              </div>
            </div>
          </div>

          {/* Guest Stay */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Guest Stay</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
              Guests can stay up to {GUEST_FREE_NIGHTS_PER_MONTH} nights a month at a per-night price. For more than {GUEST_FREE_NIGHTS_PER_MONTH} nights, the whole month's charge applies.
            </p>

            <form onSubmit={submitGuestRequest}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>Where will your guest stay?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {[
                  { id: "same", label: "🛏️ Same room", note: "Stays in your room" },
                  { id: "other", label: "🚪 Other room", note: "Separate room for the guest" },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setGuestForm({ ...guestForm, stayType: o.id })}
                    style={{
                      flex: 1,
                      minWidth: 160,
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: guestForm.stayType === o.id ? "2px solid var(--teal)" : "1px solid var(--border)",
                      background: guestForm.stayType === o.id ? "rgba(0,184,148,0.08)" : "transparent",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ display: "block", fontSize: 13 }}>{o.label}</strong>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{o.note}</span>
                  </button>
                ))}
              </div>

              {guestForm.stayType === "other" && (
                <select
                  className="input"
                  style={{ width: "100%", marginBottom: 12 }}
                  value={guestForm.otherRoom}
                  onChange={(e) => setGuestForm({ ...guestForm, otherRoom: e.target.value })}
                >
                  {GUEST_OTHER_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label} (₹{r.rent}/mo)</option>
                  ))}
                </select>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <input
                  className="input"
                  placeholder="Guest name"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Guest phone"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                />
                <input
                  type="date"
                  className="input"
                  min={new Date().toISOString().split("T")[0]}
                  value={guestForm.date}
                  onChange={(e) => setGuestForm({ ...guestForm, date: e.target.value })}
                />
                <select
                  className="input"
                  value={guestForm.nights}
                  onChange={(e) => setGuestForm({ ...guestForm, nights: e.target.value })}
                >
                  <option value={1}>1 night</option>
                  <option value={2}>2 nights</option>
                  <option value={3}>More than 2 nights (full month)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {guestIsMonthly()
                      ? `More than ${GUEST_FREE_NIGHTS_PER_MONTH} nights this month: full month charge`
                      : `₹${guestPerNight()} per night × ${guestForm.nights}`}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: "bold", color: "var(--teal)" }}>Guest charge: ₹{guestTotal()}</div>
                </div>
                <button className="pill">Request Guest Stay</button>
              </div>

              <button
                type="button"
                onClick={() => setShowGuestTerms(!showGuestTerms)}
                style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: 13, padding: 0 }}
              >
                {showGuestTerms ? "Hide guest stay terms" : "Read guest stay terms & conditions"}
              </button>

              {showGuestTerms && (
                <ol style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                  {GUEST_TERMS.map((t, idx) => <li key={idx} style={{ marginBottom: 4 }}>{t}</li>)}
                </ol>
              )}

              <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={guestTermsAccepted} onChange={(e) => setGuestTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
                <span>I have read and agree to the guest stay terms. I am responsible for any damage by my guest.</span>
              </label>
            </form>

            {guestMsg && <p style={{ fontSize: 13, color: "var(--teal)", marginTop: 10 }}>{guestMsg}</p>}

            {guestRequests.length > 0 && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {guestRequests.map((g, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
                  >
                    <span>
                      <strong>{g.name}</strong> · {formatDate(g.date)} · {g.monthly ? "Full month" : `${g.nights} night${g.nights > 1 ? "s" : ""}`} · {g.roomLabel}
                    </span>
                    <span>₹{g.total} · {g.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Cleaning Appointment Scheduler */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Schedule Room Cleaning</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>Book a cleaning session or switch to self-cleaning preference.</p>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <button
                className={`pill ${cleaningSlot.type === "schedule" ? "" : "secondary"}`}
                onClick={() => setCleaningSlot({ ...cleaningSlot, type: "schedule" })}
              >
                Book Slot
              </button>
              <button
                className={`pill ${cleaningSlot.type === "self" ? "" : "secondary"}`}
                onClick={() => setCleaningSlot({ ...cleaningSlot, type: "self" })}
              >
                Self Cleaning
              </button>
            </div>

            {cleaningSlot.type === "schedule" ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="date"
                  className="input"
                  value={cleaningSlot.date}
                  onChange={(e) => setCleaningSlot({ ...cleaningSlot, date: e.target.value })}
                />
                <select
                  className="input"
                  value={cleaningSlot.time}
                  onChange={(e) => setCleaningSlot({ ...cleaningSlot, time: e.target.value })}
                >
                  <option>09:00 AM - 11:00 AM</option>
                  <option>11:00 AM - 01:00 PM</option>
                  <option>04:00 PM - 06:00 PM</option>
                </select>
                <button className="pill" onClick={() => alert("Cleaning slot booked!")}>Confirm Appointment</button>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>You have opted for self-cleaning. Cleaning tools can be requested from the warden.</p>
            )}
          </div>

          {/* Complaints & Requests */}
          <div className="card card-pad">
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Help & Complaints</h3>
            <form onSubmit={submitComplaint} style={{ marginBottom: 16 }}>
              <textarea
                className="input"
                rows={3}
                placeholder="Raise an issue (e.g. WiFi issue, plumbing problem)..."
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
              />
              <button className="pill" style={{ marginTop: 10 }}>Submit Complaint</button>
            </form>
            {msg && <p style={{ fontSize: 13, color: "var(--teal)" }}>{msg}</p>}
          </div>
        </div>

        {/* Sidebar Features */}
        <div>
          <SinglePGMap latitude={pg.latitude} longitude={pg.longitude} name={pg.name} address={pg.address} tall />

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Digital Room Key</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Use your passkey for smart entry access.</p>
            {booking ? (
              <Link to={`/digital-key/${booking.id}`} className="pill" style={{ display: "block", textAlign: "center", background: "#00b894", border: "none" }}>
                View Smart Digital Passcode
              </Link>
            ) : (
              <button className="pill" disabled style={{ width: "100%", background: "#ccc", border: "none" }}>
                Key Available Upon Booking
              </button>
            )}
          </div>

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Owner / Warden Contact</h3>
            <p style={{ fontSize: 14 }}><strong>Name:</strong> {pg.owner_name || "Host Manager"}</p>
            <p style={{ fontSize: 14, marginTop: 4 }}><strong>Phone:</strong> +91 {pg.owner_phone || "9876543210"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}