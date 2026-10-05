import { useEffect, useState } from "react";
import api from "../api.js";
import PGCard from "../components/PGCard.jsx";
import { AllPGsMap } from "../components/MapView.jsx";

export default function Browse() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ locality: "", maxPrice: "", wifi: false });
  const [view, setView] = useState("list");

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filters.locality) params.locality = filters.locality;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.wifi) params.wifi = "true";
    const { data } = await api.get("/pgs", { params });
    setPgs(data.pgs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const submitFilters = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      <div className="section-title">
        <h2>Browse PGs</h2>
        <div className="role-toggle" style={{ margin: 0, width: 220 }}>
          <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
          <button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}>Map</button>
        </div>
      </div>

      <form onSubmit={submitFilters} className="card card-pad" style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 28 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Locality</label>
          <input placeholder="e.g. Laxmi Nagar" value={filters.locality} onChange={(e) => setFilters({ ...filters, locality: e.target.value })} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Max price / month</label>
          <input type="number" placeholder="e.g. 8000" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
        <div className="field" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={filters.wifi} onChange={(e) => setFilters({ ...filters, wifi: e.target.checked })} />
          <label style={{ margin: 0 }}>WiFi only</label>
        </div>
        <button className="pill">Apply filters</button>
      </form>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading PGs...</p>
      ) : pgs.length === 0 ? (
        <div className="badge-empty">No PGs match your filters yet. Try widening your search.</div>
      ) : view === "list" ? (
        <div className="grid cols-3">
          {pgs.map((pg) => <PGCard pg={pg} key={pg.id} />)}
        </div>
      ) : (
        <AllPGsMap pgs={pgs} />
      )}
    </div>
  );
}
