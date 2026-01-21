import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import StatsCard from "./StatsCard";
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/movies/recent");
      if (!res.ok) {
        throw new Error("Failed to fetch recent movies");
      }
      const moviesData = await res.json();

      const movies = Array.isArray(moviesData) ? moviesData : [];
      setRecentMovies(movies);

      // Stats (can be dynamic later)
      setStats({
        bookings: 124,
        revenue: 123456,
        movies: movies.length,
        users: 345,
      });

      // Static for now (replace with API later)
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
        {
          _id: 3,
          user: "Mike",
          movie: "Avengers",
          seats: ["C1", "C2", "C3"],
          amount: 1800,
          status: "Reserved",
        },
      ]);

      setSalesData([
        { month: "Jan", sales: 15000 },
        { month: "Feb", sales: 18000 },
        { month: "Mar", sales: 21000 },
        { month: "Apr", sales: 25000 },
        { month: "May", sales: 20000 },
        { month: "Jun", sales: 28000 },
        { month: "Jul", sales: 31000 },
      ]);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };


  return (
    <div className="container-fluid dashboard-wrapper">
      <div className="row">
        <Sidebar />

        <main className="col-md-9 col-lg-10 main-content p-4">
          <h1 className="mb-4">
            Admin <span style={{ color: "#ff4d4f" }}>Dashboard</span>
          </h1>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <StatsCard title="Total Bookings" value={stats.bookings} icon="🛒" growth={8.2} />
            <StatsCard title="Total Revenue" value={`Rs.`} icon="💰" growth={23.1} />
            <StatsCard title="Active Movies" value={stats.movies} icon="🎬" growth={5.4} />
            <StatsCard title="Total Users" value={stats.users} icon="👤" growth={12.5} />
          </div>

          <div className="row g-3 mb-4">
            {/* Recent Bookings */}
            <div className="col-md-6">
              <div className="glass-card p-3">
                <h5>Recent Bookings</h5>
                <table className="table table-dark table-striped mt-2">
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
                    {recentBookings.map((b) => (
                      <tr key={b._id}>
                        <td>{b.user}</td>
                        <td>{b.movie}</td>
                        <td>{b.seats.join(", ")}</td>
                        <td>Rs. {b.amount}</td>
                        <td>
                          <span
                            className={
                              b.status === "Confirmed"
                                ? "status-active"
                                : b.status === "Cancelled"
                                  ? "status-inactive"
                                  : "status-pending"
                            }
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Movies */}
            <div className="col-md-6">
              <div className="glass-card p-3">
                <h5>Recent Movies</h5>
                <table className="table table-dark table-striped mt-2">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Release Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovies.map((m) => (
                      <tr key={m._id}>
                        <td>{m.title}</td>
                        <td>
                          <span
                            className={m.isActive ? "status-active" : "status-inactive"}
                          >
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
          </div>

          {/* Monthly Sales Performance */}
          <div className="glass-card p-3">
            <h5>📈 Monthly Sales Performance</h5>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#322" />
                <XAxis dataKey="month" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a0a0a",
                    border: "1px solid #a10000",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#198304ff"
                  strokeWidth={3}
                  dot={{ fill: "#119e2dff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <footer className="mt-5 text-center text-light py-2">
            &copy; 2025 Cinemax
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
