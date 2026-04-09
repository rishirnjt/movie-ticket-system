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

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

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

    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("One number");

    return errors;
  };

  const isPasswordValid = (password) => {
    return getPasswordErrors(password).length === 0;
  };

  const resetForgotState = () => {
    setShowForgot(false);
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStep(1);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
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

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      toast.error("Enter your email");
      return;
    }

    if (!isValidEmail(forgotEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
        email: forgotEmail,
      });

      toast.success(res.data.message || "OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        email: forgotEmail,
        otp,
      });

      toast.success(res.data.message || "OTP verified");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, and a number");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        email: forgotEmail,
        password: newPassword,
      });

      toast.success(res.data.message || "Password reset successful");
      resetForgotState();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
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

        {showForgot && (
          <div className="forgot-overlay">
            <div className="forgot-modal">
              <button className="forgot-close" onClick={resetForgotState}>
                <i className="fa-solid fa-xmark" />
              </button>

              <h3>Reset Password</h3>

              {step === 1 && (
                <>
                  <p>Enter your email to receive OTP</p>

                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>

                  {forgotEmail && (
                    <p
                      className={`field-message ${
                        isValidEmail(forgotEmail) ? "success" : "error"
                      }`}
                    >
                      {isValidEmail(forgotEmail)
                        ? "Valid email address"
                        : "Enter a valid email address"}
                    </p>
                  )}

                  <button
                    className="primary-btn"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <p>Enter the OTP sent to your email</p>

                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                  </div>

                  <button
                    className="primary-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Change Email
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <p>Enter your new password</p>

                  <div className="input-group">
                    <div className="input-icon-wrap password-wrapper">
                      <i className="fa-solid fa-lock" />
                      <input
                        type={showNewPwd ? "text" : "password"}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                      >
                        <i
                          className={`fa-solid ${
                            showNewPwd ? "fa-eye-slash" : "fa-eye"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="input-icon-wrap password-wrapper">
                      <i className="fa-solid fa-lock" />
                      <input
                        type={showConfirmPwd ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      >
                        <i
                          className={`fa-solid ${
                            showConfirmPwd ? "fa-eye-slash" : "fa-eye"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {newPassword && (
                    <p
                      className={`field-message ${
                        isPasswordValid(newPassword) ? "success" : "error"
                      }`}
                    >
                      {isPasswordValid(newPassword)
                        ? "Strong password"
                        : "Use 8+ chars, uppercase, lowercase, and number"}
                    </p>
                  )}

                  <button
                    className="primary-btn"
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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
                      className={`fa-solid ${
                        showLoginPwd ? "fa-eye-slash" : "fa-eye"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="forgot-link" onClick={() => setShowForgot(true)}>
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
                  <p
                    className={`field-message ${
                      isValidEmail(reg.email) ? "success" : "error"
                    }`}
                  >
                    {isValidEmail(reg.email)
                      ? "Valid email address"
                      : "Enter a valid email address"}
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
                      className={`fa-solid ${
                        showRegPwd ? "fa-eye-slash" : "fa-eye"
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