import React, { useState } from "react";
import axios from "axios";
import "./ContactPage.css";
import { toast } from "react-toastify";
import contactBg from "../assets/contactBg.png";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5001/api/contact", form);

      if (res.status === 201) {
        toast.success("Message sent successfully!");
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      }
    } catch (err) {
      console.error("Contact form error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <section
        className="contact-hero"
        style={{ backgroundImage: `url(${contactBg})` }}
      >
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <p className="hero-mini">CINEMAX</p>
          <h1>CONTACT US</h1>
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-heading">
          <h2>Get in touch with us</h2>
          <p>
            For booking support, payment issues, refund requests, showtime
            details, or general inquiries, our team is here to help.
          </p>
        </div>

        <div className="contact-info-row">
          <div className="info-box">
            <i className="fa-solid fa-phone"></i>
            <h3>Phone</h3>
            <p>+977 9800000000</p>
            <p>+977 9800000001</p>
          </div>

          <div className="info-divider"></div>

          <div className="info-box">
            <i className="fa-solid fa-location-dot"></i>
            <h3>Address</h3>
            <p>New Road, Pokhara</p>
            <p>Nepal</p>
          </div>

          <div className="info-divider"></div>

          <div className="info-box">
            <i className="fa-regular fa-envelope"></i>
            <h3>Email</h3>
            <p>support@cinemax.com</p>
            <p>help@cinemax.com</p>
          </div>
        </div>

        <div className="contact-form-wrapper">
          <h3>If you got any questions</h3>
          <p>Please do not hesitate to send us a message.</p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={form.subject}
              onChange={handleChange}
              required
            />

            <textarea
              name="message"
              placeholder="Message"
              rows="7"
              value={form.message}
              onChange={handleChange}
              required
            ></textarea>

            <button type="submit" disabled={loading}>
              {loading ? "SENDING..." : "SEND MESSAGE"}
            </button>
          </form>
        </div>

        <div className="contact-social">
          <h2>Connect with us</h2>
          <div className="social-icons">
            <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#"><i className="fa-brands fa-x-twitter"></i></a>
            <a href="#"><i className="fa-brands fa-instagram"></i></a>
            <a href="#"><i className="fa-brands fa-youtube"></i></a>
            <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
          </div>
        </div>
      </section>

      <section className="map-section">
        <iframe
          title="CinemaX Location"
          src="https://www.google.com/maps?q=New+Road+Pokhara+Nepal&output=embed"
          loading="lazy"
          allowFullScreen
        ></iframe>
      </section>

      <section className="contact-footer-banner">
        <div className="footer-banner-overlay"></div>
        <div className="footer-banner-content">
          <h2>CinemaX</h2>
          <p>Experience movies the premium way.</p>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;