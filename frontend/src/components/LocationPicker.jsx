import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onPick }) {
  const center = [latitude || 28.6139, longitude || 77.209]; // default Delhi
  return (
    <div>
      <div className="map-wrap">
        <MapContainer center={center} zoom={latitude ? 14 : 11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={onPick} />
          {latitude && longitude && <Marker position={[latitude, longitude]} icon={markerIcon} />}
        </MapContainer>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
        Map par click karke PG ki exact location pin karein. {latitude ? `Selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Location abhi select nahi hui."}
      </p>
    </div>
  );
}
