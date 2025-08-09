import React from "react";
import "./Footer.css";

const Footer = () => {
    return(
        <footer className="footer">
            <div className="footer-content">

                <div className="footer-sec">
                    <h3>RCubeCinemas</h3>
                    <p>Book and purchase your favorite movies online. Easy Fast, Reliable.</p>
                </div>

                <div className="footer-sec">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">Ticket Rates</a></li>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Contact Us</a></li>
                    </ul>
                </div>

                <div className="footer-sec">
                    <h4>Contact</h4>
                    <p>Email:rcubecinemas@gmail.com</p>
                    <p>Phone: 061-528204</p>
                </div>

            </div>
            <div className="footer-btm">
                &copy; {new Date().getFullYear()} RCubeCinemas. All Rights Reserved.
            </div>
        </footer>
    );
};

export default Footer;