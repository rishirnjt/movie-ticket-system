import React, { useEffect, useState } from "react";
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import profileImg from "../assets/profileIcon.png";

const Navbar = ({ isLoggedIn, setIsLoggedIn }) => {
  // const [showLogin, setShowLogin] = useState(false);
  const[dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link className="home-link" to="/">
          <img src={logo} alt="CinemaX" className="logo-img" />
        </Link>
      </div>

      <ul className="navlinks">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/ticket-rates">Ticket Rates</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/contact">Contact Us</Link></li>
      </ul>
      {/*authorization section */}
      {isLoggedIn ? (
        <div
          className="profile-section"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img src={profileImg} alt="profile" className="profile-icon" />
          <span className="profile-name">Richie</span>

          {dropdownOpen && (
            <div className="dropdown">
              <Link to="/myaccount">My Account</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="login-btn"
          onClick={() => navigate("/auth?tab=signin")}
        >
          Sign In
        </button>
      )}
    </nav>
  );
};

export default Navbar;