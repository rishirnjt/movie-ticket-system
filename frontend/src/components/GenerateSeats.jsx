import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./GenerateSeats.css";
import { toast } from "react-toastify";

const GenerateSeats = () => {
  const [screens, setScreens] = useState([]);
  const [loadingScreens, setLoadingScreens] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      setLoadingScreens(true);
      const res = await axios.get("http://localhost:5001/api/screens");
      setScreens(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load screens", err);
      toast.error("Failed to load screens");
    } finally {
      setLoadingScreens(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const parsedRows = useMemo(() => {
    return form.rows
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);
  }, [form.rows]);

  const seatsPerRow = Number(form.seatsPerRow || 0);

  const selectedScreen = useMemo(() => {
    return screens.find((screen) => screen._id === form.screenId);
  }, [screens, form.screenId]);

  const totalSeats = parsedRows.length * seatsPerRow;

  const seatLayout = useMemo(() => {
    return parsedRows.map((row) => ({
      row,
      seats: Array.from({ length: seatsPerRow }, (_, i) => ({
        label: `${row}${i + 1}`,
        number: i + 1,
      })),
    }));
  }, [parsedRows, seatsPerRow]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.screenId) {
      newErrors.screenId = "Please select a screen";
    }

    if (!parsedRows.length) {
      newErrors.rows = "Please enter at least one row";
    }

    if (!form.seatsPerRow || Number(form.seatsPerRow) <= 0) {
      newErrors.seatsPerRow = "Seats per row must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setForm({
      screenId: "",
      rows: "A,B,C,D,E",
      seatsPerRow: 10,
      overwrite: false,
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
    

      await axios.post(
        `http://localhost:5001/api/screens/${form.screenId}/generate-seats`,
        {
          rows: parsedRows,
          seatsPerRow,
          overwrite: form.overwrite,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Seats generated successfully");
    } catch (err) {
      console.error("Generate seats failed", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to generate seats");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="generate-seats-page">
      <div className="generate-seats-card">
        <div className="generate-seats-header">
          <div>
            <span className="seats-badge">Admin Panel</span>
            <h2>Generate Seats</h2>
            <p>
              Create seat rows and preview the exact cinema layout before
              generating seats.
            </p>
          </div>

          <div className="seats-icon-wrap">
            <i className="fas fa-chair"></i>
          </div>
        </div>

      

        <form className="generate-seats-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Screen</label>
            <select
              value={form.screenId}
              onChange={(e) => handleChange("screenId", e.target.value)}
              disabled={loadingScreens}
            >
              <option value="">
                {loadingScreens ? "Loading screens..." : "Select Screen"}
              </option>
              {screens.map((screen) => (
                <option key={screen._id} value={screen._id}>
                  {screen.name} {screen.format ? `(${screen.format})` : ""}
                </option>
              ))}
            </select>
            {errors.screenId && (
              <span className="field-error">{errors.screenId}</span>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Rows</label>
              <input
                type="text"
                placeholder="A,B,C,D,E"
                value={form.rows}
                onChange={(e) => handleChange("rows", e.target.value)}
              />
              <small className="field-help">
                Separate rows with commas. Example: A,B,C,D,E
              </small>
              {errors.rows && <span className="field-error">{errors.rows}</span>}
            </div>

            <div className="form-group">
              <label>Seats Per Row</label>
              <input
                type="number"
                min="1"
                placeholder="10"
                value={form.seatsPerRow}
                onChange={(e) => handleChange("seatsPerRow", e.target.value)}
              />
              <small className="field-help">
                Number of seats in each row
              </small>
              {errors.seatsPerRow && (
                <span className="field-error">{errors.seatsPerRow}</span>
              )}
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <label className="toggle-title">Overwrite Existing Seats</label>
              <p className="toggle-subtitle">
                Turn this on only if you want to replace seats already generated
                for this screen.
              </p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={form.overwrite}
                onChange={(e) => handleChange("overwrite", e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="seat-preview">
            <div className="preview-head">
              <div>
                <h4>Seat Layout Preview</h4>
                <p>
                  {selectedScreen?.name || "No screen selected"} • {parsedRows.length} rows •{" "}
                  {seatsPerRow || 0} seats per row • {totalSeats || 0} total seats
                </p>
              </div>
              <div className="preview-legend">
                <span><i></i> Seat</span>
              </div>
            </div>

            <div className="screen-stage">SCREEN THIS WAY</div>

            <div className="seat-map">
              {seatLayout.length > 0 && seatsPerRow > 0 ? (
                seatLayout.map((rowData) => (
                  <div className="seat-row" key={rowData.row}>
                    <div className="row-label">{rowData.row}</div>

                    <div className="row-seats">
                      {rowData.seats.map((seat) => (
                        <div key={seat.label} className="seat-box" title={seat.label}>
                          {seat.number}
                        </div>
                      ))}
                    </div>

                    <div className="row-label right">{rowData.row}</div>
                  </div>
                ))
              ) : (
                <div className="empty-seat-map">
                  Enter rows and seats per row to preview the layout.
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? "Generating..." : "Generate Seats"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateSeats;