import "dotenv/config";

const key = process.argv[2];
const state = process.argv[3]; // optional: locked | unlocked

if (!key) {
  console.log("Use: node simulate-card.js PGKEY-XXXX [locked|unlocked]");
  process.exit(1);
}

const res = await fetch(`http://localhost:${process.env.PORT || 5000}/api/door/device`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-device-secret": process.env.DOOR_DEVICE_SECRET || "change-me-door-secret",
  },
  body: JSON.stringify({ digital_key: key, ...(state ? { lock_status: state } : {}) }),
});

console.log(res.status, await res.json());