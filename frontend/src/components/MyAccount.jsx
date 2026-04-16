import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyAccount.css";
import profileImg from "../assets/profileIcon.png";
import axios from "axios";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { toast } from "react-toastify";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [message, setMessage] = useState("");

  const [loyalty, setLoyalty] = useState({
    points: 0,
    tier: "Bronze",
    freePopcornCount: 0,
    ticketPurchasedCount: 0,
  });

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
    const startTime = Date.now(); // ⏱ start timer

    try {
      setLoading(true);

      const headers = getAuthHeaders();

      const [userRes, reservationsRes, ticketsRes, historyRes, loyaltyRes] =
        await Promise.all([
          axios.get(`${API_URL}/api/users/me`, { headers }),
          axios.get(`${API_URL}/api/bookings/my-reservations`, { headers }),
          axios.get(`${API_URL}/api/tickets/mytickets`, { headers }),
          axios.get(`${API_URL}/api/tickets/myhistory`, { headers }),
          axios.get(`${API_URL}/api/users/loyalty`, { headers }),
        ]);

      const userData = userRes.data;
      setUser(userData);
      setName(`${userData.firstName || ""} ${userData.lastName || ""}`.trim());
      setPhone(userData.phone || "");

      setReservations(Array.isArray(reservationsRes.data) ? reservationsRes.data : []);
      setTickets(Array.isArray(ticketsRes.data?.tickets) ? ticketsRes.data.tickets : []);
      setHistory(Array.isArray(historyRes.data?.tickets) ? historyRes.data.tickets : []);
      setLoyalty(loyaltyRes.data);

    } catch (err) {
      console.error("Failed to fetch account data:", err);
      toast.error("Failed to load account data");
    } finally {
      const elapsed = Date.now() - startTime;
      const minTime = 700; 

      setTimeout(() => {
        setLoading(false);
      }, Math.max(minTime - elapsed, 0));
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
        toast.warning("Please select at least one seat to cancel.");
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

      toast.success("Booking cancelled successfully!");
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      toast.error(
        err.response?.data?.message || "Failed to cancel booking. Try again!"
      );
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

      toast.success("Ticket purchased successfully!");

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
      toast.error(err.response?.data?.message || "Failed to purchase ticket");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");

      const fullName = name.trim().replace(/\s+/g, " ");
      const parts = fullName.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");

      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("phone", phone);

      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      const res = await axios.put(`${API_URL}/api/users/update`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data.user || res.data;

      setUser(updatedUser);
      setName(
        `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim()
      );
      setPhone(updatedUser.phone || "");

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfilePic(null);
      setMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to update profile.";
      setMessage(errorMessage);
      toast.error(errorMessage);
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
                      {getScreenName(r.showtime)}
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
        const isCompleted = isHistory;

        return (
          <div
            key={t._id}
            className={`ticket-card ${isCompleted ? "expired-ticket" : "upcoming-ticket"
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
                className={`ticket-status ${isCompleted ? "completed" : "upcoming"
                  }`}
              >
                {isCompleted ? "Completed" : "Upcoming"}
              </div>

              <div className="ticket-details">
                <p>{formatShowtime(showtimeObj)}</p>
                <p>{getScreenName(showtimeObj)}</p>
                <p>
                  Seats: {seatLabels.length > 0 ? seatLabels.join(", ") : "N/A"}
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

  const renderHistory = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHistory = history.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    const totalPages = Math.ceil(history.length / itemsPerPage);

    return (
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
          <>
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Showtime</th>
                  <th>Screen</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {paginatedHistory.map((t) => {
                  const showtimeObj = t.showtimeId || t.showtime;
                  const seatLabels = getSeatLabels(t);

                  return (
                    <tr key={t._id}>
                      <td>{t.movieId?.title || t.movie?.title}</td>
                      <td>{formatShowtime(showtimeObj)}</td>
                      <td>{getScreenName(showtimeObj)}</td>
                      <td>{seatLabels.join(", ")}</td>
                      <td>Rs. {t.totalPrice ?? 0}</td>
                      <td>
                        <span className="badge bg-secondary">Completed</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination-container mt-3 d-flex justify-content-center align-items-center gap-2">
              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Prev
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    const profilePreview = profilePic
      ? URL.createObjectURL(profilePic)
      : user?.profilePic
        ? getPosterUrl(user.profilePic)
        : profileImg;

    return (
      <div className="section-block">
        <div className="section-header">
          <h2>Account Settings</h2>
          <p>Update your personal details and profile picture.</p>
        </div>

        <form className="settings-form" onSubmit={handleProfileUpdate}>
          <div className="profile-preview-wrap">
            <img
              src={profilePreview}
              alt="Profile Preview"
              className="settings-profile-preview"
            />
          </div>

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
            <label>Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
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

          <button
            type="submit"
            className="update-btn"
            disabled={savingProfile}
          >
            {savingProfile ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    );
  };

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
    return <LoadingSpinner text="Loading your account..." fullScreen />;
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

          <div className="loyalty-sidebar">
            <h4>
              <i className="fa-solid fa-gift"></i> Rewards
            </h4>

            <div className="loyalty-points">
              <span>
                <i className="fa-solid fa-coins"></i> Points
              </span>
              <strong>{loyalty.points}</strong>
            </div>

            <div className={`tier-badge tier-${loyalty.tier?.toLowerCase()}`}>
              <i className="fa-solid fa-crown"></i> {loyalty.tier}
            </div>

            <div className="loyalty-mini-stats">
              <p>
                <i className="fa-solid fa-ticket"></i> Popcorn:{" "}
                {loyalty.freePopcornCount}
              </p>
              <p>
                <i className="fa-solid fa-ticket"></i>{" "}
                {loyalty.ticketPurchasedCount}/5 tickets
              </p>
            </div>

            <div className="loyalty-progress">
              <div
                className="loyalty-progress-fill"
                style={{
                  width: `${Math.min(
                    ((loyalty.ticketPurchasedCount || 0) / 5) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </nav>
      </aside>

      <main className="account-main">{renderContent()}</main>
    </div>
  );
};

export default MyAccount;