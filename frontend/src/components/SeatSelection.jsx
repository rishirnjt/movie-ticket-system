import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./SeatSelection.css";

const SeatSelection = () => {
  const { movieId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedShowtime = location.state?.selectedShowtime || null; const [selectedSeats, setSelectedSeats] = useState([]);
  const [soldSeats, setSoldSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);
  const [purchaseSeats, setPurchaseSeats] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [buying, setBuying] = useState(false);

  const [bookingId, setBookingId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const [bookSuccessPopup, setBookSuccessPopup] = useState({
    open: false,
    message: "",
  });
  const [buyPopup, setBuyPopup] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const token = localStorage.getItem("token");

  const groupedSeats = useMemo(() => {
    const grouped = {};

    seats.forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });

    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.number - b.number);
    });

    return grouped;
  }, [seats]);

  const fetchScreenSeats = useCallback(async () => {
    const screenId =
      selectedShowtime?.screenId?._id || selectedShowtime?.screenId;

    if (!screenId) return;

    try {
      const res = await axios.get(
        `http://localhost:5001/api/screens/${screenId}/seats`
      );
      setSeats(res.data || []);
    } catch (err) {
      console.error("Failed to fetch screen seats:", err.response?.data || err.message);
    }
  }, [selectedShowtime]);

  const refreshSeatStatus = useCallback(async () => {
    if (!selectedShowtime?._id || !token) return;

    try {
      const res = await axios.get(
        `http://localhost:5001/api/seat-locks/showtime/${selectedShowtime._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSoldSeats(res.data.soldSeatIds || []);
      setLockedSeats(res.data.lockedSeatIds || []);
      setSelectedSeats(res.data.myLockedSeatIds || []);

      if (res.data.expiresAt) {
        setExpiresAt(new Date(res.data.expiresAt).getTime());
      } else {
        setExpiresAt(null);
        setTimeLeft(null);
      }
    } catch (err) {
      console.error("Failed to refresh seat status:", err.response?.data || err.message);
    }
  }, [selectedShowtime, token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieRes = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
        setMovie(movieRes.data);

        await fetchScreenSeats();
        await refreshSeatStatus();
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);
      }
    };

    fetchData();
  }, [movieId, fetchScreenSeats, refreshSeatStatus]);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = async () => {
      const seconds = Math.floor((expiresAt - Date.now()) / 1000);

      if (seconds <= 0) {
        setTimeLeft(0);
        await refreshSeatStatus();
      } else {
        setTimeLeft(seconds);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, refreshSeatStatus]);

  const handleSeatClick = useCallback(
    async (seatId) => {
      if (!token) {
        alert("You must be logged in");
        return;
      }

      try {
        if (selectedSeats.includes(seatId)) {
          await axios.delete("http://localhost:5001/api/seat-locks/unlock", {
            headers: { Authorization: `Bearer ${token}` },
            data: {
              showtimeId: selectedShowtime._id,
              seatId,
            },
          });
        } else {
          await axios.post(
            "http://localhost:5001/api/seat-locks/lock",
            {
              showtimeId: selectedShowtime._id,
              seatId,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }

        await refreshSeatStatus();
      } catch (err) {
        alert(err.response?.data?.message || "Seat action failed");
      }
    },
    [selectedSeats, selectedShowtime, token, refreshSeatStatus]
  );

  const handleBook = async () => {
    if (!movieId) return alert("Movie not found");
    if (!selectedShowtime || !selectedShowtime._id) {
      return alert("Showtime not selected");
    }
    if (selectedSeats.length === 0) {
      return alert("Please select at least one seat");
    }
    if (!token) return alert("You must be logged in to book");

    try {
      const totalPrice = selectedSeats.length * 300;

      const res = await axios.post(
        "http://localhost:5001/api/bookings/hold",
        {
          movieId,
          showtimeId: selectedShowtime._id,
          seats: selectedSeats,
          totalPrice,
          foods: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const booking = res.data;
      if (!booking || !booking._id) {
        return alert("Booking failed");
      }

      setBookingId(booking._id);
      setExpiresAt(
        booking.reservationExpiresAt
          ? new Date(booking.reservationExpiresAt).getTime()
          : null
      );

      setBookSuccessPopup({
        open: true,
        message: "Seats reserved successfully. Complete payment before timer ends.",
      });

      await refreshSeatStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed");
    }
  };

  // const handleBuyClick = async () => {
  //   if (selectedSeats.length === 0) return alert("Please select seats first");
  //   if (!token) return alert("You must be logged in to buy");

  //   try {
  //     const currentSelectedSeats = [...selectedSeats];

  //     const res = await axios.post(
  //       "http://localhost:5001/api/bookings/buy",
  //       {
  //         movieId,
  //         showtimeId: selectedShowtime._id,
  //         seats: selectedSeats,
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     const booking = res.data;
  //     if (!booking || !booking._id) {
  //       return alert("Buy failed");
  //     }

  //     setPurchaseSeats(currentSelectedSeats);
  //     setBookingId(booking._id);
  //     setBuyPopup(true);

  //     await refreshSeatStatus();
  //   } catch (err) {
  //     console.error("Direct buy error:", err.response?.data || err.message);
  //     alert(err.response?.data?.message || "Buy failed");
  //   }
  // };
  const handleBuyClick = () => {
    if (selectedSeats.length === 0) return alert("Please select seats first");
    if (!token) return alert("You must be logged in to buy");

    setPurchaseSeats([...selectedSeats]);
    setPurchaseSummary({
      totalPrice: selectedSeats.length * 300,
    });
    setAgreeTerms(false);
    setBuyPopup(true);
  };
  const handleReset = async () => {
    if (!selectedShowtime?._id || !token) return;

    try {
      await axios.delete(
        `http://localhost:5001/api/seat-locks/clear/${selectedShowtime._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await refreshSeatStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to clear seat locks");
    }
  };

  const handleConfirmBuy = async () => {
    if (!agreeTerms) return alert("You must agree to terms");
    if (purchaseSeats.length === 0) return alert("No seats selected");
    if (!token) return alert("You must be logged in to buy");

    try {
      setBuying(true);

      const res = await axios.post(
        "http://localhost:5001/api/bookings/buy",
        {
          movieId,
          showtimeId: selectedShowtime._id,
          seats: purchaseSeats,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const booking = res.data;

      if (!booking || !booking._id) {
        return alert("Buy failed");
      }

      setBookingId(booking._id);
      setPurchaseSummary({
        totalPrice: booking.totalPrice ?? purchaseSeats.length * 300,
        seats: booking.seats ?? purchaseSeats,
      });

      setBuyPopup(false);
      await refreshSeatStatus();

      navigate(`/foods/${booking._id}`);
    } catch (err) {
      console.error("Confirm buy error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Buy failed");
    } finally {
      setBuying(false);
    }
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
                : lockedSeats.includes(seatId) && !selectedSeats.includes(seatId)
                  ? "held"
                  : selectedSeats.includes(seatId)
                    ? "selected"
                    : "available";

              return (
                <div
                  key={seat._id}
                  className={`seat ${seatClass}`}
                  onClick={() => handleSeatClick(seat._id)}
                >
                  {seat.number}
                </div>
              );
            })}
          </div>
        </div>
      ));
  }, [groupedSeats, soldSeats, lockedSeats, selectedSeats, handleSeatClick]);

  return (
    <div className="seat-selection">
      <h2>Select Your Seats</h2>
      {movie && <h3>{movie.title}</h3>}

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
          <span>Locked</span>
        </div>
        <div className="legend-item">
          <div className="legend-box legend-bought" />
          <span>Sold</span>
        </div>
      </div>

      <div className="actions">
        <button className="book-btn" onClick={handleBook}>
          Book
        </button>
        <button className="buy-btn" onClick={handleBuyClick}>
          Buy
        </button>
        <button className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      {buyPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="popup-close" onClick={() => {
              setBuyPopup(false);
              setPurchaseSeats([]);
              setPurchaseSummary(null);
              setAgreeTerms(false);
            }}
            >
              ✕
            </button>
            <h2>Confirm Purchase</h2>
            <p>
              Seats:{" "}
              {seats
                .filter((seat) => purchaseSeats.includes(seat._id))
                .map((seat) => seat.label || `${seat.row}${seat.number}`)
                .join(", ")}
            </p>
            <p>Total: NPR {purchaseSummary?.totalPrice || purchaseSeats.length * 300}</p>            <div className="terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label>I agree to the terms and conditions</label>
            </div>
            <button className="confirm-btn" onClick={handleConfirmBuy} disabled={buying}>
              {buying ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      )}

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
                setBookSuccessPopup({ open: false, message: "" });
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