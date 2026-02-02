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

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5001/api/bookings/my-history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };

    fetchUser();
    fetchReservations();
    fetchTickets();
    fetchHistory();
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
          <div>
            <h2>My Reservations</h2>
            {reservations.length === 0 ? (
              <p>You do not have any reservations.</p>
            ) : (
              <table className="account-table">
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Showtime</th>
                    <th>Seats</th>
                    <th>Quantity</th>
                    <th>Price / Ticket</th>
                    <th>Total</th>
                    <th>Reserved On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <React.Fragment key={r._id}>
                      <tr
                        onClick={() => toggleRow(r._id)}
                        className="reservation-row"
                      >
                        <td>{r.movie?.title || "N/A"}</td>
                        <td>
                          {r.showtime?.time
                            ? new Date(r.showtime.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "N/A"}

                        </td>
                        <td>{r.seats.join(", ")}</td>
                        <td>{r.seats.length}</td>
                        <td>Rs. {Math.floor(r.totalPrice / r.seats.length)}</td>
                        <td>Rs. {r.totalPrice}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="dropdown-toggle">
                            {expandedRow === r._id ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === r._id && (
                        <tr className="dropdown-row">
                          <td colSpan="8">
                            <table className="dropdown-table">
                              <thead>
                                <tr>
                                  <th>Seat No.</th>
                                  <th>Expiry Date</th>
                                  <th>Expiry Time</th>
                                  <th>Select</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.seats.map((seat, idx) => (
                                  <tr key={idx}>
                                    <td>{seat}</td>
                                    <td>
                                      {new Date(r.expiryDate).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </td>
                                    <td>
                                      {new Date(r.expiryDate).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </td>
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={selectedSeats[r._id]?.includes(seat) || false}
                                        onChange={() => toggleSeatSelection(r._id, seat)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>

                            </table>

                            <div className="dropdown-actions">
                              <button className="cancel-btn" onClick={() => handleCancel(r._id, selectedSeats[r._id] || [])}>
                                Cancel Selected
                              </button>
                              <button className="buy-btn">
                                Buy Selected
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case "tickets":
        return (
          <div>
            <h2>My Tickets</h2>
            {tickets.length === 0 ? (
              <p>No tickets found.</p>
            ) : (
              <ul>
                {tickets.map((t) => (
                  <li key={t._id}>{t.movie?.title}</li>
                ))}
              </ul>
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
