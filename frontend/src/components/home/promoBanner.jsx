import React from "react";
import { useNavigate } from "react-router-dom";
import "./PromoBanner.css";

const PromoBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="promo-banner">
      <div className="promo-content">
        <h2>Weekday Special</h2>
        <p>
          Enjoy <strong>50% OFF</strong> on tickets every{" "}
          <span className="highlight">Tuesday & Wednesday</span>
        </p>

        <button
          className="promo-btn"
          onClick={() => navigate("/")}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;