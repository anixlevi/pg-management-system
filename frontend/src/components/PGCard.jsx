import { Link } from "react-router-dom";
import RatingStars from "./RatingStars.jsx";

export default function PGCard({ pg }) {
  const amenities = [
    pg.wifi && "WiFi", pg.food && "Food", pg.laundry && "Laundry",
    pg.ac && "AC", pg.parking && "Parking", pg.power_backup && "Power backup",
  ].filter(Boolean);

  return (
    <Link to={`/pg/${pg.id}`} className="pg-card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="pg-card-img">
        {pg.image_url ? (
          <img
            src={pg.image_url}
            alt={pg.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.classList.add("pg-card-img-fallback");
              e.target.parentElement.innerText = pg.name;
            }}
          />
        ) : (
          pg.name
        )}
      </div>
      <div className="pg-card-body">
        <div className="pg-card-top">
          <div>
            <h3>{pg.name}</h3>
            <div className="locality">{pg.locality}, {pg.city}</div>
          </div>
          <div className="price-tag">₹{pg.price}<span style={{ fontSize: 11, color: "var(--muted)" }}>/mo</span></div>
        </div>
        <RatingStars value={pg.rating?.overall} count={pg.rating?.count} />
        <div className="amenity-row">
          {amenities.length ? amenities.map((a) => <span className="amenity" key={a}>{a}</span>) : <span className="amenity">Basic</span>}
        </div>
      </div>
    </Link>
  );
}