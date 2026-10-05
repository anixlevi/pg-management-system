import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import db from "../db.js";

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getPgContext() {
  const rows = db
    .prepare(
      `SELECT name, locality, city, price, property_type, gender_allowed,
              wifi, food, laundry, ac, parking, power_backup, available_rooms
       FROM pgs
       WHERE available_rooms > 0
       ORDER BY created_at DESC
       LIMIT 40`
    )
    .all();

  if (rows.length === 0) return "No PG listings are currently available in the database.";

  return rows
    .map((pg, i) => {
      const amenities = [
        pg.wifi ? "WiFi" : null,
        pg.food ? "Food" : null,
        pg.laundry ? "Laundry" : null,
        pg.ac ? "AC" : null,
        pg.parking ? "Parking" : null,
        pg.power_backup ? "Power backup" : null,
      ].filter(Boolean).join(", ") || "No listed amenities";

      return `${i + 1}. "${pg.name}" — ${pg.locality}, ${pg.city} | ₹${pg.price}/mo | ${pg.property_type} | Gender: ${pg.gender_allowed} | ${amenities} | ${pg.available_rooms} room(s) available`;
    })
    .join("\n");
}

function buildSystemPrompt() {
  return `You are Roomly Assistant, a friendly helpdesk chatbot for Roomly — a PG (paying guest) and hostel finder platform for students in India.

Your job:
1. Answer general questions about how Roomly works: browsing PGs, booking, digital room keys, owner listings, ratings, etc.
2. When students ask for PG recommendations (by locality, budget, gender preference, amenities), recommend real listings from the CURRENT LISTINGS data provided below. Only recommend PGs that actually appear in that data — never invent listings.
3. If no listings in the data match what they're asking for, say so honestly and suggest they adjust their search or check the Browse PGs page.
4. Keep answers short, warm, and conversational — this is a chat widget, not an essay. Use plain text, occasional emoji is fine, avoid heavy markdown.
5. If asked something unrelated to PGs/hostels/student housing/NestIn, politely redirect back to how you can help with their PG search.

CURRENT LISTINGS (live from database):
${getPgContext()}`;
}

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const chatHistory = Array.isArray(history)
      ? history.map((h) => ({ role: h.role, parts: [{ text: h.text }] }))
      : [];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        { role: "user", parts: [{ text: buildSystemPrompt() }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to help students find PGs and answer questions about NestIn." }] },
        ...chatHistory,
        { role: "user", parts: [{ text: message }] },
      ],
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error("Chatbot error:", err?.message || err);
    res.status(500).json({ error: "Chatbot is temporarily unavailable. Please try again." });
  }
});

export default router;