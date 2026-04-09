import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
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

const Checkout = () => {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState("khalti");
  const [isPaying, setIsPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const [loyalty, setLoyalty] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API_URL}/api/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Fetched booking:", res.data);
        setBooking(res.data);
      } catch (err) {
        console.error("Error loading booking:", err.response?.data || err.message);
        toast.error(err.response?.data?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [API_URL, bookingId, token]);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/loyalty`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setLoyalty(res.data);
      } catch (err) {
        console.error("Failed to fetch loyalty:", err.response?.data || err.message);
      }
    };

    if (token) {
      fetchLoyalty();
    }
  }, [API_URL, token]);

  const movie = booking?.movie || {};
  const showtime = booking?.showtime || {};
  const seats = booking?.seats || [];
  const foods = booking?.foods || [];

  const ticketSubtotal = useMemo(() => {
    if (!booking) return 0;

    if (booking.ticketTotal != null) return Number(booking.ticketTotal);
    if (booking.seatTotal != null) return Number(booking.seatTotal);

    if (booking.seats?.length) return booking.seats.length * 300;

    return 0;
  }, [booking]);

  const foodSubtotal = useMemo(() => {
    return foods.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [foods]);

  const total = useMemo(() => {
    if (!booking) return 0;
    if (booking.totalPrice != null) return Number(booking.totalPrice);
    return ticketSubtotal + foodSubtotal;
  }, [booking, ticketSubtotal, foodSubtotal]);

  const availablePoints = loyalty?.points || 0;
  const maxRedeemableByPoints = Math.floor(availablePoints / 50) * 50;
  const maxRedeemableByPrice = Math.floor((total * 0.5) / 50) * 50;
  const maxRedeemablePoints = Math.min(maxRedeemableByPoints, maxRedeemableByPrice);

  const redeemOptions = useMemo(() => {
    const options = [0];
    for (let value = 50; value <= maxRedeemablePoints; value += 50) {
      options.push(value);
    }
    return options;
  }, [maxRedeemablePoints]);

  useEffect(() => {
    if (pointsToRedeem > maxRedeemablePoints) {
      setPointsToRedeem(0);
    }
  }, [pointsToRedeem, maxRedeemablePoints]);

  const finalTotal = useMemo(() => {
    return Math.max(0, total - pointsToRedeem);
  }, [total, pointsToRedeem]);

  const pointsUserWillEarn = useMemo(() => {
    let points = 10;
    if (foods.length > 0) {
      points += 5;
    }
    return points;
  }, [foods]);

  const handlePayment = async () => {
    try {
      setIsPaying(true);

      const res = await axios.post(
        `${API_URL}/api/payments/initiate`,
        {
          bookingId,
          gateway: selectedGateway,
          pointsToRedeem,
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
        return;
      }

      toast.error("Unsupported payment method");
      setIsPaying(false);
    } catch (err) {
      console.error("Payment initiation failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Payment initiation failed");
      setIsPaying(false);
    }
  };

  if (loading) {
    return <div className="checkout-page">Loading checkout...</div>;
  }

  if (!booking) {
    return <div className="checkout-page">Booking not found.</div>;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Review your booking and complete payment securely.</p>
      </div>

      <div className="checkout-alert">
        Your seats are reserved temporarily. Complete payment before the reservation expires.
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
                    : "/poster-fallback.png"
                }
                alt={movie?.title || "Movie Poster"}
                onError={(e) => {
                  e.currentTarget.src = "/poster-fallback.png";
                }}
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
                  {showtime?.screenName || showtime?.screen?.name || "-"}
                </p>

                <p>
                  <strong>Seats:</strong>{" "}
                  {seats.length
                    ? seats.map((s) => s.label || s.seatNumber || s).join(", ")
                    : "-"}
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

            <div className="loyalty-section">
              <h4>🎁 Loyalty Points</h4>
              <p>You have: {availablePoints} points</p>

              <select
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                className="loyalty-select"
              >
                <option value={0}>Do not use points</option>
                {redeemOptions
                  .filter((value) => value !== 0)
                  .map((value) => (
                    <option key={value} value={value}>
                      Use {value} points (Rs. {value})
                    </option>
                  ))}
              </select>

              <p className="muted-text">
                50 points = Rs. 50 discount
              </p>

              <p className="muted-text">
                You will earn {pointsUserWillEarn} points from this booking
              </p>
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <span>Subtotal</span>
              <span>NPR {total}</span>
            </div>

            <div className="summary-row">
              <span>Discount</span>
              <span>- NPR {pointsToRedeem}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total-row">
              <span>Total</span>
              <span>NPR {finalTotal}</span>
            </div>

            <button
              type="button"
              className="pay-btn"
              onClick={handlePayment}
              disabled={isPaying || finalTotal <= 0}
            >
              {isPaying ? "Processing..." : `Pay NPR ${finalTotal}`}
            </button>

            <p className="secure-note">
              Secure checkout. Your payment is processed through trusted payment providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;