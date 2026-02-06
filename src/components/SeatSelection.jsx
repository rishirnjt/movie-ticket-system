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

  const [selectedShowtime, setSelectedShowtime] = useState(location.state?.selectedShowtime || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [movie, setMovie] = useState(null);

  const [bookSuccessPopup, setBookSuccessPopup] = useState({
    open: false,
    message: ""
  });
  const [buyPopup, setBuyPopup] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Fetch movie and booked seats
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
        setMovie(res.data);

        if (selectedShowtime) {
          const bookingRes = await axios.get(
            `http://localhost:5001/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`
          );
          setBookedSeats(bookingRes.data.bookedSeats || []);
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
      }
    };

    fetchMovie();
  }, [movieId, selectedShowtime]);

  // Toggle seat
  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  //book
  const handleBook = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const totalPrice = selectedSeats.length * 300;

      const res = await axios.post(
        "http://localhost:5001/api/bookings/reserve",
        {
          movieId,
          showtime: selectedShowtime._id,
          seats: selectedSeats,
          totalPrice,
          foods: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const booking = res.data.booking;

      const expiry = new Date(booking.expiresAt).toLocaleString();

      setBookSuccessPopup({
        open: true,
        message: `Ticket booked successfully. The booking expires on ${expiry}. Please buy your tickets before it expires`,
      });
    } catch (err) {
      alert("Something went wrong.");
      console.log(err);
    }
  };

  // Open popup first instead of going directly
  const handleBuyClick = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    setBuyPopup(true);
  };

  // Confirm inside popup
  const handleConfirmBuy = async () => {
    if (!agreeTerms) {
      alert("You must agree to the terms and conditions.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const totalPrice = selectedSeats.length * 300;

      const res = await axios.post(
        "http://localhost:5001/api/bookings/reserve",
        {
          movieId,
          showtime: selectedShowtime._id,
          seats: selectedSeats,
          totalPrice,
          foods: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bookingId = res.data.booking._id;

      setBuyPopup(false);
      navigate(`/foods/${bookingId}`);

    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong.");
      console.error(error);
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
            id={`seat-${seatId}`}
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
          Showtime: <strong>
            {selectedShowtime.hall} -{" "}
            {new Date(selectedShowtime.time).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}{" "}
            {new Date(selectedShowtime.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </strong>
        </p>

      )}

      <div className="screen">SCREEN</div>
      <div className="seats-grid">{renderSeats()}</div>

      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-box legend-available"></div>
          <span>Available</span>
        </div>

        <div className="legend-item">
          <div className="legend-box legend-selected"></div>
          <span>Selected</span>
        </div>

        <div className="legend-item">
          <div className="legend-box legend-booked"></div>
          <span>Booked</span>
        </div>

        <div className="legend-item">
          <div className="legend-box legend-bought"></div>
          <span>Bought</span>
        </div>
      </div>


      <div className="actions">
        <button id="btn-book" className="book-btn" onClick={handleBook}>Book</button>
        <button id="btn-buy" className="buy-btn" onClick={handleBuyClick}>Buy</button>
        <button id="btn-reset" className="reset-btn" onClick={() => setSelectedSeats([])}>Reset</button>
      </div>

      {/* BOOK SUCCESS POPUP */}
      {bookSuccessPopup.open && (
        <div className="success-overlay">
          <div className="success-box">

            <button
              className="success-close"
              onClick={() => setBookSuccessPopup({ open: false, message: "" })}
            >
              ✕
            </button>

            <h2 className="success-title">SUCCESS</h2>

            <p className="success-message">{bookSuccessPopup.message}</p>

            <button
              id="btn-success-ok"
              className="success-ok-btn"
              onClick={() => {
                setBookSuccessPopup(false);
                navigate("/myaccount");
              }}
            >
              OK
            </button>

          </div>
        </div>
      )}

      {/* BUY POPUP */}
      {buyPopup && (
        <div className="popup-overlay">
          <div className="popup-box">

            <button className="popup-close" onClick={() => setBuyPopup(false)}>✕</button>

            <h2>Specify Seat Type</h2>

            <div className="ticket-count">
              <h3>Tickets Selected {selectedSeats.length}/{selectedSeats.length}</h3>
            </div>

            <table className="popup-table">
              <thead>
                <tr>
                  <th>Seat Type</th>
                  <th>No. of Seats</th>
                  <th>Price</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>PLATINUM</td>
                  <td>{selectedSeats.length}</td>
                  <td>NPR {selectedSeats.length * 300}.00</td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <td>TOTAL</td>
                  <td></td>
                  <td><strong>NPR {selectedSeats.length * 300}.00</strong></td>
                </tr>
              </tfoot>
            </table>

            <p className="popup-note">
              PLEASE NOTE: Transactions are confirmed only if you receive a QR code with ticket details.
            </p>

            <div className="terms">
              <input
                id="checkbox-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label>I agree to the terms and conditions</label>
            </div>

            <button id="btn-buy-confirm" className="confirm-btn" onClick={handleConfirmBuy}>
              Confirm
            </button>

          </div>
        </div>
      )}


    </div>
  );
};

export default SeatSelection;