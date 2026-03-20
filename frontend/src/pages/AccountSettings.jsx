import React, { useState, useEffect } from "react";
import axios from "axios";
import profileImg from "../assets/profileIcon.png";
import "./MyAccount.css";

const AccountSettings = ({ user, setUser }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.firstName + " " + user.lastName);
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await axios.put(
        "http://localhost:5001/api/users/update",
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );

      setUser(res.data.user);
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5001/api/users/change-password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to change password.");
    }
  };

  return (
    <div className="account-settings glass-card">
      <h2>Account Settings</h2>
      {message && <p className="message">{message}</p>}

      {/* ===== PROFILE UPDATE ===== */}
      <form onSubmit={handleProfileUpdate} className="settings-form">
        <h4>Profile Information</h4>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
          />
        </div>

        <div className="form-group">
          <label>Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files[0])}
          />
          {user?.profilePic || profilePic ? (
            <img
              src={profilePic ? URL.createObjectURL(profilePic) : user.profilePic}
              alt="Profile Preview"
              className="profile-preview"
            />
          ) : (
            <img src={profileImg} alt="Default" className="profile-preview" />
          )}
        </div>

        <button type="submit" className="update-btn">
          Update Profile
        </button>
      </form>

      {/* ===== CHANGE PASSWORD ===== */}
      <form onSubmit={handleChangePassword} className="settings-form">
        <h4>Change Password</h4>

        <div className="form-group">
          <label>Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter old password"
            required
          />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </div>

        <button type="submit" className="update-btn">
          Change Password
        </button>
      </form>
    </div>
  );
};

export default AccountSettings;