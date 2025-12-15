import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Foods.css";

const Foods = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch booking and foods
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No error");
          navigate("/login");
          return;
        }
        const res = await axios.get(`http://localhost:5001/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },

        });
        setBooking(res.data);
      } catch (err) {
        console.error("Failed to load booking", err);
      }
    };

    const fetchFoods = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/foods");
        setFoods(res.data);
      } catch (err) {
        console.error("Failed to load foods", err);
      }
    };

    fetchBooking();
    fetchFoods();
  }, [bookingId]);

  // Toggle item in cart
  const handleToggleItem = (food) => {
    const existing = cart.find((item) => item._id === food._id);
    if (existing) {
      setCart(cart.filter((item) => item._id !== food._id));
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  // Increase quantity
  const handleIncrease = (food) => {
    setCart(cart.map((item) =>
      item._id === food._id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Decrease quantity
  const handleDecrease = (food) => {
    setCart(cart.map((item) =>
      item._id === food._id
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    ));
  };

  // Total calculation
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  // Checkout
  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/bookings/add-foods/${bookingId}`,
        { items: cart },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Food added successfully!");
      navigate(`/checkout/${bookingId}`);
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to add food items. Try again!");
    }
  };

  return (
    <div className="foods-container">
      {/* Food selection */}
      <div className="foods-left">
        <div className="foods-header">
          <h1>Choose Your Food & Drinks</h1>
          <button className="skip-btn" onClick={() => navigate(`/checkout/${bookingId}`)}>
            Skip to Checkout
          </button>
        </div>

        {booking && (
          <div className="booking-summary">
            <p><strong>Movie:</strong> {booking.movie?.title}</p>
            <p><strong>Seats:</strong> {booking.seats.join(", ")}</p>
            <p><strong>Showtime:</strong> {new Date(booking.showtime?.time).toLocaleString()}</p>
          </div>
        )}

        <div className="foods-grid">
          {foods.map((item) => {
            const inCart = cart.find(c => c._id === item._id);
            return (
              <div
                key={item._id}
                className={`food-item ${inCart ? "selected" : ""}`}
              >
                {item.image && (
                  <img src={`http://localhost:5001${item.image}`} alt={item.name} className="food-img" />
                )}
                <h3>{item.name}</h3>
                <p>Rs. {item.price}</p>

                {!inCart ? (
                  <button className="add-btn" onClick={() => handleToggleItem(item)}>Add</button>
                ) : (
                  <div className="quantity-controls">
                    <button onClick={() => handleDecrease(item)}>-</button>
                    <span>{inCart.quantity}</span>
                    <button onClick={() => handleIncrease(item)}>+</button>
                    <button onClick={() => handleToggleItem(item)}>Remove</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill summary */}
      <div className="foods-right">
        <div className="bill-header"><h2>Your Bill</h2></div>

        <div className="bill-items">
          {cart.length > 0 ? cart.map((item) => (
            <div className="bill-item" key={item._id}>
              <span className="bill-item-name">{item.name} x {item.quantity}</span>
              <span className="bill-item-price">Rs. {item.price * item.quantity}</span>
            </div>
          )) : <p style={{ opacity: 0.7 }}>No items selected yet.</p>}
        </div>

        <div className="bill-total">
          <span>Total</span>
          <span>Rs. {total}</span>
        </div>

        <button className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
          Confirm & Pay
        </button>
      </div>
    </div>
  );
};

export default Foods;
