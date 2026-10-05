import { Router } from "express";
import crypto from "crypto";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Secret shared with the real door reader / device. Change it, or set DOOR_DEVICE_SECRET in the environment.
const DEVICE_SECRET = process.env.DOOR_DEVICE_SECRET || "change-me-door-secret";

/* ---------- One-time setup (safe to run on every start) ---------- */

// Every real lock / unlock is stored here, so the history survives page reloads
db.exec(`
  CREATE TABLE IF NOT EXISTS door_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    lock_status TEXT NOT NULL,
    source TEXT NOT NULL,
    at TEXT NOT NULL
  )
`);

// Current lock state of each booking's room. New and old rows are treated as "locked".
const bookingColumns = db.prepare("PRAGMA table_info(bookings)").all();
if (!bookingColumns.some((c) => c.name === "lock_status")) {
  db.exec("ALTER TABLE bookings ADD COLUMN lock_status TEXT DEFAULT 'locked'");
}

// Passkey (PIN) for locking / unlocking from the app. Only a salted hash is stored, never the PIN itself.
for (const [name, def] of [
  ["pin_hash", "TEXT"],
  ["pin_salt", "TEXT"],
  ["pin_fails", "INTEGER DEFAULT 0"],
  ["pin_locked_until", "TEXT"],
]) {
  if (!bookingColumns.some((c) => c.name === name)) {
    db.exec(`ALTER TABLE bookings ADD COLUMN ${name} ${def}`);
  }
}

/* ---------- Helpers ---------- */

const VALID = ["locked", "unlocked"];

const PIN_RE = /^\d{4,6}$/;
const MAX_PIN_FAILS = 5;
const PIN_LOCK_MS = 5 * 60 * 1000;

function hashPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 32).toString("hex");
}

// Checks the passkey. Returns true (and has already sent the error response) if the request must stop.
function rejectBadPin(booking, pin, res) {
  if (!booking.pin_hash) {
    res.status(403).json({ error: "Set a passkey first", code: "NO_PIN" });
    return true;
  }
  if (booking.pin_locked_until && new Date(booking.pin_locked_until) > new Date()) {
    res.status(429).json({ error: "Too many wrong attempts. Try again in a few minutes." });
    return true;
  }

  const p = String(pin ?? "");
  const ok =
    PIN_RE.test(p) &&
    crypto.timingSafeEqual(
      Buffer.from(hashPin(p, booking.pin_salt), "hex"),
      Buffer.from(booking.pin_hash, "hex")
    );

  if (!ok) {
    const fails = (booking.pin_fails || 0) + 1;
    if (fails >= MAX_PIN_FAILS) {
      db.prepare("UPDATE bookings SET pin_fails = 0, pin_locked_until = ? WHERE id = ?").run(
        new Date(Date.now() + PIN_LOCK_MS).toISOString(),
        booking.id
      );
      res.status(429).json({ error: "Too many wrong attempts. Try again in 5 minutes." });
    } else {
      db.prepare("UPDATE bookings SET pin_fails = ? WHERE id = ?").run(fails, booking.id);
      res.status(401).json({ error: `Wrong passkey. ${MAX_PIN_FAILS - fails} attempts left.` });
    }
    return true;
  }

  if (booking.pin_fails) {
    db.prepare("UPDATE bookings SET pin_fails = 0, pin_locked_until = NULL WHERE id = ?").run(booking.id);
  }
  return false;
}

// Saves the new state and writes a history event ONLY when the state really changes
function applyLock(booking, nextStatus, source) {
  const current = booking.lock_status === "unlocked" ? "unlocked" : "locked";
  if (current === nextStatus) return false;

  db.prepare("UPDATE bookings SET lock_status = ? WHERE id = ?").run(nextStatus, booking.id);
  db.prepare("INSERT INTO door_events (booking_id, lock_status, source, at) VALUES (?,?,?,?)").run(
    booking.id,
    nextStatus,
    source,
    new Date().toISOString()
  );
  return true;
}

// The booking must belong to this student and already have a digital key (owner approved)
function getOwnBooking(req, res) {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return null;
  }
  if (booking.student_id !== req.user.id) {
    res.status(403).json({ error: "Not your booking" });
    return null;
  }
  if (!booking.digital_key) {
    res.status(400).json({ error: "Digital key is available only after the owner approves your request" });
    return null;
  }
  return booking;
}

/* ---------- Routes ---------- */

// Resident sets the room passkey (4 to 6 digits).
// To change an existing passkey, the current one must be sent as current_pin.
// If it is forgotten, the owner can reset it.
router.post("/:id/pin", requireAuth, requireRole("student"), (req, res) => {
  const booking = getOwnBooking(req, res);
  if (!booking) return;

  if (booking.pin_hash && rejectBadPin(booking, req.body.current_pin, res)) return;

  const pin = String(req.body.pin ?? "");
  if (!PIN_RE.test(pin)) {
    return res.status(400).json({ error: "Passkey must be 4 to 6 digits" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  db.prepare("UPDATE bookings SET pin_hash = ?, pin_salt = ?, pin_fails = 0, pin_locked_until = NULL WHERE id = ?").run(
    hashPin(pin, salt),
    salt,
    booking.id
  );
  res.json({ ok: true });
});

// Resident locks / unlocks the room from the app (digital key + passkey).
// Body: { lock_status: "locked" | "unlocked", pin: "1234" }
router.post("/:id/toggle", requireAuth, requireRole("student"), (req, res) => {
  const booking = getOwnBooking(req, res);
  if (!booking) return;

  const { lock_status, pin } = req.body;
  if (!VALID.includes(lock_status)) {
    return res.status(400).json({ error: "lock_status must be 'locked' or 'unlocked'" });
  }
  if (rejectBadPin(booking, pin, res)) return;

  const changed = applyLock(booking, lock_status, "app");
  res.json({ lock_status, changed });
});

// Real door reader (key card scan). No login, protected by the device secret header.
// Body: { digital_key, lock_status? } - if lock_status is left out, the door simply flips.
router.post("/device", (req, res) => {
  if (req.get("x-device-secret") !== DEVICE_SECRET) {
    return res.status(401).json({ error: "Invalid device secret" });
  }

  const { digital_key, lock_status } = req.body;
  if (!digital_key) return res.status(400).json({ error: "digital_key is required" });

  const booking = db.prepare("SELECT * FROM bookings WHERE digital_key = ?").get(digital_key);
  if (!booking) return res.status(404).json({ error: "Unknown key" });

  const current = booking.lock_status === "unlocked" ? "unlocked" : "locked";
  const next = VALID.includes(lock_status) ? lock_status : current === "locked" ? "unlocked" : "locked";

  const changed = applyLock(booking, next, "card");
  res.json({ lock_status: next, changed });
});

// Owner: current lock state of every approved room + latest events across all of the owner's PGs
router.get("/owner/events", requireAuth, requireRole("owner"), (req, res) => {
  const rooms = db
    .prepare(
      `SELECT b.id AS booking_id, b.lock_status, (b.pin_hash IS NOT NULL) AS has_pin
       FROM bookings b JOIN pgs p ON p.id = b.pg_id
       WHERE p.owner_id = ? AND b.digital_key IS NOT NULL`
    )
    .all(req.user.id)
    .map((r) => ({
      booking_id: r.booking_id,
      lock_status: r.lock_status === "unlocked" ? "unlocked" : "locked",
      has_pin: !!r.has_pin,
    }));

  const events = db
    .prepare(
      `SELECT e.id, e.booking_id, e.lock_status, e.source, e.at
       FROM door_events e
       JOIN bookings b ON b.id = e.booking_id
       JOIN pgs p ON p.id = b.pg_id
       WHERE p.owner_id = ?
       ORDER BY e.id DESC LIMIT 50`
    )
    .all(req.user.id);

  res.json({ rooms, events });
});

// Owner locks / unlocks a resident's room (e.g. emergency). Body: { lock_status: "locked" | "unlocked" }
router.post("/owner/:id/toggle", requireAuth, requireRole("owner"), (req, res) => {
  const booking = db
    .prepare(
      `SELECT b.* FROM bookings b JOIN pgs p ON p.id = b.pg_id
       WHERE b.id = ? AND p.owner_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: "Booking not found in your PGs" });
  if (!booking.digital_key) return res.status(400).json({ error: "No digital key issued for this booking" });

  const { lock_status } = req.body;
  if (!VALID.includes(lock_status)) {
    return res.status(400).json({ error: "lock_status must be 'locked' or 'unlocked'" });
  }

  const changed = applyLock(booking, lock_status, "owner");
  res.json({ lock_status, changed });
});

// Owner clears a resident's passkey (e.g. forgotten); the resident then sets a new one.
router.post("/owner/:id/reset-pin", requireAuth, requireRole("owner"), (req, res) => {
  const booking = db
    .prepare(
      `SELECT b.* FROM bookings b JOIN pgs p ON p.id = b.pg_id
       WHERE b.id = ? AND p.owner_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: "Booking not found in your PGs" });

  db.prepare("UPDATE bookings SET pin_hash = NULL, pin_salt = NULL, pin_fails = 0, pin_locked_until = NULL WHERE id = ?").run(
    booking.id
  );
  res.json({ ok: true });
});

// Lock / unlock history of one room (latest first)
router.get("/:id/history", requireAuth, requireRole("student"), (req, res) => {
  const booking = getOwnBooking(req, res);
  if (!booking) return;

  const events = db
    .prepare("SELECT id, lock_status, source, at FROM door_events WHERE booking_id = ? ORDER BY id DESC LIMIT 20")
    .all(booking.id);

  res.json({
    lock_status: booking.lock_status === "unlocked" ? "unlocked" : "locked",
    has_pin: !!booking.pin_hash,
    events,
  });
});

export default router;