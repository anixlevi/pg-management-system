import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Building2,
  CalendarCheck,
  MapPin,
  BedDouble,
  IndianRupee,
  Star,
  Phone,
  Check,
  X,
  CheckCircle2,
  ClipboardList,
  House,
  DoorOpen,
  LockKeyhole,
  LockKeyholeOpen,
} from "lucide-react";
import api from "../api.js";
import RatingStars from "../components/RatingStars.jsx";

const DOOR_REFRESH_MS = 15000;

export default function OwnerDashboard() {
  const [pgs, setPgs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("listings");

  const [doorRooms, setDoorRooms] = useState([]);
  const [doorEvents, setDoorEvents] = useState([]);

  const load = async () => {
    const [p, b] = await Promise.all([
      api.get("/pgs/owner/mine"),
      api.get("/bookings/owner/mine"),
    ]);
    setPgs(p.data.pgs);
    setBookings(b.data.bookings);
  };

  const loadDoor = () =>
    api
      .get("/door/owner/events")
      .then(({ data }) => {
        setDoorRooms(data.rooms || []);
        setDoorEvents(data.events || []);
      })
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  // Door status refreshes by itself while the dashboard is open
  useEffect(() => {
    loadDoor();
    const t = setInterval(loadDoor, DOOR_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  // Owner locks / unlocks a resident's room
  const [busyRoom, setBusyRoom] = useState(null);
  const [doorError, setDoorError] = useState("");
  const toggleRoom = async (bookingId, currentlyLocked) => {
    if (busyRoom) return;
    setBusyRoom(bookingId);
    setDoorError("");
    try {
      await api.post(`/door/owner/${bookingId}/toggle`, {
        lock_status: currentlyLocked ? "unlocked" : "locked",
      });
      await loadDoor();
    } catch (err) {
      setDoorError(err.response?.data?.error || "Could not change the door. Try again.");
    } finally {
      setBusyRoom(null);
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/bookings/${id}/status`, { status });
    load();
    loadDoor();
  };

  const getPgImage = (pg) =>
    pg.image_url ||
    pg.photo ||
    (Array.isArray(pg.images) && pg.images.length > 0 ? pg.images[0] : null);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <div className="section-title">
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={25} strokeWidth={1.8} aria-hidden="true" />
          Owner dashboard
        </h2>
        <Link to="/owner/add-pg" className="pill">
          <Plus size={17} style={{ verticalAlign: "middle", marginRight: 6 }} />
          List a new PG
        </Link>
      </div>

      <div className="role-toggle" style={{ maxWidth: 560, marginBottom: 24 }}>
        <button
          className={tab === "listings" ? "active" : ""}
          onClick={() => setTab("listings")}
          type="button"
        >
          <House size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />
          My listings
        </button>
        <button
          className={tab === "bookings" ? "active" : ""}
          onClick={() => setTab("bookings")}
          type="button"
        >
          <CalendarCheck size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />
          Booking requests
        </button>
        <button
          className={tab === "door" ? "active" : ""}
          onClick={() => setTab("door")}
          type="button"
        >
          <DoorOpen size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />
          Door activity
        </button>
      </div>

      {tab === "listings" &&
        (pgs.length === 0 ? (
          <div
            className="badge-empty"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <Building2 size={20} strokeWidth={1.8} />
            You haven't listed a PG yet.
          </div>
        ) : (
          <div className="grid cols-3">
            {pgs.map((pg) => {
              const imgSrc = getPgImage(pg);
              return (
                <Link
                  to={`/pg/${pg.id}`}
                  key={pg.id}
                  className="pg-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="pg-card-img">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={pg.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16 }}>
                        <Building2 size={22} strokeWidth={1.7} />
                        <span>{pg.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="pg-card-body">
                    <div className="pg-card-top">
                      <div>
                        <h3>{pg.name}</h3>
                        <div className="locality" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={14} strokeWidth={1.8} />
                          {pg.locality}, {pg.city}
                        </div>
                      </div>
                      <div className="price-tag" style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <IndianRupee size={14} />
                        {pg.price}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "8px 0" }}>
                      <Star size={15} strokeWidth={1.8} />
                      <RatingStars value={pg.rating.overall} count={pg.rating.count} />
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <BedDouble size={15} strokeWidth={1.8} />
                      {pg.available_rooms}/{pg.total_rooms} rooms free
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

      {tab === "bookings" &&
        (bookings.length === 0 ? (
          <div
            className="badge-empty"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <ClipboardList size={20} strokeWidth={1.8} />
            No booking requests yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Building2 size={15} /> Student</span></th>
                  <th>PG</th>
                  <th><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Phone size={15} /> Phone</span></th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.student_name}</td>
                    <td>{b.pg_name}</td>
                    <td>{b.student_phone || "—"}</td>
                    <td>
                      <span className={`status-tag ${b.status}`}>{b.status}</span>
                    </td>
                    <td>
                      {b.status === "pending" && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="pill small teal"
                            onClick={() => updateStatus(b.id, "approved")}
                            type="button"
                          >
                            <Check size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            Approve
                          </button>
                          <button
                            className="pill small rust"
                            onClick={() => updateStatus(b.id, "rejected")}
                            type="button"
                          >
                            <X size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            Reject
                          </button>
                        </div>
                      )}
                      {b.status === "approved" && (
                        <button
                          className="pill small ghost"
                          onClick={() => updateStatus(b.id, "completed")}
                          type="button"
                        >
                          <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                          Mark completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "door" &&
        (doorRooms.length === 0 ? (
          <div
            className="badge-empty"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <DoorOpen size={20} strokeWidth={1.8} />
            No digital keys issued yet. Approve a booking first.
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Rooms right now</h3>
            {doorError && <div style={{ color: "#E67E22", fontSize: 13, marginBottom: 10 }}>{doorError}</div>}
            <div style={{ overflowX: "auto", marginBottom: 28 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>PG</th>
                    <th>Room</th>
                    <th>Electricity</th>
                    <th>Control</th>
                  </tr>
                </thead>
                <tbody>
                  {doorRooms.map((r) => {
                    const info = bookings.find((b) => b.id === r.booking_id);
                    const locked = r.lock_status !== "unlocked";
                    const color = locked ? "#E67E22" : "#00B894";
                    return (
                      <tr key={r.booking_id}>
                        <td>{info?.student_name || `Booking #${r.booking_id}`}</td>
                        <td>{info?.pg_name || "—"}</td>
                        <td style={{ color, fontWeight: 600 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {locked ? <LockKeyhole size={15} /> : <LockKeyholeOpen size={15} />}
                            {locked ? "Locked" : "Unlocked"}
                          </span>
                        </td>
                        <td style={{ color, fontWeight: 600 }}>{locked ? "Off" : "On"}</td>
                        <td>
                          <button
                            type="button"
                            className="pill small ghost"
                            disabled={busyRoom === r.booking_id}
                            onClick={() => toggleRoom(r.booking_id, locked)}
                          >
                            {busyRoom === r.booking_id ? "Please wait…" : locked ? "Unlock" : "Lock"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: 18, marginBottom: 10 }}>Recent lock / unlock events</h3>
            {doorEvents.length === 0 ? (
              <div className="badge-empty">No lock or unlock events yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Resident</th>
                      <th>PG</th>
                      <th>Event</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doorEvents.map((e) => {
                      const info = bookings.find((b) => b.id === e.booking_id);
                      return (
                        <tr key={e.id}>
                          <td>
                            {new Date(e.at).toLocaleString([], {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>{info?.student_name || `Booking #${e.booking_id}`}</td>
                          <td>{info?.pg_name || "—"}</td>
                          <td>{e.lock_status === "unlocked" ? "Unlocked" : "Locked"}</td>
                          <td>
                            {e.source === "app"
                              ? "Digital key (app)"
                              : e.source === "owner"
                              ? "Owner"
                              : "Key card at door"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ))}
    </div>
  );
}