import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Checkout.css";

const PAYMENT_METHODS = [
  {
    id: "khalti",
    name: "Khalti",
    description: "Fast payment with Khalti wallet or bank options",
  },
  {
    id: "esewa",
    name: "eSewa",
    description: "Pay securely using your eSewa account",
  },
  {
    id: "stripe",
    name: "Card Payment",
    description: "Pay with debit or credit card via Stripe",
  },
];

const Checkout = ({ booking, bookingId }) => {
  const [selectedGateway, setSelectedGateway] = useState("khalti");
  const [isPaying, setIsPaying] = useState(false);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const movie = booking?.movie || {};
  const showtime = booking?.showtime || {};
  const seats = booking?.seats || [];
  const foods = booking?.foods || [];

  const ticketSubtotal = useMemo(() => {
    return Number(booking?.ticketTotal || 0);
  }, [booking]);

  const foodSubtotal = useMemo(() => {
    return foods.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [foods]);

  const total = useMemo(() => {
    return Number(booking?.totalPrice || ticketSubtotal + foodSubtotal);
  }, [booking, ticketSubtotal, foodSubtotal]);

  const handlePayment = async () => {
    try {
      setIsPaying(true);

      const res = await axios.post(
        `${API_URL}/api/payments/initiate`,
        {
          bookingId,
          gateway: selectedGateway,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (selectedGateway === "khalti" || selectedGateway === "stripe") {
        window.location.href = res.data.payment_url;
        return;
      }

      if (selectedGateway === "esewa") {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = res.data.url;

        Object.entries(res.data.formData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      console.error("Payment initiation failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Payment initiation failed");
      setIsPaying(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Review your booking and complete payment securely.</p>
      </div>

      <div className="checkout-alert">
        Your seats are reserved temporarily. Complete payment before the
        reservation expires.
      </div>

      <div className="checkout-layout">
        <div className="checkout-left">
          <div className="checkout-card booking-card">
            <div className="booking-top">
              <img
                className="movie-poster"
                src={
                  movie?.posterUrl
                    ? `${API_URL}${movie.posterUrl}`
                    : "https://via.placeholder.com/120x180?text=Poster"
                }
                alt={movie?.title || "Movie Poster"}
              />

              <div className="booking-info">
                <h2>{movie?.title || "Movie Title"}</h2>
                <p>
                  <strong>Date:</strong>{" "}
                  {showtime?.startTime
                    ? new Date(showtime.startTime).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {showtime?.startTime
                    ? new Date(showtime.startTime).toLocaleTimeString()
                    : "-"}
                </p>
                <p>
                  <strong>Screen:</strong>{" "}
                  {showtime?.screenName || showtime?.screen || "-"}
                </p>
                <p>
                  <strong>Seats:</strong>{" "}
                  {seats.length ? seats.map((s) => s.label || s).join(", ") : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <h3>Food & Extras</h3>
            {foods.length > 0 ? (
              <div className="food-list">
                {foods.map((item, index) => (
                  <div className="food-row" key={index}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      NPR {Number(item.price || 0) * Number(item.quantity || 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">No food items added.</p>
            )}
          </div>

          <div className="checkout-card">
            <h3>Select Payment Method</h3>
            <div className="payment-methods">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={`payment-method-card ${
                    selectedGateway === method.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedGateway(method.id)}
                >
                  <div>
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                  </div>
                  <div className="radio-indicator">
                    {selectedGateway === method.id ? "●" : "○"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="checkout-right">
          <div className="checkout-card sticky-card">
            <h3>Price Summary</h3>

            <div className="summary-row">
              <span>Tickets</span>
              <span>NPR {ticketSubtotal}</span>
            </div>

            <div className="summary-row">
              <span>Food & Extras</span>
              <span>NPR {foodSubtotal}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total-row">
              <span>Total</span>
              <span>NPR {total}</span>
            </div>

            <button
              type="button"
              className="pay-btn"
              onClick={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? "Processing..." : `Pay NPR ${total}`}
            </button>

            <p className="secure-note">
              Secure checkout. Your payment is processed through trusted payment
              providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;