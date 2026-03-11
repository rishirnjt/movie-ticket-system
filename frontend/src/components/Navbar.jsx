// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import profileImg from "../assets/profileIcon.png";

const Navbar = ({ isLoggedIn, setIsLoggedIn }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  //User info
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const u = JSON.parse(user);
      setUserName(`${u.firstName || ""} ${u.lastName || ""}`.trim() || "User");
    }
  }, [isLoggedIn]);

  //Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const fetchSearch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5001/api/movies/search?q=${searchQuery}`
        );
        setResults(res.data);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchSearch, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/auth?tab=signin", {
      state: { backgroundLocation: location },
    });
  };

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <Link to="/">
          <img src={logo} alt="CinemaX" className="logo-img" />
        </Link>

        <ul className="navlinks">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/ticket-rates">Ticket Rates</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {/* SEARCH */}
        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <div className="search-dropdown">
              {loading && <p className="loading">Searching...</p>}

              {!loading && results.length === 0 && (
                <p className="no-results">Searching...</p>
              )}

              {results.map((movie) => (
                <div
                  key={movie._id}
                  className="search-item"
                  onClick={() => {
                    navigate(`/movie/${movie._id}`);
                    setSearchQuery("");
                  }}
                >
                  <img src={movie.posterUrl} alt={movie.title} />
                  <div>
                    <p>{movie.title}</p>
                    <span>{movie.genre}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {isLoggedIn ? (
          <div className="profile-wrapper" ref={dropdownRef}>
            <div
              className="profile-section"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
            >
              <img src={profileImg} className="profile-icon" alt="profile" />
              <span className="profile-name">{userName}</span>
            </div>

            {dropdownOpen && (
              <div className="dropdown">
                <Link to="/myaccount" onClick={() => setDropdownOpen(false)}>
                  My Account
                </Link>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>

        ) : (
          <button className="login-btn" onClick={handleLoginClick}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
