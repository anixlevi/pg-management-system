import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";

const router = Router();

const ALLOWED_ROLES = ["student", "owner", "kitchen"];

router.post("/register", (req, res) => {
  const { name, email, password, phone, kitchen_name, kitchen_address } = req.body;
  let { role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password and role are required" });
  }

  // The register page may send "kitchen_partner" or similar, treat it as "kitchen"
  if (/kitchen|partner/i.test(role)) role = "kitchen";

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: "Role must be student, owner or kitchen" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const hash = bcrypt.hashSync(password, 10);
  if (role === "kitchen" && (!kitchen_name || !kitchen_address)) {
    return res.status(400).json({ error: "Kitchen name and address are required" });
  }

  const info = db
    .prepare(
      "INSERT INTO users (name, email, password_hash, role, phone, kitchen_name, kitchen_address) VALUES (?,?,?,?,?,?,?)"
    )
    .run(
      name,
      email,
      hash,
      role,
      phone || null,
      role === "kitchen" ? kitchen_name : null,
      role === "kitchen" ? kitchen_address : null
    );

  const user = { id: Number(info.lastInsertRowid), name, email, role };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user });
});

router.get("/me", requireAuth, (req, res) => {
  const row = db.prepare("SELECT id, name, email, role, phone, kitchen_name, kitchen_address FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: row });
});

export default router;