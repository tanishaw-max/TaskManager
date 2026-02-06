import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      if (value.length <= 10 && /^\d*$/.test(value)) {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.register(form);
      setSuccess("Registration successful! Logging you in...");
      login(res.data.user, res.data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f3f4f6]">
      <div
        className="w-full max-w-120 p-8 rounded-[1.25rem] bg-white text-[#111827]
          shadow-[0_10px_30px_rgba(15,23,42,0.12)] border border-[#e5e7eb]
          max-[480px]:p-6"
      >
        {/* Header */}
        <div>
          <h1 className="inline-flex items-center gap-[0.6rem] whitespace-nowrap">
            <span
              className="inline-block w-10 h-10 rounded-[14px] bg-[#2563eb]
                shadow-[0_10px_24px_rgba(37,99,235,0.35)]"
              style={{
                WebkitMaskImage:
                  "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%27http://www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20fill%3D%27%23000%27%20d%3D%27M7%207a3%203%200%201%201%200%206a3%203%200%200%201%200-6Zm10%2010a3%203%200%201%201%200%206a3%203%200%200%201%200-6ZM17%203a3%203%200%201%201%200%206a3%203%200%200%201%200-6ZM8.8%2012.2l6.4%203.6l1-1.7l-6.4-3.6l-1%201.7Zm6.4-4L8.8%2011.8l1%201.7l6.4-3.6l-1-1.7Z%27/%3E%3C/svg%3E\")",
                maskImage:
                  "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%27http://www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20fill%3D%27%23000%27%20d%3D%27M7%207a3%203%200%201%201%200%206a3%203%200%200%201%200-6Zm10%2010a3%203%200%201%201%200%206a3%203%200%200%201%200-6ZM17%203a3%203%200%201%201%200%206a3%203%200%200%201%200-6ZM8.8%2012.2l6.4%203.6l1-1.7l-6.4-3.6l-1%201.7Zm6.4-4L8.8%2011.8l1%201.7l6.4-3.6l-1-1.7Z%27/%3E%3C/svg%3E\")",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "70%",
                maskSize: "70%",
              }}
              aria-hidden="true"
            />
            <span className="text-[clamp(1.5rem,5vw,2.35rem)] font-black tracking-[-0.03em] text-[#2563eb]">
              Task Manager
            </span>
          </h1>
          <p className="mt-[0.4rem] text-[0.9rem] text-[#6b7280]">
            Start organizing your work efficiently.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4"
        >
          {[
            { id: "username", label: "Username", type: "text", ph: "johndoe" },
            { id: "email", label: "Email", type: "email", ph: "you@example.com" },
            { id: "password", label: "Password", type: "password", ph: "••••••••" },
            { id: "phone", label: "Phone", type: "tel", ph: "1234567890", pattern: "[0-9]{10}", maxLength: 10 },
            { id: "address", label: "Address", type: "text", ph: "123 Main St, City" },
          ].map((f) => (
            <div key={f.id} className="flex flex-col gap-[0.4rem]">
              <label className="text-[0.85rem] text-[#4b5563]">{f.label}</label>
              <input
                id={f.id}
                name={f.id}
                type={f.type}
                placeholder={f.ph}
                value={form[f.id]}
                onChange={handleChange}
                required
                pattern={f.pattern}
                maxLength={f.maxLength}
                className="px-[0.8rem] py-[0.6rem] rounded-[0.6rem] border border-[#d1d5db]
                  bg-white text-[#111827] text-[0.9rem]
                  focus:outline-none focus:border-[#2563eb]
                  focus:shadow-[0_0_0_1px_rgba(37,99,235,0.3)]"
              />
            </div>
          ))}

          {error && <div className="text-[0.85rem] text-[#fecaca]">{error}</div>}
          {success && (
            <div className="text-[0.85rem] text-[#86efac]">{success}</div>
          )}

          <button
            disabled={loading}
            className="w-full mt-2 px-4 py-3 rounded-lg
              bg-blue-600 text-white font-semibold
              transition-all duration-200
              hover:brightness-110
              hover:shadow-[0_12px_30px_rgba(59,130,246,0.4)]
              hover:-translate-y-0.5
              disabled:opacity-60 disabled:cursor-not-allowed
              disabled:shadow-none disabled:translate-y-0"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-400 font-medium hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
