import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Foods.css";

const API_URL = "http://localhost:5001";

const Foods = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [seatPrice, setSeatPrice] = useState(0);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        if (!bookingId) throw new Error("Booking ID missing");

        const res = await axios.get(`${API_URL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setBooking(res.data);
      } catch (err) {
        console.error(
          "Failed to load booking:",
          err.response?.data || err.message
        );
        alert("Booking not found or expired");
        navigate("/myaccount");
      }
    };

    const fetchFoods = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/foods`);
        setFoods(res.data);
      } catch (err) {
        console.error("Failed to load foods:", err.response?.data || err.message);
      }
    };

    fetchBooking();
    fetchFoods();
  }, [bookingId, navigate]);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!booking?.showtime) return;

      try {
        const res = await axios.get(`${API_URL}/api/pricing`);
        const pricing = res.data;

        const showtimeValue =
          booking.showtime?.startTime || booking.showtime?.time || booking.showtime;
        const day = new Date(showtimeValue).getDay();

        let price = pricing.normalPrice;

        if (
          pricing.midWeekDiscountEnabled &&
          pricing.midWeekDays.includes(day)
        ) {
          price =
            pricing.normalPrice * (1 - pricing.discountPercentage / 100);
        }

        setSeatPrice(Math.round(price));
      } catch (err) {
        console.error("Pricing fetch failed:", err.response?.data || err.message);
        setSeatPrice(300);
      }
    };

    fetchPricing();
  }, [booking]);

  const handleToggleItem = (food) => {
    const existing = cart.find((item) => item._id === food._id);

    if (existing) {
      setCart(cart.filter((item) => item._id !== food._id));
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  const handleIncrease = (food) => {
    setCart(
      cart.map((item) =>
        item._id === food._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecrease = (food) => {
    setCart(
      cart.map((item) =>
        item._id === food._id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const ticketPricePerSeat = seatPrice;
  const ticketTotal = booking ? booking.seats.length * ticketPricePerSeat : 0;
  const foodTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = ticketTotal + foodTotal;

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (cart.length > 0) {
        await axios.post(
          `${API_URL}/api/bookings/add-foods/${bookingId}`,
          {
            foods: cart.map((item) => ({
              foodId: item._id,
              quantity: item.quantity,
            })),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      navigate(`/checkout/${bookingId}`);
    } catch (err) {
      console.error("Checkout failed:", err.response?.data || err.message);
      alert("Failed to add food items. Try again!");
    }
  };

  if (!booking) return <div>Loading booking...</div>;

  const showtimeText = new Date(
    booking.showtime?.startTime || booking.showtime?.time
  ).toLocaleString();

  return (
    <div className="foods-container">
      <div className="foods-left">
        <div className="foods-header">
          <h1>Choose Your Food & Drinks</h1>
          <button className="skip-btn" onClick={handleCheckout}>
            Skip to Checkout
          </button>
        </div>

        <div className="booking-summary">
          <p><strong>Movie:</strong> {booking.movie?.title}</p>
          <p><strong>Seats:</strong> {booking.seats.map(seat => seat.label).join(", ")}</p>
          <p><strong>Showtime:</strong> {showtimeText}</p>
        </div>

        <div className="foods-grid">
          {foods.map((item) => {
            const inCart = cart.find((c) => c._id === item._id);

            return (
              <div
                key={item._id}
                className={`food-item ${inCart ? "selected" : ""}`}
              >
                {item.image && (
                  <img
                    src={`${API_URL}${item.image}`}
                    alt={item.name}
                    className="food-img"
                  />
                )}

                <h3>{item.name}</h3>
                <p>Rs. {item.price}</p>

                {!inCart ? (
                  <button
                    className="add-btn"
                    onClick={() => handleToggleItem(item)}
                  >
                    Add
                  </button>
                ) : (
                  <div className="quantity-controls">
                    <button onClick={() => handleDecrease(item)}>-</button>
                    <span>{inCart.quantity}</span>
                    <button onClick={() => handleIncrease(item)}>+</button>
                    <button onClick={() => handleToggleItem(item)}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="foods-right">
        <div className="bill-header">
          <h2>Your Bill</h2>
        </div>

        <div className="bill-items">
          <div className="bill-item">
            <span className="bill-item-name">
              Tickets (
              {booking.seats.map(seat => seat.label).join(", ")}
              ) @ Rs. {ticketPricePerSeat} each
            </span>
            <span className="bill-item-price">Rs. {ticketTotal}</span>
          </div>

          {cart.map((item) => (
            <div className="bill-item" key={item._id}>
              <span className="bill-item-name">
                {item.name} x {item.quantity}
              </span>
              <span className="bill-item-price">
                Rs. {item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="bill-total">
          <span>Total</span>
          <span>Rs. {total}</span>
        </div>

        <button className="checkout-btn" onClick={handleCheckout}>
          Confirm & Pay
        </button>
      </div>
    </div>
  );
};

export default Foods;