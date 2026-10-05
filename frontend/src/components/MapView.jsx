import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";

// Fix default marker icons (Vite doesn't resolve leaflet's built-in image paths)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);
  return null;
}

// Small helper: map stays "locked" (no scroll-zoom) until user clicks it,
// so page scrolling isn't hijacked by the map underneath the cursor.
function useScrollLock(containerRef) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const activate = () => setActive(true);
    const deactivate = () => setActive(false);

    el.addEventListener("mouseenter", () => {}); // no-op, kept for clarity
    el.addEventListener("click", activate);
    el.addEventListener("mouseleave", deactivate);

    return () => {
      el.removeEventListener("click", activate);
      el.removeEventListener("mouseleave", deactivate);
    };
  }, [containerRef]);

  return active;
}

// Single PG location map
export function SinglePGMap({ latitude, longitude, name, address, tall }) {
  const containerRef = useRef(null);
  const zoomActive = useScrollLock(containerRef);

  if (!latitude || !longitude) return null;

  return (
    <div ref={containerRef} className={`map-wrap ${tall ? "tall" : ""}`}>
      {!zoomActive && (
        <div className="map-scroll-hint">Click map to zoom / scroll</div>
      )}
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={zoomActive}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={markerIcon}>
          <Popup>
            <strong>{name}</strong>
            <br />
            {address}
          </Popup>
        </Marker>
        <Recenter lat={latitude} lng={longitude} />
      </MapContainer>
    </div>
  );
}

// Multi PG map for browse page
export function AllPGsMap({ pgs, onSelect }) {
  const containerRef = useRef(null);
  const zoomActive = useScrollLock(containerRef);

  const valid = pgs.filter((p) => p.latitude && p.longitude);
  const center = valid.length ? [valid[0].latitude, valid[0].longitude] : [28.6139, 77.209]; // default Delhi

  return (
    <div ref={containerRef} className="map-wrap tall">
      {!zoomActive && (
        <div className="map-scroll-hint">Click map to zoom / scroll</div>
      )}
      <MapContainer
        center={center}
        zoom={valid.length ? 12 : 5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={zoomActive}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {valid.map((pg) => (
          <Marker
            key={pg.id}
            position={[pg.latitude, pg.longitude]}
            icon={markerIcon}
            eventHandlers={{ click: () => onSelect && onSelect(pg) }}
          >
            <Popup>
              <strong>{pg.name}</strong>
              <br />
              {pg.locality}, {pg.city}
              <br />
              ₹{pg.price}/mo
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}