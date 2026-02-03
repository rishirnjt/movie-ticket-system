import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <aside className="sidebar d-flex flex-column p-3">

      <div className="text-center mb-4">
        <div className="avatar">R</div>
        <h5>Richie</h5>
      </div>

      {/* Dashboard */}
      <NavLink to="/admin/dashboard" className={linkClass}>
        <i className="fas fa-tachometer-alt me-2"></i> Dashboard
      </NavLink>

      {/* Movies */}
      <div className="menu-group">
        <div className="menu-title" onClick={() => toggleMenu("movies")}>
          <i className="fas fa-film me-2"></i> Movies
        </div>
        {openMenu === "movies" && (
          <div className="submenu">
            <NavLink to="/admin/add-movie" className={linkClass}>
              <i className="fas fa-plus me-2"></i> Add Movie
            </NavLink>
            <NavLink to="/admin/manage-movies" className={linkClass}>
              <i className="fas fa-list me-2"></i> Manage Movies
            </NavLink>
          </div>
        )}
      </div>

      {/* Showtimes */}
      <div className="menu-group">
        <div className="menu-title" onClick={() => toggleMenu("shows")}>
          <i className="fas fa-clock me-2"></i> Showtimes
        </div>
        {openMenu === "shows" && (
          <div className="submenu">
            <NavLink to="/admin/add-show" className={linkClass}>
              <i className="fas fa-plus me-2"></i> Add Show
            </NavLink>
            <NavLink to="/admin/list-shows" className={linkClass}>
              <i className="fas fa-list me-2"></i> Manage Shows
            </NavLink>
          </div>
        )}
      </div>

      {/* Bookings */}
      <NavLink to="/admin/list-bookings" className={linkClass}>
        <i className="fas fa-ticket-alt me-2"></i> Bookings
      </NavLink>

      {/* Food */}
      <div className="menu-group">
        <div className="menu-title" onClick={() => toggleMenu("food")}>
          <i className="fas fa-utensils me-2"></i> Food & Drinks
        </div>
        {openMenu === "food" && (
          <div className="submenu">
            <NavLink to="/admin/foods" className={linkClass}>
              <i className="fas fa-plus me-2"></i> Add Items
            </NavLink>
            <NavLink to="/admin/manage-foods" className={linkClass}>
              <i className="fas fa-list me-2"></i> Manage Items
            </NavLink>
          </div>
        )}
      </div>

      {/* Reports */}
      <NavLink to="/admin/reports" className={linkClass}>
        <i className="fas fa-chart-line me-2"></i> Reports
      </NavLink>

      {/* Settings */}
      <NavLink to="/admin/settings" className={linkClass}>
        <i className="fas fa-cog me-2"></i> Settings
      </NavLink>

      <div className="logout mt-auto">
        <i className="fas fa-sign-out-alt me-2"></i> Logout
      </div>
    </aside>
  );
};

export default Sidebar;
