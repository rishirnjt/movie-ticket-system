import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="sidebar d-flex flex-column p-3">
      <div className="text-center mb-4">
        <div className="avatar">R</div>
        <h5>Richie</h5>
      </div>

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
            <NavLink to="/admin/archived-movies" className={linkClass}>
              <i className="fas fa-box-archive me-2"></i> Archived Movies
            </NavLink>
          </div>
        )}
      </div>

      {/* Banners */}
      <div className="menu-group">
        <div className="menu-title" onClick={() => toggleMenu("banners")}>
          <i className="fas fa-images me-2"></i> Banners
        </div>
        {openMenu === "banners" && (
          <div className="submenu">
            <NavLink to="/admin/add-banner" className={linkClass}>
              <i className="fas fa-plus me-2"></i> Add Banner
            </NavLink>
            <NavLink to="/admin/banners" className={linkClass}>
              <i className="fas fa-list me-2"></i> Manage Banners
            </NavLink>
          </div>
        )}
      </div>

      {/* Screens */}
      <div className="menu-group">
        <div className="menu-title" onClick={() => toggleMenu("screens")}>
          <i className="fas fa-tv me-2"></i> Screens
        </div>
        {openMenu === "screens" && (
          <div className="submenu">
            <NavLink to="/admin/create-screen" className={linkClass}>
              <i className="fas fa-plus me-2"></i> Create Screen
            </NavLink>
            <NavLink to="/admin/manage-screens" className={linkClass}>
              <i className="fas fa-list me-2"></i> Manage Screens
            </NavLink>
            <NavLink to="/admin/generate-seats" className={linkClass}>
              <i className="fas fa-chair me-2"></i> Generate Seats
            </NavLink>
          </div>
        )}
      </div>

      <NavLink to="/admin/users" className={linkClass}>
        <i className="fas fa-users me-2"></i> Users
      </NavLink>

      <NavLink to="/admin/bookings" className={linkClass}>
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

      <NavLink to="/admin/reports" className={linkClass}>
        <i className="fas fa-chart-line me-2"></i> Reports
      </NavLink>

      <NavLink to="/admin/settings" className={linkClass}>
        <i className="fas fa-cog me-2"></i> Settings
      </NavLink>

      <div className="logout mt-auto" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt me-2"></i> Logout
      </div>
    </aside>
  );
};

export default Sidebar;