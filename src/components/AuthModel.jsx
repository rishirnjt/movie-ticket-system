import React, { useState } from "react";
import "./AuthModel.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthModal = ({ onClose, setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("signin");
  // sign-in 
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // sign-up
  const [reg, setReg] = useState({
    countryCode: "+977",
    phone: "",
    email: "",
    dob: "",
    firstName: "",
    middleName: "",
    lastName: "",
    password: "",
    termsAccepted: false,
  });
  const [showRegPwd, setShowRegPwd] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setIsLoggedIn(true);

      if (res.data.user.role.toLowerCase() === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!reg.termsAccepted) {
      return alert("Please accept Terms & Conditions");
    }
    try {
      const res = await axios.post("http://localhost:5001/api/auth/register", {
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
      navigate("/");
      alert("Registration successful");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const onRegChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReg((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal" role="dialog" aria-modal="true">
        <button className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="auth-tabs">
          <button
            id="btn-sign-in"
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
            <div className="auth-col signin-col">
              <form onSubmit={handleLogin} className="auth-form">
                <input
                  type="email"
                  id="input-email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <div className="password-wrapper">
                  <input
                    type={showLoginPwd ? "text" : "password"}
                    id="input-password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowLoginPwd((s) => !s)}
                  >
                    <i className={`fa-solid ${showLoginPwd ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>

                </div>
                <button
                  id="btn-go"
                  className="primary-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span style={{ marginLeft: "8px" }}>Logging in...</span>
                    </>
                  ) : (
                    "GO"
                  )}
                </button>

                <a className="forgot-link" href="#">
                  Forgot Your Password?
                </a>
                <p className="muted">
                  Don't have an account?{" "}
                  <span
                    className="switch-link"
                    onClick={() => setActiveTab("signup")}
                  >
                    Register here
                  </span>
                </p>
              </form>
            </div>
          )}

          {activeTab === "signup" && (
            <div className="auth-col signup-col">
              <form onSubmit={handleRegister} className="auth-form">
                <div className="phone-row">
                  <select
                    id="reg-select-country" // Added ID
                    name="countryCode"
                    value={reg.countryCode}
                    onChange={onRegChange}
                  >
                    <option value="+977">+977</option>
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                  </select>
                  <input
                    id="reg-input-phone" // Added ID
                    name="phone"
                    placeholder="Enter your phone number"
                    value={reg.phone}
                    onChange={onRegChange}
                    required
                  />
                </div>
                <input
                  id="reg-input-email" // Added ID
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={reg.email}
                  onChange={onRegChange}
                  required
                />
                <input
                  id="reg-input-dob" // Added ID
                  name="dob"
                  type="date"
                  value={reg.dob}
                  onChange={onRegChange}
                />
                <div className="name-row">
                  <input
                    id="reg-input-first-name" // Added ID
                    name="firstName"
                    placeholder="First Name"
                    value={reg.firstName}
                    onChange={onRegChange}
                  />
                  <input
                    id="reg-input-last-name" // Added ID
                    name="lastName"
                    placeholder="Last Name"
                    value={reg.lastName}
                    onChange={onRegChange}
                  />
                </div>
                <div className="password-wrapper">
                  <input
                    id="reg-input-password" // Added ID
                    name="password"
                    type={showRegPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={reg.password}
                    onChange={onRegChange}
                  />
                  <button
                    id="reg-btn-show-password" // Added ID
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowRegPwd((s) => !s)}
                  >
                    <i className={`fa-solid ${showRegPwd ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
                <label className="terms">
                  <input
                    id="reg-checkbox-terms" // Added ID
                    name="termsAccepted"
                    type="checkbox"
                    checked={reg.termsAccepted}
                    onChange={onRegChange}
                  />{" "}
                  I agree to all <a href="#">Terms & Conditions</a>
                </label>
                <button id="btn-register-confirm" className="primary-btn confirm" type="submit"> {/* Added ID */}
                  Confirm
                </button>
                <p className="muted">
                  Already have an account?{" "}
                  <span
                    className="switch-link"
                    onClick={() => setActiveTab("signin")}
                  >
                    Login here
                  </span>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;


