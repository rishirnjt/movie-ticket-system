import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [adminName, setAdminName] = useState("Admin");
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const u = JSON.parse(user);
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
      setAdminName(fullName || "Admin");
    }
  }, []);

  const toggleMenu = (menu) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenMenu(menu);
      return;
    }
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="profile-block">
          <div className="avatar">
            {adminName?.charAt(0)?.toUpperCase() || "A"}
          </div>

          {!collapsed && (
            <div className="profile-info">
              <h5>{adminName}</h5>
              <span>Admin</span>
            </div>
          )}
        </div>

        <button
          className={`collapse-btn ${collapsed ? "is-collapsed" : "is-open"}`}
          onClick={() => setCollapsed(!collapsed)}
          type="button"
        >
          <i className={`fas ${collapsed ? "fa-angle-right" : "fa-angle-left"}`} />
        </button>
      </div>

      <div className="sidebar-menu">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link menu-card ${isActive ? "active" : ""}`}>
          <div className="menu-left">
            <i className="fas fa-tachometer-alt"></i>
            {!collapsed && <span>Dashboard</span>}
          </div>
        </NavLink>


        <div className="menu-group">
          <button
            type="button"
            className={`menu-title ${openMenu === "movies" ? "open" : ""}`}
            onClick={() => toggleMenu("movies")}
          >
            <div className="menu-left">
              <i className="fas fa-film"></i>
              {!collapsed && <span>Movies</span>}
            </div>
            {!collapsed && <i className="fas fa-chevron-down menu-arrow"></i>}
          </button>

          {!collapsed && openMenu === "movies" && (
            <div className="submenu">
              <NavLink to="/admin/add-movie" className={linkClass}>
                <i className="fas fa-plus"></i>
                <span>Add Movie</span>
              </NavLink>
              <NavLink to="/admin/manage-movies" className={linkClass}>
                <i className="fas fa-list"></i>
                <span>Manage Movies</span>
              </NavLink>
              <NavLink to="/admin/archived-movies" className={linkClass}>
                <i className="fas fa-box-archive"></i>
                <span>Archived Movies</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="menu-group">
          <button
            type="button"
            className={`menu-title ${openMenu === "banners" ? "open" : ""}`}
            onClick={() => toggleMenu("banners")}
          >
            <div className="menu-left">
              <i className="fas fa-images"></i>
              {!collapsed && <span>Banners</span>}
            </div>
            {!collapsed && <i className="fas fa-chevron-down menu-arrow"></i>}
          </button>

          {!collapsed && openMenu === "banners" && (
            <div className="submenu">
              <NavLink to="/admin/add-banner" className={linkClass}>
                <i className="fas fa-plus"></i>
                <span>Add Banner</span>
              </NavLink>
              <NavLink to="/admin/banners" className={linkClass}>
                <i className="fas fa-list"></i>
                <span>Manage Banners</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="menu-group">
          <button
            type="button"
            className={`menu-title ${openMenu === "screens" ? "open" : ""}`}
            onClick={() => toggleMenu("screens")}
          >
            <div className="menu-left">
              <i className="fas fa-tv"></i>
              {!collapsed && <span>Screens</span>}
            </div>
            {!collapsed && <i className="fas fa-chevron-down menu-arrow"></i>}
          </button>

          {!collapsed && openMenu === "screens" && (
            <div className="submenu">
              <NavLink to="/admin/create-screen" className={linkClass}>
                <i className="fas fa-plus"></i>
                <span>Create Screen</span>
              </NavLink>
              <NavLink to="/admin/manage-screens" className={linkClass}>
                <i className="fas fa-list"></i>
                <span>Manage Screens</span>
              </NavLink>
              <NavLink to="/admin/generate-seats" className={linkClass}>
                <i className="fas fa-chair"></i>
                <span>Generate Seats</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink to="/admin/users" className={linkClass + " menu-card"}>
          <div className="menu-left">
            <i className="fas fa-users"></i>
            {!collapsed && <span>Users</span>}
          </div>
        </NavLink>

        <NavLink to="/admin/bookings" className={linkClass + " menu-card"}>
          <div className="menu-left">
            <i className="fas fa-ticket-alt"></i>
            {!collapsed && <span>Bookings</span>}
          </div>
        </NavLink>

        <div className="menu-group">
          <button
            type="button"
            className={`menu-title ${openMenu === "food" ? "open" : ""}`}
            onClick={() => toggleMenu("food")}
          >
            <div className="menu-left">
              <i className="fas fa-utensils"></i>
              {!collapsed && <span>Food & Drinks</span>}
            </div>
            {!collapsed && <i className="fas fa-chevron-down menu-arrow"></i>}
          </button>

          {!collapsed && openMenu === "food" && (
            <div className="submenu">
              <NavLink to="/admin/foods" className={linkClass}>
                <i className="fas fa-plus"></i>
                <span>Add Items</span>
              </NavLink>
              <NavLink to="/admin/manage-foods" className={linkClass}>
                <i className="fas fa-list"></i>
                <span>Manage Items</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink to="/admin/reports" className={({ isActive }) => `nav-link menu-card ${isActive ? "active" : ""}`}>
          <div className="menu-left">
            <i className="fas fa-chart-line"></i>
            {!collapsed && <span>Reports</span>}
          </div>
        </NavLink>

        <div className="menu-group">
          <button
            type="button"
            className={`menu-title ${openMenu === "settings" ? "open" : ""}`}
            onClick={() => toggleMenu("settings")}
          >
            <div className="menu-left">
              <i className="fas fa-cog"></i>
              {!collapsed && <span>Settings</span>}
            </div>
            {!collapsed && <i className="fas fa-chevron-down menu-arrow"></i>}
          </button>

          {!collapsed && openMenu === "settings" && (
            <div className="submenu">
              <NavLink to="/admin/pricing" className={linkClass}>
                <i className="fas fa-tags"></i>
                <span>Pricing</span>
              </NavLink>
              <NavLink to="/admin/settings" className={linkClass}>
                <i className="fas fa-sliders-h"></i>
                <span>General Settings</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      <button className="logout-btn" onClick={handleLogout} type="button">
        <i className="fas fa-sign-out-alt"></i>
        {!collapsed && <span>Logout</span>}
      </button>
      <NavLink to="/admin/reports" className={linkClass}>
        <i className="fas fa-chart-line me-2"></i> Reports
      </NavLink>

      {/* Settings */}
      <div className="menu-group">
        <div className="menu-title" onClick={() => toggleMenu("settings")}>
          <i className="fas fa-cog me-2"></i> Settings
        </div>
        {openMenu === "settings" && (
          <div className="submenu">
            <NavLink to="/admin/pricing" className={linkClass}>
              <i className="fas fa-tags me-2"></i> Pricing
            </NavLink>
            <NavLink to="/admin/settings" className={linkClass}>
              <i className="fas fa-sliders-h me-2"></i> General Settings
            </NavLink>
          </div>
        )}
      </div>

      <div className="logout mt-auto" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt me-2"></i> Logout
      </div>
    </aside>
  );
};

export default Sidebar;