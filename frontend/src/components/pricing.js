// Shared pricing rules for single-occupancy private rooms (sample values - adjust as needed)

// Optional monthly add-ons (AC and Cooler are either/or)
export const ADDON_PRICES = { ac: 1000, cooler: 400, laundry: 300, kitchen: 1500 };

// Private kitchenette is offered only in premium rooms (rent above this)
export const KITCHEN_MIN_RENT = 10000;

// Guest stay: max nights, and share of the room's per-day rent charged per guest night
export const GUEST_MAX_NIGHTS = 2;
export const GUEST_RATE = 0.5;

// One-time refundable deposit = one month's base room rent (first payment only)
export const securityDepositFor = (rent) => rent;
export const guestNightlyFor = (rent) => Math.round((rent / 30) * GUEST_RATE);