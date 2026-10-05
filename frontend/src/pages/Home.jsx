import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CreditCard,
  DoorOpen,
  House,
  LockKeyhole,
  LockKeyholeOpen,
  MapPin,
  Search,
  Smartphone,
  Star,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api.js";
import DoorDemo from "../components/DoorDemo.jsx";
import AccessDemoSection from "../components/AccessDemoSection.jsx";
import RoomStatusNote from "../components/RoomStatusNote.jsx";
import useDoorAccess from "../components/useDoorAccess.js";

const STATUS_REFRESH_MS = 15000; // lock / unlock status refreshes automatically

// How a resident gets into the room and how the room's electricity follows the lock
const ACCESS_STEPS = [
  {
    icon: CreditCard,
    title: "Get your key",
    text: "Once the owner approves your booking you get two keys: a physical key card and a digital key card in the app. Either one opens your room.",
  },
  {
    icon: LockKeyholeOpen,
    title: "Scan to unlock",
    text: "Tap your key card (or show the digital card) at the door reader. The room unlocks and electricity in your room switches on.",
  },
  {
    icon: LockKeyhole,
    title: "Scan to lock",
    text: "Scan the card again when you leave. The room locks and the electricity supply to your room is disconnected until you unlock it again.",
  },
  {
    icon: Smartphone,
    title: "See it live in the app",
    text: "Every lock and unlock shows up on this Home page, along with whether electricity in your room is on or off.",
  },
];

// Detailed guide (sample wording - owner should finalise these to match the actual door readers)
const ACCESS_METHODS = [
  {
    icon: CreditCard,
    title: "Physical key card",
    points: [
      "Handed to you by the owner or warden on the day you move in.",
      "Tap it flat on the card reader next to your door and hold it for a second.",
      "A green light and a beep mean the scan worked.",
    ],
  },
  {
    icon: Smartphone,
    title: "Digital key card",
    points: [
      "Appears in the app as soon as the owner approves your booking.",
      "Open the app, go to Digital Room Key and show your passcode or QR to the reader.",
      "Works even if you forget the physical card, as long as your phone has battery and internet.",
    ],
  },
];

const UNLOCK_STEPS = [
  "Stand at your room door and keep your key card or phone ready.",
  "Tap the physical card on the reader, or open the Digital Room Key in the app and show it to the reader.",
  "Wait for the green light and beep. The door unlocks.",
  "Push the door open. Electricity in your room switches on automatically.",
  "Check this Home page: Room shows Unlocked and Electricity shows On.",
];

const LOCK_STEPS = [
  "Before you leave, switch off what you don't need (fan, lights, charger).",
  "Step out and close the door behind you.",
  "Tap the same key card, or show the digital key, on the reader once more.",
  "Wait for the lock beep. The door locks and electricity to your room is disconnected.",
  "Check this Home page: Room shows Locked and Electricity shows Off.",
];

const ACCESS_HELP = [
  { q: "Always lock when you leave", a: "Electricity stays on while the room is unlocked. Scanning to lock cuts the supply to your room." },
  { q: "Lost your key card?", a: "Tell the owner or warden right away so the old card can be disabled and a new one issued. Your digital key keeps working meanwhile." },
  { q: "Door not responding?", a: "Try the other key (physical or digital), then scan again. If it still fails, contact the owner or warden from the contact details on your dashboard." },
  { q: "Status not updating?", a: "Home refreshes every few seconds. If it looks stale, reload the page after your scan." },
];

export default function Home() {
  const { user } = useAuth();
  // The app is for everyone, not only students: any logged-in user except the PG owner can be a resident
  const isResident = !!user && user.role !== "owner";
  const [keyData, setKeyData] = useState(null);
  const [loadingKey, setLoadingKey] = useState(false);
  useEffect(() => {
    if (!isResident) {
      setKeyData(null);
      return;
    }

    let cancelled = false;

    const loadKey = (showLoader) => {
      if (showLoader) setLoadingKey(true);
      api
        .get("/bookings/student/mine")
        .then(({ data }) => {
          if (cancelled) return;
          const withKey = data.bookings.find((b) => b.digital_key);
          setKeyData(withKey || null);
        })
        .catch(() => {
          if (!cancelled && showLoader) setKeyData(null);
        })
        .finally(() => {
          if (!cancelled && showLoader) setLoadingKey(false);
        });
    };

    loadKey(true);
    // Keep the lock / unlock status up to date while the page is open
    const timer = setInterval(() => loadKey(false), STATUS_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user]); // eslint-disable-line

  // Room lock state comes from the booking (lock_status: "locked" | "unlocked"). If it is missing, treat the room as locked.
  const isLocked = keyData ? keyData.lock_status !== "unlocked" : true;

  // Demo door state shared by the "Try it" door and the Track preview.
  // Frontend only: no backend or database calls.
  const door = useDoorAccess();
  const [showTrack, setShowTrack] = useState(false);
  const [doorPhase, setDoorPhase] = useState("idle"); // what the door is doing: idle, dragging, over, scanning, error

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Private-room PGs &amp; PG organizer</div>
            <h1>Your own room, perfectly organized.</h1>
            <p className="lead">
              Every room on Roomly is for one person only — no sharing, ever. Find a PG from verified
              owners, read ratings from people who've actually lived there, see exactly where it is on
              the map, and get a digital key the day you move in.
            </p>
            <div className="hero-actions">
              <Link to="/browse" className="pill">Browse PGs</Link>
              <Link to="/register" className="pill ghost">List your PG</Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
              For students, professionals and everyone in between.
            </p>

            {/* Opens the room activity preview (status + lock/unlock history) */}
            <div style={{ marginTop: 14 }}>
              <button type="button" className="pill ghost small" style={{ display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => setShowTrack(true)}>
                <MapPin size={16} aria-hidden="true" /> Track room activity
              </button>
            </div>
            <AccessDemoSection
              open={showTrack}
              onClose={() => setShowTrack(false)}
              locked={door.locked}
              live={door.live}
              rows={door.rows}
            />
          </div>

          <div className="keytag">
            <div className="keytag-hole" />

            {!user ? (
              <div className="keytag-empty">
                <p>Log in to see your digital room key</p>
              </div>
            ) : !isResident ? (
              <div className="keytag-empty">
                <p>Digital keys are issued to residents once a booking is approved</p>
              </div>
            ) : loadingKey ? (
              <div className="keytag-empty">
                <p>Loading your digital key…</p>
              </div>
            ) : !keyData ? (
              <div className="keytag-empty">
                <p>Your digital key will appear here once a PG owner approves your booking request</p>
              </div>
            ) : (
              <>
                <div className="keytag-row">
                  <div>
                    <small>Digital Room Key</small>
                    <div className="keycode mono">{keyData.digital_key}</div>
                  </div>
                  <span className="keytag-status">
                    <span className="status-dot" /> Active
                  </span>
                </div>

                {/* Live room status: lock state + electricity follow each other */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: `1px solid ${isLocked ? "#E67E22" : "#00B894"}`,
                      background: isLocked ? "rgba(230,126,34,0.12)" : "rgba(0,184,148,0.12)",
                    }}
                  >
                    <small style={{ display: "block", color: "#C7CAE0", fontSize: 11 }}>Room</small>
                    <strong style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, color: isLocked ? "#E67E22" : "#00B894" }}>
                      {isLocked ? <><LockKeyhole size={16} aria-hidden="true" /> Locked</> : <><LockKeyholeOpen size={16} aria-hidden="true" /> Unlocked</>}
                    </strong>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: `1px solid ${isLocked ? "#E67E22" : "#00B894"}`,
                      background: isLocked ? "rgba(230,126,34,0.12)" : "rgba(0,184,148,0.12)",
                    }}
                  >
                    <small style={{ display: "block", color: "#C7CAE0", fontSize: 11 }}>Electricity</small>
                    <strong style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, color: isLocked ? "#E67E22" : "#00B894" }}>
                      {isLocked ? <><Zap size={16} aria-hidden="true" /> Off</> : <><Zap size={16} aria-hidden="true" /> On</>}
                    </strong>
                  </div>
                </div>

                <div style={{ color: "#C7CAE0", fontSize: 13, lineHeight: 1.5 }}>
                  Issued the moment your owner approved your booking — scan your card at the door to unlock or lock, no physical key handover needed.
                  {isLocked
                    ? " Electricity in your room is off while the room is locked."
                    : " Electricity in your room is on while the room is unlocked."}
                </div>
                <div className="keytag-qr">
                  <div className="qr-pattern">
                    {Array.from({ length: 81 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          keyData.digital_key.charCodeAt(i % keyData.digital_key.length) % 3 !== 0
                            ? "on"
                            : ""
                        }
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How room access works */}
      <section className="container">
        <div className="section-title"><h2>How room access works</h2></div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16, maxWidth: 680 }}>
          Your room opens only with your key card. The same scan that locks or unlocks the door also controls the
          electricity in your room, and the app always shows the current status.
        </p>
        <div className="grid cols-4">
          {ACCESS_STEPS.map((s) => (
            <div className="card card-pad" key={s.title}>
              <div className="how-card-icon"><s.icon size={24} strokeWidth={1.8} aria-hidden="true" /></div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>{s.text}</p>
            </div>
          ))}
        </div>

        {/* Interactive demo: drag the key onto the reader (demo only) */}
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>Try it: unlock your room</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 14 }}>
            Drag the digital key onto the door reader. Do it again to lock.
          </p>
          <div className="dd-row">
            <DoorDemo
              locked={door.locked}
              onToggle={door.toggle}
              live={door.live}
              onPhase={setDoorPhase}
            />
            <RoomStatusNote locked={door.locked} phase={doorPhase} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid var(--teal)",
            background: "rgba(0,184,148,0.08)",
          }}
        >
          <Zap size={22} aria-hidden="true" />
          <span style={{ fontSize: 14 }}>
            <strong style={{ color: "var(--teal)" }}>No electricity bills.</strong>{" "}
            Electricity is included in your rent. It is only switched off while your room is locked.
          </span>
        </div>
      </section>

      {/* Detailed guide: how to access, unlock and lock the room */}
      <section className="container">
        <div className="section-title"><h2>How to access your room</h2></div>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16, maxWidth: 680 }}>
          You need a key to enter your room. You get two: a physical key card and a digital key card. Use whichever is handy.
        </p>
        <div className="grid cols-2">
          {ACCESS_METHODS.map((m) => (
            <div className="card card-pad" key={m.title}>
              <div className="how-card-icon"><m.icon size={24} strokeWidth={1.8} aria-hidden="true" /></div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{m.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
                {m.points.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {keyData && (
          <div style={{ marginTop: 14 }}>
            <Link to={`/digital-key/${keyData.id}`} className="pill">Open my digital key card</Link>
          </div>
        )}
      </section>

      <section className="container">
        <div className="section-title"><h2>How to unlock and lock your room</h2></div>
        <div className="grid cols-2">
          <div className="card card-pad">
            <div className="how-card-icon"><LockKeyholeOpen size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Unlock the room</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>Door opens and electricity turns on.</p>
            <ol style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              {UNLOCK_STEPS.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
            </ol>
          </div>

          <div className="card card-pad">
            <div className="how-card-icon"><LockKeyhole size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Lock the room</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>Door locks and electricity is disconnected.</p>
            <ol style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              {LOCK_STEPS.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
            </ol>
          </div>
        </div>

        <div className="card card-pad" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Good to know</h3>
          {ACCESS_HELP.map((h) => (
            <div key={h.q} style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }}>
              <strong style={{ fontSize: 14 }}>{h.q}</strong>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{h.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="section-title"><h2>Why Roomly</h2></div>
        <div className="grid cols-3">
          <div className="card card-pad">
            <div className="how-card-icon"><DoorOpen size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>One room, one person</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Every listing is a single-occupancy room. No roommates, no shared beds, no surprises.
            </p>
          </div>

          <div className="card card-pad">
            <div className="how-card-icon"><BadgeCheck size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Verified owners and stays</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Owners are verified and reviews come only from people who actually stayed.
            </p>
          </div>

          <div className="card card-pad">
            <div className="how-card-icon"><LayoutDashboard size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Organized for owners too</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Manage rooms, requests, occupancy and digital keys from a single dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-title"><h2>How Roomly works</h2></div>
        <div className="grid cols-3">
          <div className="card card-pad how-card">
            <div className="how-card-icon"><Search size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <div className="eyebrow">For residents</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Search &amp; compare</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Filter by locality, price, WiFi and more. See every private-room PG on a live map before you shortlist.
            </p>
            <div className="how-card-extra">
              <p>Save shortlists, compare up to 4 PGs side-by-side, and get notified when prices drop in your saved localities.</p>
            </div>
          </div>

          <div className="card card-pad how-card">
            <div className="how-card-icon"><Star size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <div className="eyebrow">For residents</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Rate what matters</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Cleanliness, WiFi, price-for-value, safety and owner behaviour — rated separately so nothing hides behind a single star score.
            </p>
            <div className="how-card-extra">
              <p>Every review is tied to a verified stay, so you're reading real experiences — not paid promotions.</p>
            </div>
          </div>

          <div className="card card-pad how-card">
            <div className="how-card-icon"><House size={24} strokeWidth={1.8} aria-hidden="true" /></div>
            <div className="eyebrow">For owners</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>List in minutes</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Pin your PG on the map, add private rooms and utilities, and manage booking requests from one dashboard.
            </p>
            <div className="how-card-extra">
              <p>Track occupancy in real time, approve or reject requests instantly, and issue digital keys the moment a booking is confirmed.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}