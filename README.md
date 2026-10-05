# NestIn — PG Management System (Prototype)

Full-stack web app connecting **students** looking for PG/hostel accommodation with **PG owners**.

## Features
- Separate registration/login for Students and PG Owners (JWT auth, hashed passwords)
- Owners can list a PG: address, locality/city, price, rooms, utilities (WiFi, food, laundry, AC, parking, power backup), gender policy
- Owners pin the exact PG location on an interactive map (click-to-place)
- Students browse/filter PGs by locality, price, WiFi — list view or full map view (all PGs plotted)
- PG detail page: full info, live map, per-criterion rating breakdown, student reviews
- 5-criteria rating system: cleanliness, WiFi, price-for-value, safety, owner behaviour — averaged into an overall score per PG
- Booking request flow: student requests → owner approves/rejects from dashboard
- **Digital key**: the moment an owner approves a booking, a unique digital key + QR code is generated for the student to show at the gate
- Map is built with **Leaflet + OpenStreetMap** (free, no API key needed). The code is structured so you can swap in the Google Maps JavaScript API later if you get a billing-enabled API key — see "Switching to Google Maps" below.

## Tech stack
- Backend: Node.js, Express, SQLite (via Node's built-in `node:sqlite` — no native/compiled dependencies, so `npm install` never needs a C++ build toolchain), JWT, bcrypt, `qrcode`
- Frontend: React (Vite), React Router, Axios, Leaflet / react-leaflet

**Requires Node.js 22.5 or newer** (for `node:sqlite`). Check with `node -v`.

## Project structure
```
pg-management-system/
  backend/     Express API + SQLite database
  frontend/    React app (Vite)
```

## Running it locally

You need [Node.js 18+](https://nodejs.org) installed.

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000`. A `data/pgms.db` SQLite file is created automatically on first run — no separate database setup needed.

### 2. Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` calls to the backend.

Open `http://localhost:5173`, register as a **PG Owner** to list a place, and register as a **Student** (in another browser or incognito tab) to browse, book, rate, and view the digital key.

## Switching to Google Maps
Currently `frontend/src/components/MapView.jsx` and `LocationPicker.jsx` use Leaflet with OpenStreetMap tiles, which needs no API key and looks/behaves like Google Maps. If you'd rather use real Google Maps:
1. Get a Google Maps JavaScript API key (needs a billing-enabled Google Cloud project).
2. Install `@react-google-maps/api`.
3. Replace the `MapContainer`/`TileLayer`/`Marker` components in those two files with `GoogleMap`/`Marker` from that package, passing your key via `LoadScript`.
The rest of the app (lat/lng storage, filtering, booking flow) stays exactly the same either way.

## Notes / next steps for a production version
- Add image upload for PG photos (currently just an `image_url` text field)
- Restrict rating submission to students with a completed/approved booking at that PG
- Add pagination for listings and reviews
- Move the JWT secret into a proper `.env` file before deploying
