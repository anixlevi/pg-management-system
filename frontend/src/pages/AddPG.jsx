import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import LocationPicker from "../components/LocationPicker.jsx";

const AMENITIES = [
  ["wifi", "WiFi"], ["food", "Food"], ["laundry", "Laundry"],
  ["ac", "AC"], ["parking", "Parking"], ["power_backup", "Power backup"],
];

export default function AddPG() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", address: "", locality: "", city: "",
    price: "", gender_allowed: "any", total_rooms: 1, available_rooms: 1,
    latitude: null, longitude: null,
    wifi: false, food: false, laundry: false, ac: false, parking: false, power_backup: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.latitude || !form.longitude) {
      setError("Please pin your PG's location on the map.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/pgs", form);
      navigate(`/pg/${data.pg.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60, maxWidth: 720 }}>
      <div className="section-title"><h2>List your PG</h2></div>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit} className="card card-pad">
        <div className="field"><label>PG name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field"><label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field"><label>Full address</label>
          <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Locality / area</label>
            <input required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}><label>City</label>
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label>Pin location on map</label>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onPick={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Price per month (₹)</label>
            <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}><label>Gender allowed</label>
            <select value={form.gender_allowed} onChange={(e) => setForm({ ...form, gender_allowed: e.target.value })}>
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Total rooms</label>
            <input type="number" min={1} value={form.total_rooms} onChange={(e) => setForm({ ...form, total_rooms: e.target.value, available_rooms: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label>Utilities</label>
          <div className="amenity-row">
            {AMENITIES.map(([key, label]) => (
              <label key={key} className="amenity" style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" style={{ width: "auto" }} checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button className="form-submit" disabled={loading}>{loading ? "Publishing..." : "Publish listing"}</button>
      </form>
    </div>
  );
}
