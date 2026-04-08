import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminPricing.css";

const AdminPricing = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    normalPrice: 500,
    midWeekDiscountEnabled: true,
    midWeekDays: [2, 3],
    discountPercentage: 50,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const days = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
  ];

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/pricing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData({
        normalPrice: res.data.normalPrice ?? 500,
        midWeekDiscountEnabled: res.data.midWeekDiscountEnabled ?? true,
        midWeekDays: res.data.midWeekDays ?? [2, 3],
        discountPercentage: res.data.discountPercentage ?? 50,
      });
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
      setMessage("Failed to load pricing settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDayToggle = (dayValue) => {
    setFormData((prev) => {
      const exists = prev.midWeekDays.includes(dayValue);

      return {
        ...prev,
        midWeekDays: exists
          ? prev.midWeekDays.filter((day) => day !== dayValue)
          : [...prev.midWeekDays, dayValue].sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const normalPrice = Number(formData.normalPrice);
    const discountPercentage = Number(formData.discountPercentage);

    if (normalPrice < 0) {
      setMessage("Normal price cannot be negative.");
      return;
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      setMessage("Discount percentage must be between 0 and 100.");
      return;
    }

    if (formData.midWeekDiscountEnabled && formData.midWeekDays.length === 0) {
      setMessage("Please select at least one discount day.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        normalPrice,
        midWeekDiscountEnabled: formData.midWeekDiscountEnabled,
        midWeekDays: formData.midWeekDays,
        discountPercentage,
      };

      const res = await axios.put(`${API_URL}/api/pricing`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(res.data.message || "Pricing updated successfully.");
    } catch (error) {
      console.error("Failed to update pricing:", error);
      setMessage(
        error.response?.data?.message || "Failed to update pricing settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const previewDiscountedPrice = Math.round(
    Number(formData.normalPrice || 0) *
      (1 - Number(formData.discountPercentage || 0) / 100)
  );

  if (loading) {
    return <div className="admin-pricing-page">Loading pricing settings...</div>;
  }

  return (
    <div className="admin-pricing-page">
      <div className="admin-pricing-card">
        <div className="admin-pricing-header">
          <h2>Ticket Pricing Settings</h2>
          <p>Manage default ticket pricing and mid-week discount rules.</p>
        </div>

        {message && <div className="pricing-message">{message}</div>}

        <form className="admin-pricing-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="normalPrice">Normal Ticket Price (Rs.)</label>
            <div className="input-icon-wrap">
              <i className="fa-solid fa-ticket" />
              <input
                id="normalPrice"
                type="number"
                name="normalPrice"
                min="0"
                value={formData.normalPrice}
                onChange={handleInputChange}
                placeholder="Enter standard ticket price"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                name="midWeekDiscountEnabled"
                checked={formData.midWeekDiscountEnabled}
                onChange={handleInputChange}
              />
              <span>Enable Mid-Week Discount</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="discountPercentage">Discount Percentage</label>
              <div className="input-icon-wrap">
                <i className="fa-solid fa-percent" />
                <input
                  id="discountPercentage"
                  type="number"
                  name="discountPercentage"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  disabled={!formData.midWeekDiscountEnabled}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Discounted Ticket Preview</label>
              <div className="preview-box">
                Rs. {isNaN(previewDiscountedPrice) ? 0 : previewDiscountedPrice}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Select Discount Days</label>
            <div className="days-grid">
              {days.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  className={`day-pill ${
                    formData.midWeekDays.includes(day.value) ? "active" : ""
                  }`}
                  onClick={() => handleDayToggle(day.value)}
                  disabled={!formData.midWeekDiscountEnabled}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pricing-summary">
            <h4>Pricing Summary</h4>
            <p>
              <strong>Normal Price:</strong> Rs. {formData.normalPrice}
            </p>
            <p>
              <strong>Discount:</strong>{" "}
              {formData.midWeekDiscountEnabled
                ? `${formData.discountPercentage}%`
                : "Disabled"}
            </p>
            <p>
              <strong>Discount Days:</strong>{" "}
              {formData.midWeekDiscountEnabled
                ? days
                    .filter((day) => formData.midWeekDays.includes(day.value))
                    .map((day) => day.label)
                    .join(", ") || "None selected"
                : "Not active"}
            </p>
          </div>

          <button className="save-pricing-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Pricing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPricing;