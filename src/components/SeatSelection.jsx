import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import "./SeatSelection.css";

const rows = 13;
const cols = 10;

const SeatSelection = () => {
  const { movieId } = useParams();
  const location = useLocation();

  const [selectedShowtime, setSelectedShowtime] = useState(location.state?.selectedShowtime || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/movies/${movieId}`);
        setMovie(res.data);

        if (selectedShowtime) {
          const bookingRes = await axios.get(
            `http://localhost:5000/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
          );
          setBookedSeats(bookingRes.data.bookedSeats || []);
        }
      } catch (err) {
        console.error("Error fetching movie or bookings:", err);
      }
    };
    fetchMovie();
  }, [movieId, selectedShowtime]);

  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    setSelectedSeats(selectedSeats.includes(seatId)
      ? selectedSeats.filter((s) => s !== seatId)
      : [...selectedSeats, seatId]
    );
  };

  const handleBooking = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      alert("Please select a showtime and at least one seat");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const totalPrice = selectedSeats.length * 300;

      const payload = {
        movieId,
        showtime: selectedShowtime._id,
        seats: selectedSeats,
        totalPrice,
      };

      console.log("Booking payload:", payload);

      await axios.post(
        "http://localhost:5000/api/bookings/reserve",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Booking Successful!");
      setSelectedSeats([]);
      //refresh booked seats
      const bookingRes = await axios.get(
        `http://localhost:5000/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
      );
      setBookedSeats(bookingRes.data.bookedSeats || []);
    } catch (err) {
      console.error("Booking error:", err.response?.data || err.message);
      alert("Booking failed");
    }
  };

  const renderSeats = () => {
    const seats = [];
    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let c = 1; c <= cols; c++) {
        const seatId = `${rowLabel}${c}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        seats.push(
          <div
            key={seatId}
            className={`seat ${isBooked ? "booked" : isSelected ? "selected" : "available"}`}
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

    {selectedShowtime && (
      <p>
        Showtime: <strong>{selectedShowtime.hall} - {selectedShowtime.time}</strong>
      </p>
    )}

    <div className="screen">SCREEN</div>

    <div className="seats-grid">{renderSeats()}</div>

    <div className="legend">
      <div><div className="seat booked"></div> Booked</div>
      <div><div className="seat soldout"></div> Sold Out</div>
      <div><div className="seat selected"></div> Selected</div>
      <div><div className="seat available"></div> Available</div>
    </div>

    <div className="actions">
      <button
        className="book-btn"
        onClick={() => handleBooking("reserved")}
        disabled={selectedSeats.length === 0}
      >
        Book
      </button>

      <button
        className="buy-btn"
        onClick={() => handleBooking("confirmed")}
        disabled={selectedSeats.length === 0}
      >
        Buy
      </button>

      <button
        className="reset-btn"
        onClick={() => setSelectedSeats([])}
      >
        Reset
      </button>
    </div>

    {selectedSeats.length > 0 && (
      <div className="summary">
        <p>Selected Seats: {selectedSeats.join(", ")}</p>
      </div>
    )}
  </div>
);
};
export default SeatSelection;