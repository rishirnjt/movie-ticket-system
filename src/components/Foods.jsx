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

  const menu = [
    { id: 1, name: "Popcorn (Large)", price: 250 },
    { id: 2, name: "Coke", price: 150 },
    { id: 3, name: "Nachos", price: 300 },
    { id: 4, name: "French Fries", price: 200 },
    { id: 5, name: "Water Bottle", price: 100 },
  ];

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5001/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooking(res.data);
      } catch (err) {
        console.error("Failed to load booking", err);
      }
    };

    fetchBooking();
    setFoods(menu);
  }, [bookingId]);

  // Add or remove food item
  const handleToggleItem = (food) => {
    const existing = cart.find((item) => item.id === food.id);
    if (existing) {
      setCart(cart.filter((item) => item.id !== food.id));
    } else {
      setCart([...cart, food]);
    }
  };

  // Total calculation
  const total = cart.reduce((sum, item) => sum + item.price, 0);

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
      {/*food selection */}
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
          {foods.map((item) => (
            <div
              key={item.id}
              className={`food-item ${cart.some((c) => c.id === item.id) ? "selected" : ""}`}
              onClick={() => handleToggleItem(item)}
            >
              <h3>{item.name}</h3>
              <p>Rs. {item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/*bill summary */}
      <div className="foods-right">
        <div className="bill-header">
          <h2>Your Bill</h2>
        </div>

        <div className="bill-items">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div className="bill-item" key={item.id}>
                <span className="bill-item-name">{item.name}</span>
                <span className="bill-item-price">Rs. {item.price}</span>
              </div>
            ))
          ) : (
            <p style={{ opacity: 0.7 }}>No items selected yet.</p>
          )}
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
