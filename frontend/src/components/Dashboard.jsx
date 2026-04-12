import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    movies: 0,
    users: 0,
  });

  const [recentMovies, setRecentMovies] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [unreadContacts, setUnreadContacts] = useState(0);
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {

    try {
      const token = localStorage.getItem("token");

      //notification
      const contactRes = await fetch("http://localhost:5001/api/contact", {
        headers: { Authorization:  `Bearer ${token}` },
      });
      const contactsData = await contactRes.json();

      const newMessages = Array.isArray(contactsData)
        ? contactsData.filter((msg) => (msg.status || "new") === "new").length
        : 0;
      setUnreadContacts(newMessages);
      // ===== RECENT MOVIES =====
      const moviesRes = await fetch("http://localhost:5001/api/movies/recent");
      const movies = await moviesRes.json();

      const today = new Date();

      const recentMoviesWithStatus = movies.map((m) => {
        const start = m.movieStartDate ? new Date(m.movieStartDate) : null;
        const end = m.movieEndDate ? new Date(m.movieEndDate) : null;

        let displayStatus = "Coming Soon";

        if (start && end) {
          if (start <= today && end >= today) {
            displayStatus = "Now Showing";
          } else if (start > today) {
            displayStatus = "Coming Soon";
          } else if (end < today) {
            displayStatus = "Archived";
          }
        }

        return { ...m, displayStatus };
      });

      setRecentMovies(recentMoviesWithStatus.slice(0, 5) || []);

      // ===== USERS COUNT =====
      const usersRes = await fetch("http://localhost:5001/api/users/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      // ===== BOOKINGS =====
      const bookingRes = await fetch(
        "http://localhost:5001/api/bookings/admin/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bookingsData = await bookingRes.json();

      const latestBookings =
        bookingsData
          ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map((b) => ({
            _id: b._id,
            user: b.user
              ? `${b.user.firstName || ""} ${b.user.lastName || ""}`
              : "Unknown",
            movie: b.movie?.title || "Unknown",
            seats: b.seatLabels || [],
            status: b.status || "unknown",
          })) || [];
      setRecentBookings(latestBookings);

      // ===== REVENUE =====
      const revenueRes = await fetch(
        "http://localhost:5001/api/tickets/admin/revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const revenueData = await revenueRes.json();

      // ===== STATS =====
      setStats({
        bookings: bookingsData?.length || 0,
        revenue: revenueData?.revenue || 0,
        movies: movies?.length || 0,
        users: usersData?.totalUsers || 0,
      });

      // ===== DYNAMIC MONTHLY SALES CHART =====
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      const monthlySales = {};

      // Initialize all months with 0
      monthNames.forEach((m) => {
        monthlySales[m] = 0;
      });

      // Sum bookings into months
      bookingsData.forEach((booking) => {
        const date = new Date(booking.createdAt);
        const month = monthNames[date.getMonth()];
        const amount = booking.totalPrice || booking.totalAmount || 0;
        monthlySales[month] += amount;
      });

      // Create chart data
      const chartData = monthNames.map((month) => ({
        month,
        sales: monthlySales[month],
      }));

      setSalesData(chartData);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };


  return (
    <div className="dashboard-wrapper">
      <main className="main-content">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <h1 className="dashboard-title">
              Admin <span>Dashboard</span>
            </h1>
          </div>

          <div className="admin-topbar-right">
           
            <button className="topbar-icon-btn" aria-label="Notifications" onClick={() => navigate("/admin/contacts")}>
              <i className="fa-regular fa-bell" />
              {unreadContacts > 0 && (
                <span className="notification-badge">{unreadContacts}</span>
              )}
            </button>

            <div className="admin-profile">
              <div className="admin-avatar">R</div>
              <span>Richie</span>
            </div>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="stats-row">
          <div className="stats-card">
            <div className="icon">
              <i className="fa-solid fa-cart-shopping" />
            </div>
            <h5>Total Bookings</h5>
            <h3>{stats.bookings}</h3>
          </div>

          <div className="stats-card">
            <div className="icon">
              <i className="fa-solid fa-sack-dollar" />
            </div>
            <h5>Total Revenue</h5>
            <h3>Rs. {(stats.revenue || 0).toLocaleString()}</h3>
          </div>

          <div className="stats-card">
            <div className="icon">
              <i className="fa-solid fa-clapperboard" />
            </div>
            <h5>Active Movies</h5>
            <h3>{stats.movies}</h3>
          </div>

          <div className="stats-card">
            <div className="icon">
              <i className="fa-solid fa-user" />
            </div>
            <h5>Total Users</h5>
            <h3>{stats.users}</h3>
          </div>
        </div>

        {/* ===== TABLES ===== */}
        <div className="grid-two">
          {/* ===== RECENT BOOKINGS ===== */}
          <div className="glass-card">
            <h5>Recent Bookings</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Movie</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="4">No bookings found</td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.user}</td>
                      <td>{b.movie}</td>
                      <td>{b.seats.join(", ")}</td>
                      <td>
                        <span className={`status ${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===== RECENT MOVIES ===== */}
          <div className="glass-card">
            <h5>Recent Movies</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Release</th>
                </tr>
              </thead>

              <tbody>
                {recentMovies.length === 0 ? (
                  <tr>
                    <td colSpan="3">No movies found</td>
                  </tr>
                ) : (
                  recentMovies.map((m) => (
                    <tr key={m._id}>
                      <td>{m.title}</td>
                      <td>
                        <span
                          className={`status ${(m.displayStatus || "coming soon")
                            .replace(" ", "-")
                            .toLowerCase()}`}
                        >
                          {m.displayStatus || "Coming Soon"}
                        </span>
                      </td>
                      <td>
                        {m.releaseDate
                          ? new Date(m.releaseDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== CHART ===== */}
        <div className="glass-card">
          <h5>📈 Monthly Sales</h5>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <CartesianGrid stroke="#2a1418" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#347a04ff"
                strokeWidth={3}
                dot={{ fill: "#065318ff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <footer>&copy; 2025 Cinemax</footer>
      </main>
    </div>
  );
};

export default Dashboard;