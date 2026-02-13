import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./MyAccount.css";
import profileImg from "../assets/profileIcon.png";
import axios from "axios";

const MyAccount = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("reservations");
  const [reservations, setReservations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // For dropdown expansion
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const location = useLocation();
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5001/api/bookings/my-reservations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReservations(res.data);
      } catch (err) {
        console.error("Failed to fetch reservations", err);
      }
    };

    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5001/api/tickets/mytickets",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTickets(res.data.tickets)
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      }
    };

    // const fetchHistory = async () => {
    //   try {
    //     const token = localStorage.getItem("token");
    //     const res = await axios.get(
    //       "http://localhost:5001/api/bookings/my-history",
    //       {
    //         headers: { Authorization: `Bearer ${token}` },
    //       }
    //     );
    //     setHistory(res.data);
    //   } catch (err) {
    //     console.error("Failed to fetch history", err);
    //   }
    // };

    fetchUser();
    fetchReservations();
    fetchTickets();
    // fetchHistory();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

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
      setUser(res.data.user);
    } catch (err) {
      setMessage("Failed to update profile.");
      console.error(err);
    }
  };

  //Cancel booking
  // Toggle seat selection for cancel/buy
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

      const { data } = await axios.post(
        `http://localhost:5001/api/bookings/cancel/${reservationId}`,
        { seats: cancelSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReservations((prev) =>
        prev.map((r) =>
          r._id === reservationId ? data.booking : r
        )
      );

      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error("Failed to cancel booking", err);
      alert("Failed to cancel booking. Try again!");
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case "reservations":
        return (
          <div className="reservations-wrapper">
            <h2 className="reservations-title">
              <i className="fa-solid fa-calendar-check"></i> My Reservations
            </h2>

            {reservations.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-film"></i>
                <h4>No Reservations</h4>
                <p>You haven’t reserved any seats yet.</p>
              </div>
            ) : (
              <div className="reservations-grid">
                {reservations.map((r) => (
                  <div key={r._id} className="reservation-card">

                    {/* Header */}
                    <div
                      className="reservation-header"
                      onClick={() => toggleRow(r._id)}
                    >
                      <div>
                        <h3>{r.movie?.title}</h3>
                        <p className="reservation-time">
                          <i className="fa-solid fa-clock"></i>{" "}
                          {r.showtime?.time
                            ? new Date(r.showtime.time).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>

                      <div className="reservation-summary">
                        <span>
                          <i className="fa-solid fa-chair"></i> {r.seats.length} Seats
                        </span>
                        <span className="reservation-price">
                          Rs. {r.totalPrice}
                        </span>
                        <i
                          className={`fa-solid ${expandedRow === r._id
                            ? "fa-chevron-up"
                            : "fa-chevron-down"
                            }`}
                        ></i>
                      </div>
                    </div>

                    {/* Expand Section */}
                    {expandedRow === r._id && (
                      <div className="reservation-body">

                        {/* Seat Selection */}
                        <div className="seat-grid">
                          {r.seats.map((seat, idx) => (
                            <div
                              key={idx}
                              className={`seat-box ${selectedSeats[r._id]?.includes(seat)
                                ? "selected"
                                : ""
                                }`}
                              onClick={() =>
                                toggleSeatSelection(r._id, seat)
                              }
                            >
                              {seat}
                            </div>
                          ))}
                        </div>

                        {/* Expiry Info */}
                        <div className="reservation-expiry">
                          <i className="fa-solid fa-hourglass-half"></i>
                          Expires on{" "}
                          {new Date(r.expiryDate).toLocaleString()}
                        </div>

                        {/* Actions */}
                        <div className="reservation-actions">
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancel(r._id)}
                          >
                            <i className="fa-solid fa-xmark"></i> Cancel Selected
                          </button>

                          <button className="buy-btn">
                            <i className="fa-solid fa-credit-card"></i> Buy Selected
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


      case "tickets":
        return (
          <div className="tickets-wrapper dark-theme">
            <h2 className="tickets-title">
              <i className="fa-solid fa-ticket me-2"></i>
              My Tickets
            </h2>

            {tickets.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-film fa-2x mb-3"></i>
                <p>No tickets yet.</p>
              </div>
            ) : (
              <>
                <div className="tickets-container">
                  {tickets.map((t) => {
                    const showTime = t.showtimeId?.time
                      ? new Date(t.showtimeId.time)
                      : null;

                    const isUpcoming =
                      showTime && showTime > new Date();

                    return (
                      <div key={t._id} className="cinema-ticket">

                        {/* LEFT - POSTER */}
                        <div className="ticket-poster-section">
                          {t.movieId?.posterUrl ? (
                            <img
                              src={t.movieId.posterUrl}
                              alt={t.movieId?.title || "Movie Poster"}
                            />
                          ) : (
                            <p>Poster not available</p>
                          )}
                        </div>

                        {/* RIGHT - INFO */}
                        <div className="ticket-info-section">
                          <div className="ticket-top">
                            <h3>{t.movieId?.title || "Unknown Movie"}</h3>
                            <span className="ticket-number">
                              Booking ID: #{t._id.slice(-6).toUpperCase()}
                            </span>
                          </div>

                          {/* STATUS */}
                          <div
                            className={`ticket-status ${isUpcoming ? "upcoming" : "completed"
                              }`}
                          >
                            {isUpcoming ? "Upcoming" : "Completed"}
                          </div>

                          <div className="ticket-details">
                            <p>
                              <i className="fa-solid fa-clock me-2"></i>
                              {showTime
                                ? showTime.toLocaleString()
                                : "Showtime unavailable"}
                            </p>

                            <p>
                              <i className="fa-solid fa-chair me-2"></i>
                              Seats: {t.seats?.join(", ") || "N/A"}
                            </p>

                            <p>
                              <i className="fa-solid fa-money-bill-wave me-2"></i>
                              Rs. {t.totalPrice}
                            </p>
                          </div>

                          {/* VIEW TICKET BUTTON */}
                          <div className="ticket-bottom">
                            <button
                              className="view-ticket-btn"
                              onClick={() => setSelectedTicket(t)}
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

                {/* E-TICKET MODAL */}
                {selectedTicket && (
                  <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div
                      className="e-ticket-card"
                      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                    >
                      <button className="close-modal" onClick={() => setSelectedTicket(null)}>
                        &times;
                      </button>

                      <div className="ticket-content">
                        <h2 className="ticket-movie">
                          {selectedTicket.movieId?.title || "Movie"}
                        </h2>

                        <p className="ticket-date">
                          {selectedTicket.showtimeId?.time
                            ? new Date(selectedTicket.showtimeId.time).toLocaleDateString()
                            : "Date unavailable"}
                        </p>

                        <p className="ticket-hall">
                          {selectedTicket.showtimeId?.hall || "Hall"}
                        </p>

                        <p className="ticket-time">
                          {selectedTicket.showtimeId?.time
                            ? new Date(selectedTicket.showtimeId.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "Time unavailable"}
                        </p>

                        <p className="ticket-seats">
                          Seats: {selectedTicket.seats?.join(", ") || "N/A"}
                        </p>

                        <p className="ticket-order-label">Order number</p>
                        <p className="ticket-order">
                          {selectedTicket._id.slice(-8).toUpperCase()}
                        </p>

                        {selectedTicket.qrCode && (
                          <img
                            src={selectedTicket.qrCode}
                            alt="QR"
                            className="ticket-qr"
                          />
                        )}
                      </div>

                      <div className="ticket-cut left"></div>
                      <div className="ticket-cut right"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );


      case "history":
        return (
          <div>
            <h2>My History</h2>
            {history.length === 0 ? (
              <p>No past bookings found.</p>
            ) : (
              <ul className="history-list">
                {history.map((h) => (
                  <li key={h._id}>
                    {h.movie?.title} -{" "}
                    {new Date(h.showtime?.time).toLocaleDateString()} (Seats:{" "}
                    {h.seats.join(", ")})
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case "settings":
        return (
          <div>
            <h2>Account Settings</h2>
            <form className="settings-form" onSubmit={handleUpdate}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label>Email (cannot change)</label>
              <input type="email" value={user?.email} disabled />

              <label>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <button type="submit">Update Profile</button>
            </form>

            {message && <p>{message}</p>}
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
          <h3>{user?.name || "Guest User"}</h3>
          <p>{user?.email}</p>
        </div>
        <nav className="sidebar-menu">
          <button onClick={() => setActiveTab("reservations")}>
            My Reservations
          </button>
          <button onClick={() => setActiveTab("tickets")}>My Tickets</button>
          <button onClick={() => setActiveTab("history")}>My History</button>
          <button onClick={() => setActiveTab("settings")}>
            Account Settings
          </button>
        </nav>
      </aside>

      <main className="account-main">{renderContent()}</main>
    </div>
  );
};

export default MyAccount;
