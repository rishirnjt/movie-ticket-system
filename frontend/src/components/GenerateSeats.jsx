import React, { useEffect, useState } from "react";
import axios from "axios";

const GenerateSeats = () => {
  const [screens, setScreens] = useState([]);
  const [form, setForm] = useState({
    screenId: "",
    rows: "A,B,C,D,E",
    seatsPerRow: 10,
    overwrite: false,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchScreens();
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/screens");
      setScreens(res.data);
    } catch (err) {
      console.error("Failed to load screens", err);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const rows = form.rows
        .split(",")
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);

      await axios.post(
        `http://localhost:5001/api/screens/${form.screenId}/generate-seats`,
        {
          rows,
          seatsPerRow: Number(form.seatsPerRow),
          overwrite: form.overwrite,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("✅ Seats generated successfully");
    } catch (err) {
      console.error("Generate seats failed", err.response?.data || err.message);
      alert("❌ Failed to generate seats");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", color: "white" }}>
      <h2>Generate Seats</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "14px" }}
      >
        {/* Screen */}
        <select
          value={form.screenId}
          onChange={(e) => handleChange("screenId", e.target.value)}
          required
        >
          <option value="">Select Screen</option>
          {screens.map((screen) => (
            <option key={screen._id} value={screen._id}>
              {screen.name}
            </option>
          ))}
        </select>

        {/* Rows */}
        <input
          type="text"
          placeholder="Rows (e.g. A,B,C,D,E)"
          value={form.rows}
          onChange={(e) => handleChange("rows", e.target.value)}
        />

        {/* Seats per row */}
        <input
          type="number"
          placeholder="Seats per row"
          value={form.seatsPerRow}
          onChange={(e) => handleChange("seatsPerRow", e.target.value)}
        />

        {/* Overwrite */}
        <label>
          <input
            type="checkbox"
            checked={form.overwrite}
            onChange={(e) => handleChange("overwrite", e.target.checked)}
          />
          Overwrite existing seats
        </label>

        <button type="submit">Generate Seats</button>
      </form>
    </div>
  );
};

export default GenerateSeats;