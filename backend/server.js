import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import "./db.js";
import authRoutes from "./routes/auth.js";
import pgRoutes from "./routes/pgs.js";
import ratingRoutes from "./routes/ratings.js";
import bookingRoutes from "./routes/bookings.js";
import chatbotRoutes from "./routes/chatbot.js";
import doorRoutes from "./routes/Door.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Auto-seed demo data if the database has no PGs yet
const checkDb = new DatabaseSync(path.join(__dirname, "data", "pgms.db"));
const { c } = checkDb.prepare("SELECT COUNT(*) AS c FROM pgs").get();
checkDb.close();
if (c === 0) {
  await import("./seed.js");
}

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/pgs", pgRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/door", doorRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PG Management API running on http://localhost:${PORT}`));