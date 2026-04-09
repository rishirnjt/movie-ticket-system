import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:5001/api/auth";

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });

      alert(res.data.message || "OTP sent to your email");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      alert("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp,
      });

      alert(res.data.message || "OTP verified");
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/reset-password`, {
        email,
        password,
      });

      alert(res.data.message || "Password reset successful");

      setEmail("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setStep(1);

      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-box">
        <h2>Forgot Password</h2>
        <p className="forgot-subtitle">
          {step === 1 && "Enter your email to receive an OTP"}
          {step === 2 && "Enter the OTP sent to your email"}
          {step === 3 && "Set your new password"}
        </p>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="forgot-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="forgot-form">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Change Email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;