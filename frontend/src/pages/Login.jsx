import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Login ke baad kahan bhejna hai (Register.jsx wala same logic)
const roleHome = (role) => {
  if (role === "owner") return "/owner/dashboard";
  if (role === "kitchen") return "/kitchen/dashboard"; // is route ko app mein banana hoga
  return "/browse";
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
        Log in to find your room, manage your PG, or run your kitchen.
      </p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Password</label>
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="form-submit" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
      </form>
      <div className="switch-link">New here? <Link to="/register">Create an account</Link></div>
    </div>
  );
}