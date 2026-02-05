import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
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

      const moviesRes = await fetch("http://localhost:5001/api/movies/recent");
      const movies = await moviesRes.json();

      const usersRes = await fetch("http://localhost:5001/api/users/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      setStats({
        bookings: 124,
        revenue: 123456,
        movies: movies.length,
        users: usersData.totalUsers,
      });

      setRecentMovies(movies);

      setRecentBookings([
        {
          _id: 1,
          user: "John",
          movie: "Interstellar",
          seats: ["A1", "A2"],
          amount: 1200,
          status: "Confirmed",
        },
        {
          _id: 2,
          user: "Alice",
          movie: "Inception",
          seats: ["B1"],
          amount: 600,
          status: "Cancelled",
        },
      ]);

      setSalesData([
        { month: "Jan", sales: 15000 },
        { month: "Feb", sales: 18000 },
        { month: "Mar", sales: 22000 },
        { month: "Apr", sales: 26000 },
        { month: "May", sales: 20000 },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="main-content">
        <h1 className="dashboard-title">
          Admin <span>Dashboard</span>
        </h1>

        {/* ===== STATS ===== */}
        <div className="stats-row">
          <div className="stats-card">
            <div className="icon"><i className="fa-solid fa-cart-shopping" /></div>
            <h5>Total Bookings</h5>
            <h3>{stats.bookings}</h3>
          </div>

          <div className="stats-card">
            <div className="icon"><i className="fa-solid fa-sack-dollar" /></div>
            <h5>Total Revenue</h5>
            <h3>Rs. {stats.revenue}</h3>
          </div>

          <div className="stats-card">
            <div className="icon"><i className="fa-solid fa-clapperboard" /></div>
            <h5>Active Movies</h5>
            <h3>{stats.movies}</h3>
          </div>

          <div className="stats-card">
            <div className="icon"><i className="fa-solid fa-user" /></div>
            <h5>Total Users</h5>
            <h3>{stats.users}</h3>
          </div>
        </div>

        {/* ===== TABLES ===== */}
        <div className="grid-two">
          <div className="glass-card">
            <h5>Recent Bookings</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Movie</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b._id}>
                    <td>{b.user}</td>
                    <td>{b.movie}</td>
                    <td>{b.seats.join(", ")}</td>
                    <td>Rs. {b.amount}</td>
                    <td>
                      <span className={`status ${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                {recentMovies.map(m => (
                  <tr key={m._id}>
                    <td>{m.title}</td>
                    <td>
                      <span className={`status ${m.isActive ? "active" : "inactive"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{m.releaseDate}</td>
                  </tr>
                ))}
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
                dot={{ fill: "#057a38ff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <footer>& copy 2025 Cinemax</footer>
      </main>
    </div>
  );
};

export default Dashboard;
