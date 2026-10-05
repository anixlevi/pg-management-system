import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "data", "pgms.db"));

// Recreate pg_images table fresh each time we seed
db.exec(`DROP TABLE IF EXISTS pg_images;`);
db.exec(`
CREATE TABLE pg_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pg_id INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('cover','bedroom','kitchen','bathroom','lobby','garden','exterior','pool')),
  url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// --- 1. Create (or reuse) a dummy owner account ---
const OWNER_EMAIL = "demo.owner@nestin.test";
const OWNER_PASSWORD = "demo1234";

let owner = db.prepare("SELECT id FROM users WHERE email = ?").get(OWNER_EMAIL);

if (!owner) {
  const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'owner', ?)`
    )
    .run("Demo Owner", OWNER_EMAIL, hash, "9999900000");
  owner = { id: Number(result.lastInsertRowid) };
  console.log(`Created dummy owner (id=${owner.id}, email=${OWNER_EMAIL}, password=${OWNER_PASSWORD})`);
} else {
  console.log(`Reusing existing dummy owner (id=${owner.id})`);
}

// --- 2. Demo data pools ---
const localities = [
  { name: "Laxmi Nagar", city: "Delhi", lat: 28.6358, lng: 77.2765 },
  { name: "Kalkaji", city: "Delhi", lat: 28.5355, lng: 77.2588 },
  { name: "Munirka", city: "Delhi", lat: 28.5559, lng: 77.1712 },
  { name: "Rajouri Garden", city: "Delhi", lat: 28.6469, lng: 77.1201 },
  { name: "Dwarka Sector 12", city: "Delhi", lat: 28.5921, lng: 77.0460 },
  { name: "Mukherjee Nagar", city: "Delhi", lat: 28.7080, lng: 77.2110 },
  { name: "Vijay Nagar", city: "Delhi", lat: 28.6989, lng: 77.2003 },
  { name: "Kirti Nagar", city: "Delhi", lat: 28.6551, lng: 77.1409 },
  { name: "Saket", city: "Delhi", lat: 28.5245, lng: 77.2066 },
  { name: "Vasant Kunj", city: "Delhi", lat: 28.5200, lng: 77.1591 },
  { name: "Rohini Sector 7", city: "Delhi", lat: 28.7196, lng: 77.1200 },
  { name: "Patel Nagar", city: "Delhi", lat: 28.6500, lng: 77.1670 },
  { name: "Karol Bagh", city: "Delhi", lat: 28.6519, lng: 77.1909 },
  { name: "Hauz Khas", city: "Delhi", lat: 28.5494, lng: 77.2001 },
  { name: "Uttam Nagar", city: "Delhi", lat: 28.6198, lng: 77.0596 },
];

const namePrefixes = [
  "Comfort Nest", "Green Valley", "Shanti Niwas", "Elite Stay", "Urban Nest",
  "Sunrise PG", "City View", "Royal Residency", "Cozy Home", "Metro Living",
  "Sunshine PG", "Prime Stay", "Silver Oak", "Golden Nest", "Serene Homes",
  "Skyline PG", "Harmony House", "Vista Rooms", "Aster PG", "The Nook",
];

const streetWords = ["Block A", "Block B", "Main Road", "Sector Market", "Lane 3", "Gali No. 5", "Near Metro Station"];
const genders = ["male", "female", "any"];
const propertyTypes = ["pg", "flat"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function jitter(val, amount) {
  return val + (Math.random() - 0.5) * amount;
}

// --- Indian PG Realistic Unsplash Image Pools ---
const PHOTO_POOLS = {
  cover: [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
  ],
  bedroom: [
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=800&q=80"
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=800&q=80"
  ],
  bathroom: [
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80"
  ],
  lobby: [
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
  ],
  garden: [
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&w=800&q=80"
  ],
  exterior: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
  ],
  pool: [
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80"
  ]
};

function categoriesForPrice(price) {
  if (price < 10000) {
    return ["cover", "bedroom", "bathroom"];
  } else if (price < 18000) {
    return ["cover", "bedroom", "kitchen", "bathroom", "lobby"];
  } else if (price < 20000) {
    return ["cover", "bedroom", "kitchen", "bathroom", "lobby", "garden", "exterior"];
  } else {
    return ["cover", "bedroom", "kitchen", "bathroom", "lobby", "garden", "exterior", "pool"];
  }
}

// Picker logic to prevent repetition across cards
function categoryImage(pgIndex, category) {
  const pool = PHOTO_POOLS[category] || PHOTO_POOLS.cover;
  const index = (pgIndex * 3 + (category === "cover" ? 1 : 0)) % pool.length;
  return pool[index];
}

// --- 3. Insert 35 random PG listings ---
const insertPG = db.prepare(`
  INSERT INTO pgs (
    owner_id, name, description, address, locality, city, latitude, longitude,
    price, property_type, gender_allowed, wifi, food, laundry, ac, parking,
    power_backup, total_rooms, available_rooms, image_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertImage = db.prepare(`
  INSERT INTO pg_images (pg_id, category, url) VALUES (?, ?, ?)
`);

const COUNT = 35;
let inserted = 0;
let imagesInserted = 0;

for (let i = 0; i < COUNT; i++) {
  const loc = rand(localities);
  const name = `${rand(namePrefixes)} ${randInt(1, 9)}`;
  const price = randInt(5, 25) * 1000;
  const totalRooms = randInt(4, 20);
  const availableRooms = randInt(0, totalRooms);
  const propertyType = rand(propertyTypes);
  const genderAllowed = rand(genders);
  const coverUrl = categoryImage(i, "cover");

  const result = insertPG.run(
    owner.id,
    name,
    `A comfortable ${propertyType === "flat" ? "shared flat" : "PG accommodation"} located in ${loc.name}, close to markets and public transport.`,
    `${randInt(1, 200)}, ${rand(streetWords)}, ${loc.name}`,
    loc.name,
    loc.city,
    jitter(loc.lat, 0.01),
    jitter(loc.lng, 0.01),
    price,
    propertyType,
    genderAllowed,
    Math.random() > 0.15 ? 1 : 0,
    Math.random() > 0.3 ? 1 : 0,
    Math.random() > 0.4 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.6 ? 1 : 0,
    Math.random() > 0.25 ? 1 : 0,
    totalRooms,
    availableRooms,
    coverUrl
  );
  inserted++;

  const pgId = Number(result.lastInsertRowid);
  const categories = categoriesForPrice(price);

  for (const category of categories) {
    const url = category === "cover" ? coverUrl : categoryImage(i, category);
    insertImage.run(pgId, category, url);
    imagesInserted++;
  }
}

console.log(`Inserted ${inserted} demo PG listings.`);
console.log(`Inserted ${imagesInserted} images across all listings.`);
console.log("Done seeding.");