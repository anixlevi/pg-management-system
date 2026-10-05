import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/pg/:pgId", (req, res) => {
  const rows = db
    .prepare(`SELECT ratings.*, users.name AS student_name FROM ratings
      JOIN users ON users.id = ratings.student_id
      WHERE pg_id = ? ORDER BY ratings.created_at DESC`)
    .all(req.params.pgId);
  res.json({ ratings: rows });
});

router.post("/", requireAuth, requireRole("student"), (req, res) => {
  const { pg_id, cleanliness, wifi_rating, price_value, safety, owner_behavior, comment } = req.body;
  const vals = [cleanliness, wifi_rating, price_value, safety, owner_behavior];
  if (!pg_id || vals.some((v) => !v || v < 1 || v > 5)) {
    return res.status(400).json({ error: "pg_id and all 5 ratings (1-5) are required" });
  }
  const pg = db.prepare("SELECT id FROM pgs WHERE id = ?").get(pg_id);
  if (!pg) return res.status(404).json({ error: "PG not found" });

  try {
    db.prepare(`INSERT INTO ratings (pg_id, student_id, cleanliness, wifi_rating, price_value, safety, owner_behavior, comment)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(pg_id, student_id) DO UPDATE SET
        cleanliness=excluded.cleanliness, wifi_rating=excluded.wifi_rating, price_value=excluded.price_value,
        safety=excluded.safety, owner_behavior=excluded.owner_behavior, comment=excluded.comment`)
      .run(pg_id, req.user.id, cleanliness, wifi_rating, price_value, safety, owner_behavior, comment || "");
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not save rating" });
  }
});

export default router;
