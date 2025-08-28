import React, { useEffect, useState } from "react";
import "./MyAccount.css";
import profileImg from "../assets/profileIcon.png";
import axios from "axios";

const MyAccount = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("reservations");
  const [reservations, setReservations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [history, setHistory] = useState([]);

  // Account Settings state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/me", {
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
          "http://localhost:5000/api/bookings/my-reservations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

       setReservations(res.data);
      } catch (err) {
        console.error("Failed to fetch reservations", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/bookings/my-history",
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
        "http://localhost:5000/api/users/update",
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
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r._id}>
                      <td>{r.movie?.title || "N/A"}</td>
                      <td>
                        {r.showtime?.hall || "N/A"} -{" "}
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
                    </tr>
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
