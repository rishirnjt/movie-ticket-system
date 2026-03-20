import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./SeatSelection.css";

const SeatSelection = () => {
  const { movieId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedShowtime] = useState(location.state?.selectedShowtime || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [soldSeats, setSoldSeats] = useState([]);
  const [heldSeats, setHeldSeats] = useState([]);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);

   const groupedSeats = useMemo(() => {
    const grouped = {};

    seats.forEach((seat) => {
      if(!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });

    Object.keys(grouped).forEach((row) =>{
      grouped[row].sort((a, b) => a.number -b.number);
    });

    return grouped;
  }, [seats]);


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

  const fetchScreenSeats = async () => {
    const screenId = 
      selectedShowtime?.screenId._id || selectedShowtime?.screenId;

    if(!screenId) return;

    try{
      const res = await axios.get(
          `http://localhost:5001/api/screens/${screenId}/seats`
      );
      setSeats(res.data || []);
    } catch (err) {
      console.error("Failed to fetch screen seats:", err);
    }
  };

  //Fetch movie and book seats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieRes = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
        setMovie(movieRes.data);

        if (selectedShowtime && selectedShowtime._id) {
          const seatsRes = await axios.get(
            `http://localhost:5001/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
          );
          setSoldSeats(seatsRes.data.soldSeats || []);
          setHeldSeats(seatsRes.data.heldSeats || []);
        }

        await fetchScreenSeats();
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

  //Seat click
  const handleSeatClick = useCallback((seatId) => {
    if (heldSeats.includes(seatId) || soldSeats.includes(seatId)) return;

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );

    // start timer immediately when first seat is selected
    if (!timerStarted) {
      const newExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min
      setExpiresAt(newExpiresAt);
      setTimeLeft(5 * 60);
      setTimerStarted(true);
    }
  }, [heldSeats, soldSeats, timerStarted]);

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
      setSoldSeats(seatsRes.data.soldSeats || []);
      setHeldSeats(seatsRes.data.heldSeats || []);
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
        setSoldSeats(seatsRes.data.soldSeats || []);
        setHeldSeats(seatsRes.data.heldSeats || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  //Buy Ticket//
  const handleBuyClick = async () => {
    if (selectedSeats.length === 0) return alert("Please select seats first");

    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in to buy");

    try {
      const res = await axios.post(
        "http://localhost:5001/api/bookings/buy",
        {
          movieId,
          showtimeId: selectedShowtime._id,
          seats: selectedSeats,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = res.data;
      if (!booking || !booking._id) {
        return alert("Buy failed");
      }

      setBookingId(booking._id); // store bookingId for food page
      setBuyPopup(true);

    } catch (err) {
      console.error("Direct buy error:", err);
      alert(err.response?.data?.message || "Buy failed");
    }
  };

  const fetchSeats = async () => {
    if (!selectedShowtime?._id) return;

    try {
      const res = await axios.get(
        `http://localhost:5001/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
      );

      setSoldSeats(res.data.soldSeats || []);
      setHeldSeats(res.data.heldSeats || []);
    } catch (error) {
      console.error("Seat fetch error:", error);
    }
  };



  const handleConfirmBuy = () => {
    if (!agreeTerms) return alert("You must agree to terms");
    if (!bookingId) return alert("Booking not found");

    navigate(`/foods/${bookingId}`);
  };

  const seatElements = useMemo(() => {
    return Object.keys(groupedSeats)
      .sort()
      .map((row) => (
        <div key={row} className="seat-row">
          <div className="row-label">{row}</div>

          <div className="row-seats">
            {groupedSeats[row].map((seat) => {
              const seatId = seat._id;

              const seatClass = soldSeats.includes(seatId)
                ? "sold"
                : heldSeats.includes(seatId)
                ? "held"
                : selectedSeats.includes(seatId)
                ? "selected"
                : "available";

                return(
                  <div 
                    key={seat._id}
                    className={`seat ${seatClass}`}
                    onClick={() => handleSeatClick(seatId)}
                  >
                    {seat.number}
                    </div>
                );
            })}
          </div>
        </div>
      ));
  }, [groupedSeats, soldSeats, heldSeats, selectedSeats, handleSeatClick]);
  return (
    <div className="seat-selection">
      <h2>Select Your Seats</h2>
      {movie && <h3>{movie.title}</h3>}

      {/* SHOWTIME */}
      {selectedShowtime && (
        <p className="showtime">
          <strong>
            {selectedShowtime.screenId?.name || selectedShowtime.screenName || "Screen"} –{" "}
            {new Date(selectedShowtime.startTime).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            {new Date(selectedShowtime.startTime).toLocaleTimeString([], {
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
      <div className="seats-grid">{seatElements}</div>

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
        <div className="legend-item">
          <div className="legend-box legend-bought" />
          <span>Sold</span>
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
