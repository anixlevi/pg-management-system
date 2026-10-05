import db from "./db.js";

// Deletes all existing PG listings. Because pgs.id is referenced by
// pg_images, ratings, and bookings with ON DELETE CASCADE, those
// related rows get cleaned up automatically too.
const result = db.prepare("DELETE FROM pgs").run();

console.log(`Deleted ${result.changes} old PG listings (and their related images/ratings/bookings).`);
console.log("Now run: node seed.js");