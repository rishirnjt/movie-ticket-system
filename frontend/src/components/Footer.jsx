import React from "react";
import esewaLogo from "../assets/esewa.png";
import khaltiLogo from "../assets/khalti.png";
import stripeLogo from "../assets/stripe.png";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* Branding */}
        <div className="footer-sec branding">
          <h2>Cinema<span>X</span></h2>
          <p>
            Book and experience movies seamlessly with a modern and reliable platform.
          </p>
        </div>

        {/* Links */}
        <div className="footer-sec links">
          <h4>Explore</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/now-showing">Now Showing</a></li>
            <li><a href="/coming-soon">Coming Soon</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-sec contact">
          <h4>Contact</h4>
          <p>cinemax@gmail.com</p>
          <p>061-528204</p>
          <p>Pokhara, Nepal</p>
        </div>

        {/* Payments */}
        <div className="footer-sec payments">
          <h4>Payments</h4>
          <div className="payment-logos">
            <img src={esewaLogo} alt="eSewa" />
            <img src={khaltiLogo} alt="Khalti" />
            <img src={stripeLogo} alt="Stripe" />
          </div>
        </div>

      </div>

      <div className="footer-btm">
        © {new Date().getFullYear()} CinemaX. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;