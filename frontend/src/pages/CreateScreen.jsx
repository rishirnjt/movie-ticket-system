import React, { useState } from "react";
import axios from "axios";
import "./CreateScreen.css";

const CreateScreen = () => {
  const [form, setForm] = useState({
    name: "",
    format: "2D",
    capacity: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("token");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    setMessage("");
    setMessageType("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Screen name is required";
    }

    if (!form.capacity || Number(form.capacity) <= 0) {
      newErrors.capacity = "Capacity must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      await axios.post(
        "http://localhost:5001/api/screens",
        {
          ...form,
          capacity: Number(form.capacity),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("Screen created successfully");
      setMessageType("success");

      setForm({
        name: "",
        format: "2D",
        capacity: "",
        isActive: true,
      });

      setErrors({});
    } catch (err) {
      console.error("Create screen failed:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Failed to create screen");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-screen-page">
      <div className="create-screen-card">
        <div className="create-screen-header">
          <div>
            <span className="screen-badge">Admin Panel</span>
            <h2>Create New Screen</h2>
            <p>Add a new cinema screen with format, capacity, and status.</p>
          </div>
          <div className="screen-icon-wrap">
            <i className="fas fa-tv"></i>
          </div>
        </div>

        {message && (
          <div className={`screen-message ${messageType}`}>
            {message}
          </div>
        )}

        <form className="create-screen-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Screen Name</label>
            <input
              type="text"
              placeholder="Enter screen name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Screen Format</label>
              <select
                value={form.format}
                onChange={(e) => handleChange("format", e.target.value)}
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </div>

            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                min="1"
                placeholder="Enter seat capacity"
                value={form.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
              />
              {errors.capacity && (
                <span className="field-error">{errors.capacity}</span>
              )}
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <label className="toggle-title">Screen Status</label>
              <p className="toggle-subtitle">
                Enable this screen for movie scheduling and bookings.
              </p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="screen-preview">
            <h4>Preview</h4>
            <div className="preview-card">
              <div className="preview-top">
                <span className="preview-name">
                  {form.name.trim() || "Unnamed Screen"}
                </span>
                <span className={`preview-status ${form.isActive ? "active" : "inactive"}`}>
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="preview-meta">
                <span>{form.format}</span>
                <span>{form.capacity || 0} Seats</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                setForm({
                  name: "",
                  format: "2D",
                  capacity: "",
                  isActive: true,
                })
              }
              disabled={loading}
            >
              Reset
            </button>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Screen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScreen;