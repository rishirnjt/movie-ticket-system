import React, { useState } from "react";
import "./AuthModel.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthModal = ({ onClose, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [activeTab, setActiveTab] = useState("signin");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register state
  const [reg, setReg] = useState({
    countryCode: "+977",
    phone: "",
    email: "",
    dob: "",
    firstName: "",
    lastName: "",
    password: "",
    termsAccepted: false,
  });

  const [showRegPwd, setShowRegPwd] = useState(false);

  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });

      const role = res.data?.user?.role?.toLowerCase();

      if (role === "admin") {
        alert("Please login from admin panel.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsLoggedIn(true);
      onClose();
      navigate("/");

    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!reg.termsAccepted) {
      return alert("Please accept Terms & Conditions");
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/register`, {
        phone: reg.countryCode + reg.phone,
        email: reg.email,
        dob: reg.dob,
        firstName: reg.firstName,
        lastName: reg.lastName,
        password: reg.password,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user || {}));
        setIsLoggedIn(true);
      }

      alert("Registration successful");
      navigate("/");
      onClose();

    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  // ---------------- FORGOT PASSWORD ----------------
  const handleForgotPassword = async () => {
    const email = prompt("Enter your email to reset password:");
    if (!email) return;

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
        email,
      });

      alert(res.data.message || "Password reset email sent");

    } catch (err) {
      alert(err.response?.data?.message || "Error sending reset email");
    }
  };

  const onRegChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReg((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">

        <button className="auth-close" onClick={onClose}>×</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => setActiveTab("signin")}
          >
            SIGN IN
          </button>

          <button
            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => setActiveTab("signup")}
          >
            SIGN UP
          </button>
        </div>

        <div className="auth-body">

          {activeTab === "signin" && (
            <form onSubmit={handleLogin} className="auth-form">

              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />

              <div className="password-wrapper">
                <input
                  type={showLoginPwd ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                >
                  {showLoginPwd ? "Hide" : "Show"}
                </button>
              </div>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "GO"}
              </button>

              <p className="forgot-link" onClick={handleForgotPassword}>
                Forgot Your Password?
              </p>

              <p className="muted">
                Don't have an account?{" "}
                <span onClick={() => setActiveTab("signup")}>
                  Register here
                </span>
              </p>

            </form>
          )}

          {activeTab === "signup" && (
            <form onSubmit={handleRegister} className="auth-form">

              <div className="phone-row">
                <select
                  name="countryCode"
                  value={reg.countryCode}
                  onChange={onRegChange}
                >
                  <option value="+977">+977</option>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                </select>

                <input
                  name="phone"
                  placeholder="Phone number"
                  value={reg.phone}
                  onChange={onRegChange}
                  required
                />
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={reg.email}
                onChange={onRegChange}
                required
              />

              <input
                type="date"
                name="dob"
                value={reg.dob}
                onChange={onRegChange}
              />

              <input
                name="firstName"
                placeholder="First Name"
                value={reg.firstName}
                onChange={onRegChange}
              />

              <input
                name="lastName"
                placeholder="Last Name"
                value={reg.lastName}
                onChange={onRegChange}
              />

              <div className="password-wrapper">
                <input
                  type={showRegPwd ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={reg.password}
                  onChange={onRegChange}
                />

                <button
                  type="button"
                  onClick={() => setShowRegPwd(!showRegPwd)}
                >
                  {showRegPwd ? "Hide" : "Show"}
                </button>
              </div>

              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={reg.termsAccepted}
                  onChange={onRegChange}
                />
                I agree to Terms & Conditions
              </label>

              <button className="primary-btn" type="submit">
                Confirm
              </button>

              <p className="muted">
                Already have an account?{" "}
                <span onClick={() => setActiveTab("signin")}>
                  Login here
                </span>
              </p>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthModal;
