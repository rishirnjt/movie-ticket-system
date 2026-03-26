import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyAccount.css";
import profileImg from "../assets/profileIcon.png";
import axios from "axios";

const API_URL = "http://localhost:5001";

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [userRes, reservationsRes, ticketsRes, historyRes] =
        await Promise.all([
          axios.get(`${API_URL}/api/users/me`, { headers }),
          axios.get(`${API_URL}/api/bookings/my-reservations`, { headers }),
          axios.get(`${API_URL}/api/tickets/mytickets`, { headers }),
          axios.get(`${API_URL}/api/tickets/myhistory`, { headers }),
        ]);

      const userData = userRes.data;
      setUser(userData);
      setName(
        `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
      );
      setPhone(userData.phone || "");

      setReservations(
        Array.isArray(reservationsRes.data) ? reservationsRes.data : []
      );
      setTickets(
        Array.isArray(ticketsRes.data?.tickets) ? ticketsRes.data.tickets : []
      );
      setHistory(
        Array.isArray(historyRes.data?.tickets) ? historyRes.data.tickets : []
      );
    } catch (err) {
      console.error("Failed to fetch account data:", err);
      setMessage("Failed to load account data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const formatShowtime = (showtime) => {
    if (!showtime) return "Showtime unavailable";

    const rawDateTime =
      showtime.startTime ||
      showtime.time ||
      showtime.dateTime ||
      showtime.startAt ||
      showtime.datetime;

    if (rawDateTime) {
      const parsed = new Date(rawDateTime);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
    }

    if (showtime.showDate && showtime.showTime) {
      const parsedDate = new Date(showtime.showDate);
      const datePart = !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : showtime.showDate;

      return `${datePart} • ${showtime.showTime}`;
    }

    if (showtime.date && showtime.time) {
      const parsedDate = new Date(showtime.date);
      const datePart = !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        : showtime.date;

      return `${datePart} • ${showtime.time}`;
    }

    if (typeof showtime.time === "string") return showtime.time;
    if (typeof showtime.showTime === "string") return showtime.showTime;

    return "Showtime unavailable";
  };

  const getScreenName = (showtime) => {
    return (
      showtime?.screenId?.name ||
      showtime?.screen?.name ||
      showtime?.hall ||
      showtime?.screenName ||
      showtime?.theater ||
      "Screen N/A"
    );
  };

  const getSeatLabels = (item) => {
    if (Array.isArray(item?.seatLabels) && item.seatLabels.length > 0) {
      return item.seatLabels;
    }

    if (Array.isArray(item?.seats) && item.seats.length > 0) {
      return item.seats.map((seat) => {
        if (typeof seat === "string") {
          if (/^[a-f\d]{24}$/i.test(seat)) return "Seat";
          return seat;
        }

        if (seat && typeof seat === "object") {
          return (
            seat.label ||
            seat.seatNumber ||
            seat.name ||
            (seat.row && seat.number ? `${seat.row}${seat.number}` : null) ||
            "Seat"
          );
        }

        return "Seat";
      });
    }

    return [];
  };

  const getPosterUrl = (posterUrl) => {
    if (!posterUrl) return "";
    return posterUrl.startsWith("http")
      ? posterUrl
      : `${API_URL}${posterUrl}`;
  };

  const toggleSeatSelection = (reservationId, seat) => {
    setSelectedSeats((prev) => {
      const current = prev[reservationId] || [];
      const exists = current.includes(seat);

      return {
        ...prev,
        [reservationId]: exists
          ? current.filter((s) => s !== seat)
          : [...current, seat],
      };
    });
  };

  const handleCancel = async (reservationId) => {
    try {
      const cancelSeats = selectedSeats[reservationId] || [];

      if (cancelSeats.length === 0) {
        alert("Please select at least one seat to cancel.");
        return;
      }

      const headers = getAuthHeaders();

      await axios.post(
        `${API_URL}/api/bookings/cancel/${reservationId}`,
        { seats: cancelSeats },
        { headers }
      );

      setReservations((prev) =>
        prev.filter((reservation) => reservation._id !== reservationId)
      );

      setSelectedSeats((prev) => {
        const updated = { ...prev };
        delete updated[reservationId];
        return updated;
      });

      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      alert("Failed to cancel booking. Try again!");
    }
  };

  const handleBuy = async (reservationId) => {
    try {
      const headers = getAuthHeaders();

      await axios.post(
        `${API_URL}/api/tickets/from-booking/${reservationId}`,
        {},
        { headers }
      );

      alert("Ticket purchased successfully!");

      setReservations((prev) =>
        prev.filter((reservation) => reservation._id !== reservationId)
      );

      const resTickets = await axios.get(`${API_URL}/api/tickets/mytickets`, {
        headers,
      });

      setTickets(
        Array.isArray(resTickets.data?.tickets) ? resTickets.data.tickets : []
      );
    } catch (err) {
      console.error("Failed to purchase ticket:", err);
      alert("Failed to purchase ticket");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      };

      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await axios.put(
        `${API_URL}/api/users/update`,
        formData,
        { headers }
      );

      setUser(res.data.user);
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setMessage("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const renderReservations = () => (
    <div className="section-block">
      <div className="section-header">
        <h2>My Reservations</h2>
        <p>Manage your reserved seats before purchase.</p>
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state">
          <h4>No Reservations</h4>
          <p>You haven’t reserved any seats yet.</p>
        </div>
      ) : (
        <div className="reservation-list">
          {reservations.map((r) => {
            const seatLabels = getSeatLabels(r);

            return (
              <div key={r._id} className="reservation-card">
                <div
                  className="reservation-header"
                  onClick={() => toggleRow(r._id)}
                >
                  <div className="reservation-left">
                    <h3>{r.movie?.title || "Untitled Movie"}</h3>

                    <p className="reservation-time">
                      {formatShowtime(r.showtime)}
                    </p>

                    <p className="reservation-screen">
                      🎬 {getScreenName(r.showtime)}
                    </p>

                    <p className="reservation-seats">
                      Seats:{" "}
                      {seatLabels.length > 0 ? seatLabels.join(", ") : "N/A"}
                    </p>
                  </div>

                  <div className="reservation-right">
                    <span>{seatLabels.length} Seats</span>
                    <strong>Rs. {r.totalPrice ?? 0}</strong>
                  </div>
                </div>

                {expandedRow === r._id && (
                  <div className="reservation-body">
                    <div className="seat-grid">
                      {seatLabels.length > 0 ? (
                        seatLabels.map((seat, idx) => (
                          <div
                            key={`${seat}-${idx}`}
                            className={`seat-box ${selectedSeats[r._id]?.includes(seat)
                                ? "selected"
                                : ""
                              }`}
                            onClick={() => toggleSeatSelection(r._id, seat)}
                          >
                            {seat}
                          </div>
                        ))
                      ) : (
                        <p className="muted-text">No seats available</p>
                      )}
                    </div>

                    <div className="reservation-actions">
                      <button
                        className="action-btn cancel-btn"
                        onClick={() => handleCancel(r._id)}
                      >
                        Cancel Selected
                      </button>

                      <button
                        className="action-btn buy-btn"
                        onClick={() => handleBuy(r._id)}
                      >
                        Buy Ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderTicketCards = (items, isHistory = false) => (
    <div className="ticket-grid">
      {items.map((t) => {
        const showtimeObj = t.showtimeId || t.showtime;
        const seatLabels = getSeatLabels(t);

        const parsedTime = new Date(
          showtimeObj?.time ||
          showtimeObj?.startTime ||
          showtimeObj?.dateTime ||
          showtimeObj?.startAt ||
          ""
        );

        const isUpcoming =
          !isHistory &&
          !Number.isNaN(parsedTime.getTime()) &&
          parsedTime > new Date();

        return (
          <div
            key={t._id}
            className={`ticket-card ${isHistory || !isUpcoming ? "expired-ticket" : "upcoming-ticket"
              }`}
          >
            <div className="ticket-poster">
              {t.movieId?.posterUrl || t.movie?.posterUrl ? (
                <img
                  src={getPosterUrl(t.movieId?.posterUrl || t.movie?.posterUrl)}
                  alt={t.movieId?.title || t.movie?.title || "Movie Poster"}
                />
              ) : (
                <div className="poster-fallback">No Poster</div>
              )}
            </div>

            <div className="ticket-content">
              <div className="ticket-top">
                <h3>{t.movieId?.title || t.movie?.title || "Untitled Movie"}</h3>
                <span className="ticket-id">
                  #{t._id?.slice(-6)?.toUpperCase()}
                </span>
              </div>

              <div
                className={`ticket-status ${isHistory || !isUpcoming ? "completed" : "upcoming"
                  }`}
              >
                {isHistory || !isUpcoming ? "Completed" : "Upcoming"}
              </div>

              <div className="ticket-details">
                <p>{formatShowtime(showtimeObj)}</p>
                <p>{getScreenName(showtimeObj)}</p>
                <p>
                  Seats:{" "}
                  {seatLabels.length > 0 ? seatLabels.join(", ") : "N/A"}
                </p>
                <p>Rs. {t.totalPrice ?? 0}</p>
              </div>

              {!isHistory && (
                <button
                  className="view-ticket-btn"
                  onClick={() => navigate(`/ticket/${t._id}`)}
                >
                  View Ticket
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTickets = () => (
    <div className="section-block">
      <div className="section-header">
        <h2>My Tickets</h2>
        <p>Your active and upcoming booked tickets.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <p>No tickets yet.</p>
        </div>
      ) : (
        renderTicketCards(tickets, false)
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="section-block">
      <div className="section-header">
        <h2>My History</h2>
        <p>Your past bookings and completed shows.</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>No past tickets.</p>
        </div>
      ) : (
        renderTicketCards(history, true)
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="section-block">
      <div className="section-header">
        <h2>Account Settings</h2>
        <p>Update your personal details and profile image.</p>
      </div>

      <form className="settings-form" onSubmit={handleProfileUpdate}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div className="form-group">
          <label>Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files[0])}
          />
        </div>

        {message && <p className="update-message">{message}</p>}

        <button type="submit" className="update-btn" disabled={savingProfile}>
          {savingProfile ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "reservations":
        return renderReservations();
      case "tickets":
        return renderTickets();
      case "history":
        return renderHistory();
      case "settings":
        return renderSettings();
      default:
        return renderReservations();
    }
  };

  if (loading) {
    return (
      <div className="account-container">
        <div className="account-loading">Loading your account...</div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <aside className="account-sidebar">
        <div className="profile-card">
          <img
            src={user?.profilePic ? getPosterUrl(user.profilePic) : profileImg}
            alt="profile"
            className="profile-avatar"
          />
          <h3>{user ? `${user.firstName} ${user.lastName}` : "User"}</h3>
          <p>{user?.email}</p>
        </div>

        <nav className="sidebar-menu">
          <button
            className={activeTab === "reservations" ? "active" : ""}
            onClick={() => setActiveTab("reservations")}
          >
            My Reservations
          </button>

          <button
            className={activeTab === "tickets" ? "active" : ""}
            onClick={() => setActiveTab("tickets")}
          >
            My Tickets
          </button>

          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            My History
          </button>

          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            Account Settings
          </button>
        </nav>
      </aside>

      <main className="account-main">{renderContent()}</main>
    </div>
  );
};

export default MyAccount;