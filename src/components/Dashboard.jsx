import React, { useEffect, useState } from "react";
import './Dashboard.css';
import { NavLink } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    movies: 0,
    users: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5001); //5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-cont">
      <aside className="sidebar">
        <div className="profile">
          <div className="avatar-circle">R</div>
          <h3>Richie</h3>
        </div>
        <ul className="menu">
          <li>
            <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/add-movie" className={({ isActive }) => isActive ? "active" : ""}>
              Add Movies
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/list-shows" className={({ isActive }) => isActive ? "active" : ""}>
              List Shows
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/list-bookings" className={({ isActive }) => isActive ? "active" : ""}>
              List Bookings
            </NavLink>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <h2 className="dashboard-title">Admin <span>Dashboard</span></h2>

        <div className="stats">
          <div className="stat-box">
            <strong>Total Bookings</strong>
            <br /> {stats.bookings}
          </div>
          <div className="stat-box">
            <strong>Total Revenue</strong>
            <br /> Rs.{stats.revenue}
          </div>
          <div className="stat-box">
            <strong>Active Movies</strong>
            <br /> {stats.movies}
          </div>
          <div className="stat-box">
            <strong>Total Users</strong>
            <br /> {stats.users}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
