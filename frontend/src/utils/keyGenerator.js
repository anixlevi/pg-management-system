// Generates a unique key ONCE per booking, deterministic — same booking = same key always
export function generateDigitalKey(bookingId) {
  const chars = "0123456789ABCDEF";
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = (hash << 5) - hash + bookingId.charCodeAt(i);
    hash |= 0;
  }
  let code = "";
  let seed = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    code += chars[seed % 16];
    seed = Math.floor(seed / 16) + i * 7;
  }
  return `PGKEY-${code}`;
}
import { generateDigitalKey } from "../utils/keyGenerator";

function approveBooking(bookingId) {
  setBookings(prev =>
    prev.map(b =>
      b.id === bookingId
        ? {
            ...b,
            status: "approved",
            digitalKey: b.digitalKey || generateDigitalKey(b.id), // agar pehle se hai to overwrite nahi
          }
        : b
    )
  );
}
