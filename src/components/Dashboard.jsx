import React from "react";
import './Dashboard.css';
import { Link } from "react-router-dom";

const Dashboard = () => {
    return(
        <div className="dashboard-cont">
            <aside className="sidebar">
                <div className="profile">
                    <div className="avatar-circle">R</div>
                    <h3>Richie</h3>
                </div>
                <ul className="menu">
                    <li className="active">Dashboard</li>
                    <li><Link to="/admin/add-movie">Add Movies</Link></li>
                    <li>List Shows</li>
                    <li>List Bookings</li>
                </ul>
            </aside>

            <main className="main-content">
                <h2 className="dashboard-title">Admin <span>Dashboard</span></h2>

                <div className="stats">
                    <div className="stat-box">Total Bookings<br /></div>
                    <div className="stat-box">Total Revenue<br /></div>
                    <div className="stat-box">Active Movies<br /></div>
                    <div className="stat-box">Total Users<br /></div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;