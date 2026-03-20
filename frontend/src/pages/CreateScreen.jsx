import React, { useState } from "react";
import axios from "axios";

const CreateScreen = () => {
  const [form, setForm] = useState({
    name: "",
    format: "2D",
    capacity: "",
    isActive: true,
  });

  const token = localStorage.getItem("token");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5001/api/screens",
        {
          ...form,
          capacity: Number(form.capacity) || 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Screen created successfully");

      setForm({
        name: "",
        format: "2D",
        capacity: "",
        isActive: true,
      });
    } catch (err) {
      console.error("Create screen failed:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to create screen");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", color: "white" }}>
      <h2>Create Screen</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "14px" }}
      >
        <input
          type="text"
          placeholder="Screen Name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />

        <select
          value={form.format}
          onChange={(e) => handleChange("format", e.target.value)}
        >
          <option value="2D">2D</option>
          <option value="3D">3D</option>
          <option value="IMAX">IMAX</option>
          <option value="4DX">4DX</option>
        </select>

        <input
          type="number"
          placeholder="Capacity"
          value={form.capacity}
          onChange={(e) => handleChange("capacity", e.target.value)}
        />

        <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => handleChange("isActive", e.target.checked)}
          />
          Active
        </label>

        <button type="submit">Create Screen</button>
      </form>
    </div>
  );
};

export default CreateScreen;