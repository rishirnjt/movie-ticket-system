import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./SeatSelection.css";

const rows = 13;
const cols = 10;

const SeatSelection = () => {
  const { movieId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedShowtime] = useState(location.state?.selectedShowtime || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [movie, setMovie] = useState(null);

  const [bookingId, setBookingId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);

  const [bookSuccessPopup, setBookSuccessPopup] = useState({
    open: false,
    message: "",
  });
  const [buyPopup, setBuyPopup] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  /* ---------------- FETCH MOVIE + BOOKED SEATS ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieRes = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
        setMovie(movieRes.data);

        if (selectedShowtime && selectedShowtime._id) {
          const seatsRes = await axios.get(
            `http://localhost:5001/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
          );
          setBookedSeats(seatsRes.data || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, [movieId, selectedShowtime]);

  /* ---------------- TIMER EFFECT ---------------- */
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const seconds = Math.floor((expiresAt - Date.now()) / 1000);
      if (seconds <= 0) {
        setTimeLeft(0);
        handleBookingExpiry();
      } else {
        setTimeLeft(seconds);
      }
    };

    tick(); // immediate render
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  /* ---------------- SEAT CLICK ---------------- */
  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );

    // start timer immediately when first seat is selected
    if (!timerStarted) {
      const newExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min
      setExpiresAt(newExpiresAt);
      setTimeLeft(5 * 60); // 5 min in seconds
      setTimerStarted(true);
    }
  };

  //Handle booking
  const handleBook = async () => {
    console.log("MOVIE ID:", movieId);
    console.log("SHOWTIME:", selectedShowtime);
    console.log("SEATS:", selectedSeats);

    if (!movieId) return alert("Movie not found");
    if (!selectedShowtime || !selectedShowtime._id) return alert("Showtime not selected");
    if (selectedSeats.length === 0) return alert("Please select at least one seat");

    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in to book");

    try {
      const totalPrice = selectedSeats.length * 300; // seat price

      const res = await axios.post(
        "http://localhost:5001/api/bookings/hold",
        {
          movieId,
          showtimeId: selectedShowtime._id,
          seats: selectedSeats,
          totalPrice,
          foods: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = res.data;
      if (!booking || !booking._id) {
        return alert("Booking failed");
      }

      setBookingId(booking._id);
      setExpiresAt(new Date(booking.expiresAt).getTime());
      setTimeLeft(Math.floor((new Date(booking.expiresAt) - Date.now()) / 1000));

      setBookSuccessPopup({
        open: true,
        message: "Seats reserved successfully. Complete payment before timer ends.",
      });

      // Refresh booked seats
      const seatsRes = await axios.get(
        `http://localhost:5001/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
      );
      setBookedSeats(seatsRes.data || []);

    } catch (err) {
      alert(err.response?.data?.message || "Booking failed");
    }
  };

  //booking expiry
  const handleBookingExpiry = async () => {
    if (!bookingId) return;

    try {
      await axios.delete(`http://localhost:5001/api/bookings/expire/${bookingId}`);

      alert("Booking expired. Seats released.");

      setBookingId(null);
      setExpiresAt(null);
      setTimeLeft(null);
      setSelectedSeats([]);
      setTimerStarted(false);

      // Refresh booked seats
      if (selectedShowtime && selectedShowtime._id) {
        const seatsRes = await axios.get(
          `http://localhost:5001/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
        );
        setBookedSeats(seatsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- BUY ---------------- */
  const handleBuyClick = () => {
    if (selectedSeats.length === 0) return alert("Please select seats first");
    if (!bookingId) return alert("Please book seats first");
    setBuyPopup(true);
  };

  const handleConfirmBuy = () => {
    if (!agreeTerms) return alert("You must agree to terms");
    navigate(`/foods/${bookingId}`);
  };

  //render seats
  const renderSeats = () => {
    const seats = [];
    for (let r = 0; r < rows; r++) {
      const row = String.fromCharCode(65 + r);
      for (let c = 1; c <= cols; c++) {
        const seatId = `${row}${c}`;
        seats.push(
          <div
            key={seatId}
            className={`seat ${bookedSeats.includes(seatId)
                ? "booked"
                : selectedSeats.includes(seatId)
                  ? "selected"
                  : "available"
              }`}
            onClick={() => handleSeatClick(seatId)}
          >
            {seatId}
          </div>
        );
      }
    }
    return seats;
  };

  return (
    <div className="seat-selection">
      <h2>Select Your Seats</h2>
      {movie && <h3>{movie.title}</h3>}

      {/* SHOWTIME */}
      {selectedShowtime && (
        <p className="showtime">
          <strong>
            {selectedShowtime.hall} –{" "}
            {new Date(selectedShowtime.time).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            {new Date(selectedShowtime.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
        </p>
      )}

      {/* TIMER */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className="timer-box">
          ⏳ Time Remaining:
          <strong>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </strong>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="timer-expired">
          ❌ Time expired. Seats released.
        </div>
      )}

      <div className="screen">SCREEN</div>
      <div className="seats-grid">{renderSeats()}</div>

      {/* LEGEND */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-box legend-available" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-selected" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-booked" />
          <span>Booked</span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="actions">
        <button className="book-btn" onClick={handleBook}>Book</button>
        <button className="buy-btn" onClick={handleBuyClick}>Buy</button>
        <button className="reset-btn" onClick={() => setSelectedSeats([])}>Reset</button>
      </div>

      {/* BUY POPUP */}
      {buyPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => setBuyPopup(false)}>✕</button>
            <h2>Confirm Purchase</h2>
            <p>Seats: {selectedSeats.join(", ")}</p>
            <p>Total: NPR {selectedSeats.length * 300}</p>
            <div className="terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label>I agree to the terms and conditions</label>
            </div>
            <button className="confirm-btn" onClick={handleConfirmBuy}>Confirm</button>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {bookSuccessPopup.open && (
        <div className="success-overlay">
          <div className="success-box">
            <button
              className="success-close"
              onClick={() => setBookSuccessPopup({ open: false, message: "" })}
            >
              ✕
            </button>
            <h2>SUCCESS</h2>
            <p>{bookSuccessPopup.message}</p>
            <button
              className="success-ok-btn"
              onClick={() => {
                setBookSuccessPopup({ open: false, message: "" })
                navigate("/myaccount");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
