import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function ratingSummary(pgId) {
  const rows = db.prepare("SELECT * FROM ratings WHERE pg_id = ?").all(pgId);
  if (rows.length === 0) {
    return { count: 0, overall: null, cleanliness: null, wifi_rating: null, price_value: null, safety: null, owner_behavior: null };
  }
  const avg = (key) => Math.round((rows.reduce((s, r) => s + r[key], 0) / rows.length) * 10) / 10;
  const cleanliness = avg("cleanliness");
  const wifi_rating = avg("wifi_rating");
  const price_value = avg("price_value");
  const safety = avg("safety");
  const owner_behavior = avg("owner_behavior");
  const overall = Math.round(((cleanliness + wifi_rating + price_value + safety + owner_behavior) / 5) * 10) / 10;
  return { count: rows.length, overall, cleanliness, wifi_rating, price_value, safety, owner_behavior };
}

// Public: list + filter PGs
router.get("/", (req, res) => {
  const { locality, city, maxPrice, wifi, gender, type } = req.query;
  let sql = "SELECT * FROM pgs WHERE 1=1";
  const params = [];
  if (locality) { sql += " AND locality LIKE ?"; params.push(`%${locality}%`); }
  if (city) { sql += " AND city LIKE ?"; params.push(`%${city}%`); }
  if (maxPrice) { sql += " AND price <= ?"; params.push(Number(maxPrice)); }
  if (wifi === "true") { sql += " AND wifi = 1"; }
  if (gender) { sql += " AND (gender_allowed = ? OR gender_allowed = 'any')"; params.push(gender); }
  if (type === "pg" || type === "flat") { sql += " AND property_type = ?"; params.push(type); }
  sql += " ORDER BY created_at DESC";
  const pgsList = db.prepare(sql).all(...params);
  const withRatings = pgsList.map((pg) => ({ ...pg, rating: ratingSummary(pg.id) }));
  res.json({ pgs: withRatings });
});

router.get("/owner/mine", requireAuth, requireRole("owner"), (req, res) => {
  const rows = db.prepare("SELECT * FROM pgs WHERE owner_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json({ pgs: rows.map((pg) => ({ ...pg, rating: ratingSummary(pg.id) })) });
});

router.get("/:id", (req, res) => {
  const pg = db.prepare("SELECT * FROM pgs WHERE id = ?").get(req.params.id);
  if (!pg) return res.status(404).json({ error: "PG not found" });
  const owner = db.prepare("SELECT id, name, phone, email FROM users WHERE id = ?").get(pg.owner_id);
  const images = db.prepare("SELECT category, url FROM pg_images WHERE pg_id = ? ORDER BY id").all(pg.id);
  res.json({ pg: { ...pg, rating: ratingSummary(pg.id) }, owner, images });
});

router.post("/", requireAuth, requireRole("owner"), (req, res) => {
  const {
    name, description, address, locality, city, latitude, longitude,
    price, property_type, gender_allowed, wifi, food, laundry, ac, parking, power_backup,
    total_rooms, available_rooms, image_url,
  } = req.body;

  if (!name || !address || !locality || !city || latitude == null || longitude == null || !price) {
    return res.status(400).json({ error: "Name, address, locality, city, location and price are required" });
  }

  const info = db
    .prepare(`INSERT INTO pgs
      (owner_id, name, description, address, locality, city, latitude, longitude, price, property_type,
       gender_allowed, wifi, food, laundry, ac, parking, power_backup, total_rooms, available_rooms, image_url)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      req.user.id, name, description || "", address, locality, city, latitude, longitude, price,
      property_type === "flat" ? "flat" : "pg",
      gender_allowed || "any", wifi ? 1 : 0, food ? 1 : 0, laundry ? 1 : 0, ac ? 1 : 0,
      parking ? 1 : 0, power_backup ? 1 : 0, total_rooms || 1, available_rooms || 1, image_url || null
    );

  const pg = db.prepare("SELECT * FROM pgs WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ pg });
});

router.put("/:id", requireAuth, requireRole("owner"), (req, res) => {
  const pg = db.prepare("SELECT * FROM pgs WHERE id = ?").get(req.params.id);
  if (!pg) return res.status(404).json({ error: "PG not found" });
  if (pg.owner_id !== req.user.id) return res.status(403).json({ error: "Not your listing" });

  const fields = [
    "name", "description", "address", "locality", "city", "latitude", "longitude", "price", "property_type",
    "gender_allowed", "wifi", "food", "laundry", "ac", "parking", "power_backup",
    "total_rooms", "available_rooms", "image_url",
  ];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(typeof req.body[f] === "boolean" ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });
  values.push(req.params.id);
  db.prepare(`UPDATE pgs SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  res.json({ pg: db.prepare("SELECT * FROM pgs WHERE id = ?").get(req.params.id) });
});

router.delete("/:id", requireAuth, requireRole("owner"), (req, res) => {
  const pg = db.prepare("SELECT * FROM pgs WHERE id = ?").get(req.params.id);
  if (!pg) return res.status(404).json({ error: "PG not found" });
  if (pg.owner_id !== req.user.id) return res.status(403).json({ error: "Not your listing" });
  db.prepare("DELETE FROM pgs WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;