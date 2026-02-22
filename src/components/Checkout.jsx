import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import khaltiLogo from "../assets/khalti.png";
import esewaLogo from "../assets/esewa.png";
import "./Checkout.css";

const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const res = await axios.get(
          `http://localhost:5001/api/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setBooking(res.data);
      } catch (err) {
        console.error("Failed to fetch booking:", err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!booking) return <p>Loading checkout details...</p>;

  // ticket price with mid-week discount
  const showtimeDate = new Date(booking.showtime?.time);
  const day = showtimeDate.getDay();
  let ticketPricePerSeat = 300;
  if (day >= 2 && day <= 4) ticketPricePerSeat = ticketPricePerSeat / 2;

  const ticketTotal = booking.seats.length * ticketPricePerSeat;
  const foodTotal =
    booking.foods?.reduce((sum, f) => sum + f.price * f.quantity, 0) || 0;
  const total = ticketTotal + foodTotal;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Initiate Khalti payment
      const res = await axios.post(
        "http://localhost:5001/api/payment/initiate",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { payment_url } = res.data;

      // Redirect to Khalti
      window.location.href = payment_url;
    } catch (err) {
      console.error(
        "Payment initiation failed:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message || "Payment initiation failed. Try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {isProcessing && (
        <div className="loading-overlay">
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p>Redirecting to Khalti...</p>
        </div>
      )}

      <div className="checkout-cont">
        <h2> Checkout Summary</h2>

        <div className="checkout-layout">
          {/* LEFT SIDE */}
          <div className="checkout-left">
            {/* Booking Details */}
            <div className="checkout-card">
              <h3>Booking Details</h3>
              <p>
                <strong>Movie:</strong> {booking.movie?.title}
              </p>
              <p>
                <strong>Showtime:</strong> {booking.showtime?.hall} -{" "}
                {showtimeDate.toLocaleString()}
              </p>
              <p>
                <strong>Seats:</strong> {booking.seats.join(", ")}
              </p>
            </div>

            {/* Food Details */}
            <div className="checkout-card">
              <h3>Foods & Drinks</h3>
              {booking.foods?.length > 0 ? (
                <ul className="food-list">
                  {booking.foods.map((f, i) => (
                    <li key={i}>
                      <span>
                        {f.name} x {f.quantity}
                      </span>
                      <span>Rs. {f.price * f.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No food items selected.</p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="checkout-right">
            <div className="summary-card">
              <h3>Payment Summary</h3>
              <div className="summary-row">
                <span>Tickets</span>
                <span>Rs. {ticketTotal}</span>
              </div>
              <div className="summary-row">
                <span>Foods</span>
                <span>Rs. {foodTotal}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>

              <div className="payment-methods">
                <h3>Select Payment Method</h3>

                <div className="payment-options">

                  {/* Khalti */}
                  <button
                    className="payment-btn khalti"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    <img src={khaltiLogo} alt="Khalti" />
                    {isProcessing ? "Redirecting..." : "Pay with Khalti"}
                  </button>

                  {/* eSewa */}
                  <button
                    className="payment-btn esewa"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    <img src={esewaLogo} alt="eSewa" />
                    {isProcessing ? "Redirecting..." : "Pay with eSewa"}
                  </button>

                </div>

                <p className="secure-text">🔒 Secure payment gateway</p>
              </div>

              {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
