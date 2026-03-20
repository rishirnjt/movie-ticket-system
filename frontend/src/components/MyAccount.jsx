import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyAccount.css";
import profileImg from "../assets/profileIcon.png";
import axios from "axios";

const MyAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("reservations");
  const [reservations, setReservations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [message, setMessage] = useState("");

  // For Account Settings
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

   const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5001/api/users/update",
        { name, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Profile updated successfully!");
      // Update the user state after successful update
      setUser(res.data.user);
    } catch (err) {
      setMessage("Failed to update profile.");
      console.error(err);
    }
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // User info
        const userRes = await axios.get("http://localhost:5001/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
        setName(userRes.data.firstName + " " + userRes.data.lastName);
        setPhone(userRes.data.phone || "");

        // Reservations
        const resReservations = await axios.get(
          "http://localhost:5001/api/bookings/my-reservations",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReservations(resReservations.data);

        // Tickets
        const resTickets = await axios.get(
          "http://localhost:5001/api/tickets/mytickets",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTickets(resTickets.data.tickets);

        // History
        const resHistory = await axios.get(
          "http://localhost:5001/api/tickets/myhistory",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistory(resHistory.data.tickets);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    fetchData();
  }, []);

  // ===== Account Settings Handlers =====
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

  // ===== Seat / Reservation Handlers =====
  const toggleSeatSelection = (reservationId, seat) => {
    setSelectedSeats((prev) => {
      const current = prev[reservationId] || [];
      if (current.includes(seat)) {
        return { ...prev, [reservationId]: current.filter((s) => s !== seat) };
      } else {
        return { ...prev, [reservationId]: [...current, seat] };
      }
    });
  };

  const handleCancel = async (reservationId) => {
    try {
      const cancelSeats = selectedSeats[reservationId] || [];
      if (cancelSeats.length === 0) {
        alert("Please select at least one seat to cancel.");
        return;
      }
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/bookings/cancel/${reservationId}`,
        { seats: cancelSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReservations((prev) => prev.filter((r) => r._id !== reservationId));
      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking. Try again!");
    }
  };

  const handleBuy = async (reservationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/tickets/from-booking/${reservationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Ticket purchased successfully!");
      setReservations((prev) => prev.filter((r) => r._id !== reservationId));
      const resTickets = await axios.get(
        "http://localhost:5001/api/tickets/mytickets",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTickets(resTickets.data.tickets);
    } catch (err) {
      console.error(err);
      alert("Failed to purchase ticket");
    }
  };

  // ===== Render Tab Content =====
 const renderContent = () => {
  switch (activeTab) {
    /* ================= RESERVATIONS ================= */
    case "reservations":
      return (
        <div className="reservations-wrapper">
          <h2 className="reservations-title">
            <i className="fa-solid fa-calendar-check"></i> My Reservations
          </h2>

          {reservations.length === 0 ? (
            <div className="empty-state">
              <h4>No Reservations</h4>
              <p>You haven’t reserved any seats yet.</p>
            </div>
          ) : (
            <div className="reservations-grid">
              {reservations.map((r) => (
                <div key={r._id} className="reservation-card">
                  <div
                    className="reservation-header"
                    onClick={() => toggleRow(r._id)}
                  >
                    <div>
                      <h3>{r.movie?.title}</h3>
                      <p className="reservation-time">
                        {r.showtime?.time
                          ? new Date(r.showtime.time).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="reservation-summary">
                      <span>{r.seats.length} Seats</span>
                      <span className="reservation-price">
                        Rs. {r.totalPrice}
                      </span>
                    </div>
                  </div>

                  {expandedRow === r._id && (
                    <div className="reservation-body">
                      <div className="seat-grid">
                        {r.seats.map((seat, idx) => (
                          <div
                            key={idx}
                            className={`seat-box ${
                              selectedSeats[r._id]?.includes(seat)
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => toggleSeatSelection(r._id, seat)}
                          >
                            {seat}
                          </div>
                        ))}
                      </div>

                      <div className="reservation-actions">
                        <button
                          className="cancel-btn"
                          onClick={() => handleCancel(r._id)}
                        >
                          Cancel Selected
                        </button>

                        <button
                          className="buy-button"
                          onClick={() => handleBuy(r._id)}
                        >
                          Buy Ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    /* ================= TICKETS ================= */
    case "tickets":
      return (
        <div className="tickets-wrapper dark-theme">
          <h2 className="tickets-title">
            <i className="fa-solid fa-ticket me-2"></i> My Tickets
          </h2>

          {tickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets yet.</p>
            </div>
          ) : (
            <div className="tickets-container">
              {tickets.map((t) => {
                const showTime = t.showtimeId?.time
                  ? new Date(t.showtimeId.time)
                  : null;

                const isUpcoming = showTime && showTime > new Date();

                return (
                  <div
                    key={t._id}
                    className={`cinema-ticket ${
                      isUpcoming ? "" : "expired-ticket"
                    }`}
                  >
                    <div className="ticket-poster-section">
                      {t.movieId?.posterUrl ? (
                        <img
                          src={t.movieId.posterUrl}
                          alt={t.movieId?.title}
                        />
                      ) : (
                        <p>Poster not available</p>
                      )}
                    </div>

                    <div className="ticket-info-section">
                      <div className="ticket-top">
                        <h3>{t.movieId?.title}</h3>
                        <span className="ticket-number">
                          Booking ID: #{t._id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <div
                        className={`ticket-status ${
                          isUpcoming ? "upcoming" : "completed"
                        }`}
                      >
                        {isUpcoming ? "Upcoming" : "Completed"}
                      </div>

                      <div className="ticket-details">
                        <p>
                          {showTime
                            ? showTime.toLocaleString()
                            : "Showtime unavailable"}
                        </p>
                        <p>Seats: {t.seats?.join(", ")}</p>
                        <p>Rs. {t.totalPrice}</p>
                      </div>

                      <div className="ticket-bottom">
                        <button
                          className="view-ticket-btn"
                          onClick={() => navigate(`/ticket/${t._id}`)}
                        >
                          View Ticket
                        </button>
                      </div>
                    </div>

                    <div className="ticket-perforation"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    /* ================= HISTORY ================= */
    case "history":
      return (
        <div className="tickets-wrapper dark-theme">
          <h2 className="tickets-title">
            <i className="fa-solid fa-clock-rotate-left"></i> My History
          </h2>

          {history.length === 0 ? (
            <div className="empty-state">
              <p>No past tickets.</p>
            </div>
          ) : (
            <div className="tickets-container">
              {history.map((t) => {
                const showTime = t.showtimeId?.time
                  ? new Date(t.showtimeId.time)
                  : null;

                return (
                  <div key={t._id} className="cinema-ticket expired-ticket">
                    <div className="ticket-poster-section">
                      {t.movieId?.posterUrl ? (
                        <img
                          src={t.movieId.posterUrl}
                          alt={t.movieId?.title}
                        />
                      ) : (
                        <p>Poster not available</p>
                      )}
                    </div>

                    <div className="ticket-info-section">
                      <div className="ticket-top">
                        <h3>{t.movieId?.title}</h3>
                        <span className="ticket-number">
                          Booking ID: #{t._id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <div className="ticket-status completed">Expired</div>

                      <div className="ticket-details">
                        <p>
                          {showTime
                            ? showTime.toLocaleString()
                            : "Showtime unavailable"}
                        </p>
                        <p>Seats: {t.seats?.join(", ")}</p>
                        <p>Rs. {t.totalPrice}</p>
                      </div>
                    </div>

                    <div className="ticket-perforation"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

    /* ================= ACCOUNT SETTINGS ================= */
    case "settings":
      return (
        <div className="account-settings">
          <h2>
            <i className="fa-solid fa-user-gear"></i> Account Settings
          </h2>

          <form className="settings-form" onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {message && <p className="update-message">{message}</p>}

            <button type="submit" className="update-btn">
              Update Profile
            </button>
          </form>
        </div>
      );

    default:
      return <h2>Welcome to My Account</h2>;
  }
};

  return (
    <div className="account-container">
      <aside className="account-sidebar">
        <div className="profile-info">
          <img
            src={user?.profilePic || profileImg}
            alt="profile"
            className="profile-avatar"
          />
          <h3>{user ? `${user.firstName} ${user.lastName}` : ""}</h3>
          <p>{user?.email}</p>
        </div>
        <nav className="sidebar-menu">
          <button onClick={() => setActiveTab("reservations")}>
            My Reservations
          </button>
          <button onClick={() => setActiveTab("tickets")}>My Tickets</button>
          <button onClick={() => setActiveTab("history")}>My History</button>
          <button onClick={() => setActiveTab("settings")}>Account Settings</button>
        </nav>
      </aside>

      <main className="account-main">
        <div className="tab-content">{renderContent()}</div>
      </main>
    </div>
  );
};

export default MyAccount;