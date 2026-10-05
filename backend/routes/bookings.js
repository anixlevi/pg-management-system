import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateDigitalKey, keyToQrDataUrl } from "../utils/key.js";

const router = Router();

router.post("/", requireAuth, requireRole("student"), (req, res) => {
  const { pg_id } = req.body;
  const pg = db.prepare("SELECT * FROM pgs WHERE id = ?").get(pg_id);
  if (!pg) return res.status(404).json({ error: "PG not found" });
  if (pg.available_rooms < 1) return res.status(400).json({ error: "No rooms available right now" });

  const existing = db
    .prepare("SELECT * FROM bookings WHERE student_id = ? AND pg_id = ? AND status IN ('pending','approved')")
    .get(req.user.id, pg_id);
  if (existing) return res.status(409).json({ error: "You already have a request for this PG" });

  const info = db
    .prepare("INSERT INTO bookings (student_id, pg_id, status) VALUES (?,?,'pending')")
    .run(req.user.id, pg_id);
  res.status(201).json({ booking: db.prepare("SELECT * FROM bookings WHERE id = ?").get(info.lastInsertRowid) });
});

router.get("/student/mine", requireAuth, requireRole("student"), (req, res) => {
  const rows = db
    .prepare(`SELECT bookings.*, pgs.name AS pg_name, pgs.locality, pgs.city, pgs.price
      FROM bookings JOIN pgs ON pgs.id = bookings.pg_id
      WHERE bookings.student_id = ? ORDER BY bookings.created_at DESC`)
    .all(req.user.id);
  res.json({ bookings: rows });
});

router.get("/owner/mine", requireAuth, requireRole("owner"), (req, res) => {
  const rows = db
    .prepare(`SELECT bookings.*, pgs.name AS pg_name, users.name AS student_name, users.phone AS student_phone
      FROM bookings
      JOIN pgs ON pgs.id = bookings.pg_id
      JOIN users ON users.id = bookings.student_id
      WHERE pgs.owner_id = ? ORDER BY bookings.created_at DESC`)
    .all(req.user.id);
  res.json({ bookings: rows });
});

router.put("/:id/status", requireAuth, requireRole("owner"), (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const booking = db
    .prepare(`SELECT bookings.*, pgs.owner_id AS pg_owner_id, pgs.id as pg_id, pgs.available_rooms
      FROM bookings JOIN pgs ON pgs.id = bookings.pg_id WHERE bookings.id = ?`)
    .get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.pg_owner_id !== req.user.id) return res.status(403).json({ error: "Not your listing" });

  let digitalKey = booking.digital_key;
  if (status === "approved" && !digitalKey) {
    digitalKey = generateDigitalKey();
    db.prepare("UPDATE pgs SET available_rooms = MAX(available_rooms - 1, 0) WHERE id = ?").run(booking.pg_id);
  }
  db.prepare("UPDATE bookings SET status = ?, digital_key = ? WHERE id = ?").run(status, digitalKey, req.params.id);
  res.json({ booking: db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id) });
});

router.get("/:id/key", requireAuth, requireRole("student"), async (req, res) => {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.student_id !== req.user.id) return res.status(403).json({ error: "Not your booking" });
  if (!booking.digital_key) {
    return res.status(400).json({ error: "Digital key is available only after the owner approves your request" });
  }
  const qr = await keyToQrDataUrl(booking.digital_key);
  res.json({ digital_key: booking.digital_key, qr_code: qr });
});

export default router;
