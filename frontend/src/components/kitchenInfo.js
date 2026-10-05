// Shared kitchen details, used by PGDetails (browse page) and StudentPGDashboard.
// Kitchen is INCLUDED in rooms priced above KITCHEN_MIN_RENT (see pricing.js).
// Rooms at or below that price have no kitchen and no kitchen extras.
// (sample details and prices - owner should finalise these)

// Basic kitchen appliances: included at no extra charge
export const BASIC_KITCHEN_APPLIANCES = [
  { id: "fridge", icon: "🧊", label: "Mini Fridge", detail: "Single-door, about 90 L, for food and drinks" },
  { id: "purifier", icon: "💧", label: "RO Water Purifier", detail: "Drinking water with RO + UV filtration" },
  { id: "gas", icon: "🔥", label: "Gas Stove", detail: "2-burner stove with cylinder connection" },
  { id: "sink", icon: "🚰", label: "Sink with Tap", detail: "Steel sink with running water" },
  { id: "kettle", icon: "☕", label: "Electric Kettle", detail: "1.5 L, for tea, coffee and instant meals" },
  { id: "storage", icon: "🗄️", label: "Storage Cabinets & Shelf", detail: "Wall cabinets and a counter shelf for groceries" },
  { id: "exhaust", icon: "🌀", label: "Exhaust Fan", detail: "Keeps the kitchen ventilated while cooking" },
];

// Premium kitchen extras: charged monthly
export const KITCHEN_EXTRAS = [
  { id: "microwave", label: "Microwave Oven", price: 400 },
  { id: "rotimaker", label: "Roti Maker", price: 250 },
  { id: "dishwasher", label: "Dishwasher", price: 800 },
  { id: "induction", label: "Induction Cooktop", price: 300 },
  { id: "premium", label: "Premium Kitchen Pack (chimney + utensil set + weekly deep-clean)", price: 700 },
];