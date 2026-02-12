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

  // Fetch booking and available foods
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        if (!bookingId) throw new Error("Booking ID missing");

        const res = await axios.get(
          `http://localhost:5001/api/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setBooking(res.data);
      } catch (err) {
        console.error("Failed to load booking:", err.response?.data || err.message);
        alert("Booking not found or expired");
        navigate("/myaccount"), { state: { tab: tickets }};
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
  }, [bookingId, navigate]);

  // Toggle item in cart
  const handleToggleItem = (food) => {
    const existing = cart.find((item) => item._id === food._id);
    if (existing) {
      setCart(cart.filter((item) => item._id !== food._id));
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  const handleIncrease = (food) => {
    setCart(cart.map((item) =>
      item._id === food._id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const handleDecrease = (food) => {
    setCart(cart.map((item) =>
      item._id === food._id
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    ));
  };

  // Ticket price calculation with mid-week discount
  const getTicketPricePerSeat = () => {
    if (!booking) return 300;
    const showtimeDate = new Date(booking.showtime?.time);
    const day = showtimeDate.getDay(); // 0 = Sunday
    let price = 300;
    if (day >= 2 && day <= 4) price = price / 2; // Tue-Thu half price
    return price;
  };

  const ticketPricePerSeat = getTicketPricePerSeat();
  const ticketTotal = booking ? booking.seats.length * ticketPricePerSeat : 0;
  const foodTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = ticketTotal + foodTotal;

  // Checkout / add foods
  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (cart.length > 0) {
        await axios.post(
          `http://localhost:5001/api/bookings/add-foods/${bookingId}`,
          { foods: cart },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      navigate(`/checkout/${bookingId}`);
    } catch (err) {
      console.error("Checkout failed:", err.response?.data || err);
      alert("Failed to add food items. Try again!");
    }
  };

  if (!booking) return <div>Loading booking...</div>;

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
          <p><strong>Seats:</strong> {booking.seats.join(", ")}</p>
          <p><strong>Showtime:</strong> {new Date(booking.showtime?.time).toLocaleString()}</p>
        </div>

        <div className="foods-grid">
          {foods.map((item) => {
            const inCart = cart.find(c => c._id === item._id);
            return (
              <div key={item._id} className={`food-item ${inCart ? "selected" : ""}`}>
                {item.image && <img src={`http://localhost:5001${item.image}`} alt={item.name} className="food-img" />}
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

      <div className="foods-right">
        <div className="bill-header"><h2>Your Bill</h2></div>
        <div className="bill-items">
          <div className="bill-item">
            <span className="bill-item-name">
              Tickets ({booking.seats.join(", ")}) @ Rs. {ticketPricePerSeat} each
            </span>
            <span className="bill-item-price">Rs. {ticketTotal}</span>
          </div>

          {cart.length > 0 && cart.map((item) => (
            <div className="bill-item" key={item._id}>
              <span className="bill-item-name">{item.name} x {item.quantity}</span>
              <span className="bill-item-price">Rs. {item.price * item.quantity}</span>
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
