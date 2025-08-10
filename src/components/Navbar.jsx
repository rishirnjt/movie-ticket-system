import React, { useEffect, useState } from "react";
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ isLoggedIn, setIsLoggedIn }) => {
  const [showLogin, setShowLogin] = useState(false);
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
          R<span className="cube">CUBE</span>Cinemas
        </Link>
      </div>
      <ul className="navlinks">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/ticket-rates">Ticket Rates</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/contact">Contact Us</Link></li>
      </ul>

      {isLoggedIn ? (
        <button className="login-btn" onClick={handleLogout}>Logout</button>
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