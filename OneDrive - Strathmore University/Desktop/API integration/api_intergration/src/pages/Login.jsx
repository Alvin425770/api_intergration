import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/auth.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "tenant" });

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) {
      setError("Both fields required");
      return;
    }
    try {
      login(loginEmail, loginPassword);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    try {
      register(form.name, form.email, form.password, form.role);
      setForm({ name: "", email: "", password: "", role: "tenant" });
      setMode("login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h1>{mode === "login" ? "Log In" : "Create Account"}</h1>
      {error && <p className="auth-error">{error}</p>}

      {mode === "login" ? (
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          <button type="submit">Log In</button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
          <button type="submit">Register</button>
        </form>
      )}

      <p className="auth-link">
        {mode === "login" ? (
          <>Don't have an account? <span onClick={() => setMode("register")}>Register</span></>
        ) : (
          <>Already have an account? <span onClick={() => setMode("login")}>Log In</span></>
        )}
      </p>
    </div>
  );
}