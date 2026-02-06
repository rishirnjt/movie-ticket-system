import React, { useEffect, useState } from "react";
import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import profileImg from "../assets/profileIcon.png";

const Navbar = ({ isLoggedIn, setIsLoggedIn }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    //get user info
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const fullName = `${parsedUser.firstName || ""} ${parsedUser.lastName || ""}`.trim();
      setUserName(fullName || "User");
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserName("");
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/auth?tab=signin", {
      state: { backgroundLocation: location },
    })
  }

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
          <span className="profile-name">{userName}</span>

          {dropdownOpen && (
            <div className="dropdown">
              <Link to="/myaccount">My Account</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      ) : (
        <button
          id="btn-sign-in"
          className="login-btn"
          onClick={handleLoginClick}
        >
          Sign In
        </button>
      )}
    </nav>
  );
};

export default Navbar;