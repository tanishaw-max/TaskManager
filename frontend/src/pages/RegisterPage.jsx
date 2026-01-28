import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./RegisterPage.css";

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    roleTitle: "user",
    registrationKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.register(form);
      setSuccess("Registration successful! Logging you in...");
      // Auto-login after registration
      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="register-header">
          <h1 className="brand-title" aria-label="Task Manager">
            <span className="brand-icon" aria-hidden="true" />
            <span className="brand-text">Task Manager</span>
          </h1>
          <p>Start organizing your work efficiently.</p>
        </div>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="johndoe"
              value={form.username}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="1234567890"
              value={form.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              maxLength="10"
              onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main St, City"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="roleTitle">Role</label>
            <select
              id="roleTitle"
              name="roleTitle"
              value={form.roleTitle}
              onChange={handleChange}
            >
              <option value="user">User (Default - Can manage own tasks)</option>
              <option value="manager">Manager (Can assign tasks to employees)</option>
              <option value="super-admin">Super Admin (Full access)</option>
            </select>
            <small style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
              {form.roleTitle === "user" && "No registration key needed"}
              {form.roleTitle === "manager" && "Requires registration key: manager_key_2024"}
              {form.roleTitle === "super-admin" && "Requires registration key: super_admin_key_2024"}
            </small>
          </div>
          {(form.roleTitle === "manager" || form.roleTitle === "super-admin") && (
            <div className="form-group">
              <label htmlFor="registrationKey">Registration Key</label>
              <input
                id="registrationKey"
                name="registrationKey"
                type="text"
                placeholder="Enter registration key"
                value={form.registrationKey}
                onChange={handleChange}
                required
              />
              <small style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                Required for manager and super-admin roles
              </small>
            </div>
          )}
          {error && <div className="error-text">{error}</div>}
          {success && <div className="success-text">{success}</div>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="register-hint">
          Already have an account?{" "}
          <Link to="/login" className="link-text">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
