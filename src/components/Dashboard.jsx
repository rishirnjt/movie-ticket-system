import React, { useEffect, useState } from "react";
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
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    movies: 0,
    users: 0,
  });

  const [recentMovies, setRecentMovies] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      //Movies
      const moviesRes = await fetch("http://localhost:5001/api/movies/recent");
      const movies = await moviesRes.json();

      setRecentMovies(movies?.slice(0, 5) || []);

      //Users
      const usersRes = await fetch("http://localhost:5001/api/users/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      // Bookings
      const bookingRes = await fetch(
        "http://localhost:5001/api/bookings/admin/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bookingsData = await bookingRes.json();

      const latestBookings = bookingsData
        ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((b) => ({
          _id: b._id,
          user: b.user
            ? `${b.user.firstName || ""} ${b.user.lastName || ""}`
            : "Unknown",
          movie: b.movie?.title || "Unknown",
          seats: b.seats || [],
          status: b.status || "unknown",
        })) || [];

      setRecentBookings(latestBookings);

      const revenueRes = await fetch(
        "http://localhost:5001/api/tickets/admin/revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const revenueData = await revenueRes.json();

      //stats
      setStats({
        bookings: bookingsData?.length || 0,
        revenue: revenueData?.revenue || 0,
        movies: movies?.length || 0,
        users: usersData?.totalUsers || 0,
      });

      // ===== SALES CHART (TEMP STATIC) =====
      setSalesData([
        { month: "Jan", sales: 15000 },
        { month: "Feb", sales: 18000 },
        { month: "Mar", sales: 22000 },
        { month: "Apr", sales: 26000 },
        { month: "May", sales: 20000 },
      ]);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <main className="main-content">
        <h1 className="dashboard-title">
          Admin <span>Dashboard</span>
        </h1>

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
            <h3>Rs. {(stats.revenue || 0).toLocaleString()}</h3>          </div>

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
                        <span
                          className={`status ${b.status.toLowerCase()}`}
                        >
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
                          className={`status ${m.isActive ? "active" : "inactive"
                            }`}
                        >
                          {m.isActive ? "Active" : "Inactive"}
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
                dataKey="sales"
                stroke="#098c30ff"
                strokeWidth={3}
                dot={{ fill: "#4dff9aff" }}
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
