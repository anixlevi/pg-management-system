import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function StudentDashboard() {
  const [bookings, setBookings] = useState([]);

  const load = async () => {
    const { data } = await api.get("/bookings/student/mine");
    setBookings(data.bookings);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <div className="section-title"><h2>My bookings</h2></div>
      {bookings.length === 0 ? (
        <div className="badge-empty">
          No booking requests yet. <Link to="/browse">Browse PGs</Link> to send one.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>PG</th><th>Locality</th><th>Price</th><th>Status</th><th>Digital key</th><th>PG Details</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.pg_name}</td>
                <td>{b.locality}, {b.city}</td>
                <td className="mono">₹{b.price}/mo</td>
                <td><span className={`status-tag ${b.status}`}>{b.status}</span></td>
                <td>
                  {b.digital_key ? (
                    <Link to={`/digital-key/${b.id}`} className="pill small">View key</Link>
                  ) : (
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>
                  )}
                </td>
                <td>
                  {/* YAHAN CHANGE KIYA HAI: /pg/ ki jagah /my-pg/ kar diya hai */}
                  <Link to={`/my-pg/${b.pg_id}`} className="pill small ghost">View PG</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}