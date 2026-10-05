import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api.js";

export default function DigitalKey() {
  const { bookingId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/bookings/${bookingId}/key`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load key."));
  }, [bookingId]);

  if (error) return <div className="container" style={{ padding: 40 }}><p className="form-error" style={{ maxWidth: 420 }}>{error}</p><Link to="/student/dashboard">Back to dashboard</Link></div>;
  if (!data) return <div className="container" style={{ padding: 40 }}>Loading key...</div>;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, display: "flex", justifyContent: "center" }}>
      <div className="keytag" style={{ width: 340 }}>
        <div className="keytag-hole" />
        <div className="keytag-row">
          <div>
            <small>Digital Room Key</small>
            <div className="keycode mono">{data.digital_key}</div>
          </div>
        </div>
        <div style={{ color: "#C7CAE0", fontSize: 13, lineHeight: 1.5 }}>
          Show this QR code to your PG owner or security at the gate. Keep it safe — it's your entry pass.
        </div>
        <div className="keytag-qr">
          <img src={data.qr_code} alt="Digital key QR code" width={200} height={200} />
        </div>
      </div>
    </div>
  );
}
