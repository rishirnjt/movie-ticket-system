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

  const showtimeDate = booking.showtime?.startTime
    ? new Date(booking.showtime.startTime)
    : null;

  const day = showtimeDate ? showtimeDate.getDay() : null;

  let ticketPricePerSeat = 300;
  if (day !== null && day >= 2 && day <= 4) {
    ticketPricePerSeat = ticketPricePerSeat / 2;
  }

  const seatLabels = (booking.seats || [])
    .map((seat) => (typeof seat === "string" ? seat : seat.label))
    .join(", ");

  const ticketTotal = (booking.seats?.length || 0) * ticketPricePerSeat;
  const foodTotal =
    booking.foods?.reduce((sum, f) => sum + f.price * f.quantity, 0) || 0;
  const total = ticketTotal + foodTotal;

  const handlePayment = async (gateway) => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("User not authenticated");
      }

      const res = await axios.post(
        "http://localhost:5001/api/payment/initiate",
        { bookingId, gateway },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (gateway === "khalti") {
        const { payment_url } = res.data;

        if (!payment_url) {
          throw new Error("Khalti payment URL not received");
        }

        window.location.href = payment_url;
        return;
      }

      if (gateway === "esewa") {
        const { url, formData } = res.data;

        if (!url || !formData) {
          throw new Error("eSewa form data not received");
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;

        Object.keys(formData).forEach((key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = formData[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      throw new Error("Invalid payment gateway selected");
    } catch (err) {
      console.error("Payment initiation failed:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        bookingId,
        gateway,
      });

      setError(
        err.response?.data?.message ||
          err.message ||
          "Payment initiation failed."
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
          <p>Redirecting to payment...</p>
        </div>
      )}

      <div className="checkout-cont">
        <h2>Checkout Summary</h2>

        <div className="checkout-layout">
          <div className="checkout-left">
            <div className="checkout-card">
              <h3>Booking Details</h3>
              <p>
                <strong>Movie:</strong> {booking.movie?.title}
              </p>
              <p>
                <strong>Showtime:</strong>{" "}
                {booking.showtime?.screenId?.name || "Screen"} -{" "}
                {showtimeDate ? showtimeDate.toLocaleString() : "N/A"}
              </p>
              <p>
                <strong>Seats:</strong> {seatLabels || "No seats selected"}
              </p>
            </div>

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
                  <button
                    className="payment-btn khalti"
                    onClick={() => handlePayment("khalti")}
                    disabled={isProcessing}
                  >
                    <img src={khaltiLogo} alt="Khalti" />
                    {isProcessing ? "Redirecting..." : "Pay with Khalti"}
                  </button>

                  <button
                    className="payment-btn esewa"
                    onClick={() => handlePayment("esewa")}
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