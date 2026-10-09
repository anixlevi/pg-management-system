import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_LABELS = {
  student: "Resident",
  owner: "PG Owner",
  kitchen: "Kitchen Partner",
};

// Where to send the user after sign up
const roleHome = (role) => {
  if (role === "owner") return "/owner/dashboard";
  // No kitchen dashboard route exists yet, so kitchen partners land on Home
  // (Home shows a kitchen workspace). Change this once /kitchen/dashboard exists.
  if (role === "kitchen") return "/";
  return "/browse";
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    kitchen_name: "",
    kitchen_address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { kitchen_name, kitchen_address, ...base } = form;
      const payload =
        role === "kitchen" ? { ...base, kitchen_name, kitchen_address, role } : { ...base, role };
      const user = await register(payload);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ marginBottom: 6 }}>Create your account</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
        Sign up to find your private room, list your PG, or offer kitchen services.
      </p>

      <div className="role-toggle">
        <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>I'm a Resident</button>
        <button type="button" className={role === "owner" ? "active" : ""} onClick={() => setRole("owner")}>I'm a PG Owner</button>
        <button type="button" className={role === "kitchen" ? "active" : ""} onClick={() => setRole("kitchen")}>I'm a Kitchen Partner</button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="field">
          <label>Full name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        {role === "kitchen" && (
          <>
            <div className="field">
              <label>Kitchen name</label>
              <input required value={form.kitchen_name} onChange={(e) => setForm({ ...form, kitchen_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Kitchen address (for pickup)</label>
              <input required value={form.kitchen_address} onChange={(e) => setForm({ ...form, kitchen_address: e.target.value })} />
            </div>
          </>
        )}

        <div className="field">
          <label>Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="form-submit" disabled={loading}>
          {loading ? "Creating account..." : `Sign up as ${ROLE_LABELS[role]}`}
        </button>
      </form>
      <div className="switch-link">
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}