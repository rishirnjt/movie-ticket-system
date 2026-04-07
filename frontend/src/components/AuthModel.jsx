import React, { useState } from "react";
import "./AuthModel.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AuthModal = ({ onClose, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [activeTab, setActiveTab] = useState("signin");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordErrors = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }

    return errors;
  };

  const isPasswordValid = (password) => {
    return getPasswordErrors(password).length === 0;
  };
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
        toast.warning("Please login from admin panel.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsLoggedIn(true);
      onClose();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isValidEmail(reg.email)) {
      return toast.error("Please enter a valid email address");
    }

    if (!isPasswordValid(reg.password)) {
      return toast.error("Please enter a stronger password");
    }

    if (!reg.termsAccepted) {
      return toast.warning("Please accept Terms & Conditions");
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

      toast.success("Registration successful");
      navigate("/");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email to reset password:");
    if (!email) return;

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
        email,
      });

      toast.success(res.data.message || "Password reset email sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset email");
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
        <button className="auth-close" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="auth-header">
          <h2>{activeTab === "signin" ? "Welcome Back" : "Create Account"}</h2>
          <p>
            {activeTab === "signin"
              ? "Sign in to continue your Cinemax experience"
              : "Join Cinemax and book your movie tickets easily"}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => setActiveTab("signin")}
            type="button"
          >
            Sign In
          </button>

          <button
            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => setActiveTab("signup")}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <div className="auth-body">
          {activeTab === "signin" && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-icon-wrap">
                  <i className="fa-regular fa-envelope" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-icon-wrap password-wrapper">
                  <i className="fa-solid fa-lock" />
                  <input
                    type={showLoginPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowLoginPwd(!showLoginPwd)}
                  >
                    <i
                      className={`fa-solid ${showLoginPwd ? "fa-eye-slash" : "fa-eye"
                        }`}
                    />
                  </button>
                </div>
              </div>

              <p className="forgot-link" onClick={handleForgotPassword}>
                Forgot your password?
              </p>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <p className="muted">
                Don&apos;t have an account?{" "}
                <span onClick={() => setActiveTab("signup")}>Register here</span>
              </p>
            </form>
          )}

          {activeTab === "signup" && (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row two-cols">
                <div className="input-group">
                  <label>First Name</label>
                  <div className="input-icon-wrap">
                    <i className="fa-regular fa-user" />
                    <input
                      name="firstName"
                      placeholder="First name"
                      value={reg.firstName}
                      onChange={onRegChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Last Name</label>
                  <div className="input-icon-wrap">
                    <i className="fa-regular fa-user" />
                    <input
                      name="lastName"
                      placeholder="Last name"
                      value={reg.lastName}
                      onChange={onRegChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Phone Number</label>
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

                  <div className="input-icon-wrap">
                    <i className="fa-solid fa-phone" />
                    <input
                      name="phone"
                      placeholder="Phone number"
                      value={reg.phone}
                      onChange={onRegChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <div className="input-icon-wrap">
                  <i className="fa-regular fa-envelope" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={reg.email}
                    onChange={onRegChange}
                    required
                  />
                </div>
                {reg.email && (
                  <p className={`field-message ${isValidEmail(reg.email) ? "success" : "error"}`}>
                    {isValidEmail(reg.email) ? "Valid email address" : "Enter a valid email address"}
                  </p>
                )}
              </div>

              <div className="input-group">
                <label>Date of Birth</label>
                <div className="input-icon-wrap">
                  <i className="fa-regular fa-calendar" />
                  <input
                    type="date"
                    name="dob"
                    value={reg.dob}
                    onChange={onRegChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-icon-wrap password-wrapper">
                  <i className="fa-solid fa-lock" />
                  <input
                    type={showRegPwd ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    value={reg.password}
                    onChange={onRegChange}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowRegPwd(!showRegPwd)}
                  >
                    <i
                      className={`fa-solid ${showRegPwd ? "fa-eye-slash" : "fa-eye"
                        }`}
                    />
                  </button>
                </div>
              </div>

              <label className="terms-check">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={reg.termsAccepted}
                  onChange={onRegChange}
                />
                <span>I agree to the Terms & Conditions</span>
              </label>

              <button className="primary-btn" type="submit">
                Create Account
              </button>

              <p className="muted">
                Already have an account?{" "}
                <span onClick={() => setActiveTab("signin")}>Login here</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;