import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Checkout.css";

const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Fetch booking from backend
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        console.log("Fetching bookingId:", bookingId);

        const res = await axios.get(
          `http://localhost:5001/api/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Booking response:", res.data);
        setBooking(res.data);
      } catch (err) {
        console.error("Failed to fetch booking:", err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Calculate total: seats + foods
  const calculateTotal = () => {
    if (!booking) return 0;
    const seatTotal = booking.totalPrice || 0;
    const foodTotal = booking.foods
      ? booking.foods.reduce((sum, f) => sum + f.price * f.quantity, 0)
      : 0;
    return seatTotal; // totalPrice already includes foods if backend updated
  };

  const handlePayment = () => {
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      alert(`Payment successful via ${paymentMethod}!`);
      navigate("/myaccount", { state: { tab: "tickets" }});
    }, 1500);
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!booking) return <p>Loading checkout details...</p>;

  return (
    <div className="checkout-cont">
      <h2>Checkout Summary</h2>

      {/* Booking details */}
      <div className="checkout-sec">
        <h3>Booking Details</h3>
        <p><strong>Movie:</strong> {booking.movie?.title}</p>
        <p><strong>Showtime:</strong> {booking.showtime?.hall} - {new Date(booking.showtime?.time).toLocaleString()}</p>
        <p><strong>Seats:</strong> {booking.seats.join(", ")}</p>
      </div>

      {/* Foods */}
      <div className="checkout-sec">
        <h3>Foods & Drinks</h3>
        {booking.foods && booking.foods.length > 0 ? (
          <ul>
            {booking.foods.map((item, i) => (
              <li key={i}>
                {item.name} x {item.quantity} - Rs. {item.price * item.quantity}
              </li>
            ))}
          </ul>
        ) : (
          <p>No food items selected.</p>
        )}
      </div>

      {/* Total */}
      <div className="checkout-sec total">
        <h3>Total Amount</h3>
        <p>Rs. {calculateTotal()}</p>
      </div>

      {/* Payment method */}
      <div className="checkout-sec">
        <h3>Payment Method</h3>
        <div className="payment-options">
          {["Khalti"].map((method) => (
            <label key={method} className="payment-option">
              <input
                type="radio"
                name="payment"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {method}
            </label>
          ))}
        </div>
      </div>

      <button
        className="pay-btn"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Confirm & Pay"}
      </button>
    </div>
  );
};

export default Checkout;
