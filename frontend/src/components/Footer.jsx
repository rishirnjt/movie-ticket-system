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
          <h2>CinemaX</h2>
          <p>Book and purchase your favorite movies online. Easy, Fast, Reliable.</p>
        </div>

        {/* Quick Links */}
        <div className="footer-sec links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Ticket Rates</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-sec contact">
          <h4>Contact</h4>
          <p>Email: <a href="mailto:cinemax@gmail.com">cinemax@gmail.com</a></p>
          <p>Phone: <a href="tel:+977061528204">061-528204</a></p>
        </div>

        {/* Payment Partners */}
        <div className="footer-sec payments">
          <h4>Payment Partners</h4>
          <div className="payment-logos">
            <img src={esewaLogo} alt="eSewa" />
            <img src={khaltiLogo} alt="Khalti" />
            <img src={stripeLogo} alt="Stripe" />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-btm">
        &copy; {new Date().getFullYear()} CinemaX. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;