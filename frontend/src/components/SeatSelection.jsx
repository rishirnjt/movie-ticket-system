import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./SeatSelection.css";

const API_URL = "http://localhost:5001";
const SEAT_PRICE = 300;

const TimerDisplay = memo(function TimerDisplay({
  expiresAt,
  refreshSeatStatus,
}) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    let expiredHandled = false;

    const tick = async () => {
      const seconds = Math.floor((expiresAt - Date.now()) / 1000);

      if (seconds <= 0) {
        setTimeLeft(0);

        if (!expiredHandled) {
          expiredHandled = true;
          await refreshSeatStatus();
        }
      } else {
        setTimeLeft(seconds);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, refreshSeatStatus]);

  if (timeLeft === null) return null;

  if (timeLeft === 0) {
    return <div className="timer-expired">❌ Time expired. Seats released.</div>;
  }

  return (
    <div className="timer-box">
      <span>⏳ Time Remaining</span>
      <strong>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </strong>
    </div>
  );
});

const SeatItem = memo(function SeatItem({
  seat,
  isSold,
  isHeld,
  isSelected,
  onSeatClick,
}) {
  const seatClass = isSold
    ? "sold"
    : isHeld
    ? "held"
    : isSelected
    ? "selected"
    : "available";

  const handleClick = useCallback(() => {
    if (isSold || isHeld) return;
    onSeatClick(seat._id);
  }, [isSold, isHeld, onSeatClick, seat._id]);

  return (
    <div className={`seat ${seatClass}`} onClick={handleClick}>
      {seat.number}
    </div>
  );
});

const SeatRow = memo(function SeatRow({
  row,
  rowSeats,
  soldSeatSet,
  lockedSeatSet,
  selectedSeatSet,
  onSeatClick,
}) {
  return (
    <div className="seat-row">
      <div className="row-label">{row}</div>

      <div className="row-seats">
        {rowSeats.map((seat) => {
          const seatId = seat._id;

          return (
            <SeatItem
              key={seatId}
              seat={seat}
              isSold={soldSeatSet.has(seatId)}
              isHeld={lockedSeatSet.has(seatId)}
              isSelected={selectedSeatSet.has(seatId)}
              onSeatClick={onSeatClick}
            />
          );
        })}
      </div>
    </div>
  );
});

const SeatGrid = memo(function SeatGrid({
  groupedSeats,
  soldSeatSet,
  lockedSeatSet,
  selectedSeatSet,
  onSeatClick,
}) {
  const sortedRows = useMemo(() => Object.keys(groupedSeats).sort(), [groupedSeats]);

  return (
    <div className="seats-grid">
      {sortedRows.map((row) => (
        <SeatRow
          key={row}
          row={row}
          rowSeats={groupedSeats[row]}
          soldSeatSet={soldSeatSet}
          lockedSeatSet={lockedSeatSet}
          selectedSeatSet={selectedSeatSet}
          onSeatClick={onSeatClick}
        />
      ))}
    </div>
  );
});

const SeatSelection = () => {
  const { movieId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedShowtime = location.state?.selectedShowtime || null;
  const token = localStorage.getItem("token");

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [soldSeats, setSoldSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);
  const [purchaseSeats, setPurchaseSeats] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [buying, setBuying] = useState(false);

  const [bookingId, setBookingId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  const [bookSuccessPopup, setBookSuccessPopup] = useState({
    open: false,
    message: "",
  });
  const [buyPopup, setBuyPopup] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const selectedSeatSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
  const soldSeatSet = useMemo(() => new Set(soldSeats), [soldSeats]);
  const lockedSeatSet = useMemo(() => new Set(lockedSeats), [lockedSeats]);

  const groupedSeats = useMemo(() => {
    const grouped = {};

    for (const seat of seats) {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    }

    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.number - b.number);
    });

    return grouped;
  }, [seats]);

  const screenName = useMemo(() => {
    return (
      selectedShowtime?.screenId?.name ||
      selectedShowtime?.screenName ||
      "Screen 1"
    );
  }, [selectedShowtime]);

  const formattedShowtime = useMemo(() => {
    if (!selectedShowtime?.startTime) return "";

    const dt = new Date(selectedShowtime.startTime);

    return `${dt.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })} ${dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [selectedShowtime]);

  const selectedSeatLabels = useMemo(() => {
    return seats
      .filter((seat) => selectedSeatSet.has(seat._id))
      .map((seat) => seat.label || `${seat.row}${seat.number}`);
  }, [seats, selectedSeatSet]);

  const selectedSeatLabelsText = useMemo(() => {
    return selectedSeatLabels.length > 0 ? selectedSeatLabels.join(", ") : "None";
  }, [selectedSeatLabels]);

  const popupSeatLabelsText = useMemo(() => {
    if (purchaseSeats.length === 0) return "";

    const purchaseSeatSet = new Set(purchaseSeats);

    return seats
      .filter((seat) => purchaseSeatSet.has(seat._id))
      .map((seat) => seat.label || `${seat.row}${seat.number}`)
      .join(", ");
  }, [seats, purchaseSeats]);

  const totalPrice = useMemo(
    () => selectedSeats.length * SEAT_PRICE,
    [selectedSeats.length]
  );

  const fetchScreenSeats = useCallback(async () => {
    const screenId =
      selectedShowtime?.screenId?._id || selectedShowtime?.screenId;

    if (!screenId) return;

    try {
      const res = await axios.get(`${API_URL}/api/screens/${screenId}/seats`);
      setSeats(res.data || []);
    } catch (err) {
      console.error(
        "Failed to fetch screen seats:",
        err.response?.data || err.message
      );
    }
  }, [selectedShowtime]);

  const refreshSeatStatus = useCallback(async () => {
    if (!selectedShowtime?._id || !movieId) return;

    try {
      const res = await axios.get(
        `${API_URL}/api/bookings/booked-seats/${movieId}/${selectedShowtime._id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setSoldSeats(res.data.soldSeats || []);
      setLockedSeats(res.data.heldSeats || []);
    } catch (err) {
      console.error(
        "Failed to refresh seat status:",
        err.response?.data || err.message
      );
    }
  }, [movieId, selectedShowtime, token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieRes = await axios.get(`${API_URL}/api/movies/${movieId}`);
        setMovie(movieRes.data);

        await fetchScreenSeats();
        await refreshSeatStatus();
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);
      }
    };

    fetchData();
  }, [movieId, fetchScreenSeats, refreshSeatStatus]);

  const handleSeatClick = useCallback(
    async (seatId) => {
      if (!token) {
        alert("You must be logged in");
        return;
      }

      if (!selectedShowtime?._id) {
        alert("Showtime not selected");
        return;
      }

      if (soldSeatSet.has(seatId) || lockedSeatSet.has(seatId)) {
        return;
      }

      try {
        if (selectedSeatSet.has(seatId)) {
          await axios.delete(`${API_URL}/api/seat-locks/unlock`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
              showtimeId: selectedShowtime._id,
              seatId,
            },
          });

          setSelectedSeats((prev) => {
            const updated = prev.filter((id) => id !== seatId);

            if (updated.length === 0) {
              setExpiresAt(null);
            }

            return updated;
          });
        } else {
          const res = await axios.post(
            `${API_URL}/api/seat-locks/lock`,
            {
              showtimeId: selectedShowtime._id,
              seatId,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          setSelectedSeats((prev) => [...prev, seatId]);

          if (res.data?.expiresAt) {
            setExpiresAt(new Date(res.data.expiresAt).getTime());
          }
        }
      } catch (err) {
        alert(err.response?.data?.message || "Seat action failed");
      }
    },
    [token, soldSeatSet, lockedSeatSet, selectedSeatSet, selectedShowtime]
  );

  const handleBook = useCallback(async () => {
    if (!movieId) return alert("Movie not found");
    if (!selectedShowtime || !selectedShowtime._id) {
      return alert("Showtime not selected");
    }
    if (selectedSeats.length === 0) {
      return alert("Please select at least one seat");
    }
    if (!token) return alert("You must be logged in to book");

    try {
      const res = await axios.post(
        `${API_URL}/api/bookings/hold`,
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

      setSelectedSeats([]);
      setBookSuccessPopup({
        open: true,
        message:
          "Seats reserved successfully. Complete payment before timer ends.",
      });

      await refreshSeatStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed");
    }
  }, [
    movieId,
    selectedShowtime,
    selectedSeats,
    token,
    totalPrice,
    refreshSeatStatus,
  ]);

  const handleBuyClick = useCallback(() => {
    if (selectedSeats.length === 0) return alert("Please select seats first");
    if (!token) return alert("You must be logged in to buy");

    setPurchaseSeats([...selectedSeats]);
    setPurchaseSummary({
      totalPrice,
    });
    setAgreeTerms(false);
    setBuyPopup(true);
  }, [selectedSeats, token, totalPrice]);

  const handleReset = useCallback(async () => {
    if (!selectedShowtime?._id || !token) return;

    try {
      await axios.delete(
        `${API_URL}/api/seat-locks/clear/${selectedShowtime._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedSeats([]);
      setExpiresAt(null);
      await refreshSeatStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to clear seat locks");
    }
  }, [selectedShowtime, token, refreshSeatStatus]);

  const handleConfirmBuy = useCallback(async () => {
    if (!agreeTerms) return alert("You must agree to terms");
    if (purchaseSeats.length === 0) return alert("No seats selected");
    if (!token) return alert("You must be logged in to buy");

    try {
      setBuying(true);

      const res = await axios.post(
        `${API_URL}/api/bookings/buy`,
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
        totalPrice: booking.totalPrice ?? purchaseSeats.length * SEAT_PRICE,
        seats: booking.seats ?? purchaseSeats,
      });

      setBuyPopup(false);
      setSelectedSeats([]);
      await refreshSeatStatus();

      navigate(`/foods/${booking._id}`);
    } catch (err) {
      console.error("Confirm buy error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Buy failed");
    } finally {
      setBuying(false);
    }
  }, [
    agreeTerms,
    purchaseSeats,
    token,
    movieId,
    selectedShowtime,
    refreshSeatStatus,
    navigate,
  ]);

  return (
    <div className="seat-selection">
      <div className="seat-selection-header">
        <span className="seat-page-kicker">CINEMAX EXPERIENCE</span>
        <h2>Select Your Seats</h2>
        {movie && <h3>{movie.title}</h3>}
      </div>

      {selectedShowtime && (
        <p className="showtime">
          <strong>
            {screenName} – {formattedShowtime}
          </strong>
        </p>
      )}

      <div className="seat-main-container">
        <div className="seat-center">
          <div className="screen-wrap">
            <div className="screen-glow" />
            <div className="screen">SCREEN</div>
          </div>

          <SeatGrid
            groupedSeats={groupedSeats}
            soldSeatSet={soldSeatSet}
            lockedSeatSet={lockedSeatSet}
            selectedSeatSet={selectedSeatSet}
            onSeatClick={handleSeatClick}
          />
        </div>

        <div className="seat-sidebar">
          <div className="booking-card">
            <h3 className="booking-title">Booking Summary</h3>
            <p className="booking-subtitle">
              Choose your seats and complete checkout before the timer ends.
            </p>

            <TimerDisplay
              expiresAt={expiresAt}
              refreshSeatStatus={refreshSeatStatus}
            />

            <div className="summary-block">
              <div className="summary-line">
                <span>Seats Selected</span>
                <strong>{selectedSeats.length}</strong>
              </div>

              <div className="summary-line summary-seats-line">
                <span>Selected Seats</span>
                <strong>{selectedSeatLabelsText}</strong>
              </div>

              <div className="summary-line total-line">
                <span>Total</span>
                <strong>NPR {totalPrice}</strong>
              </div>
            </div>

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

            <div className="actions summary-actions">
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
          </div>
        </div>
      </div>

      {buyPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button
              className="popup-close"
              onClick={() => {
                setBuyPopup(false);
                setPurchaseSeats([]);
                setPurchaseSummary(null);
                setAgreeTerms(false);
              }}
            >
              ✕
            </button>

            <h2>Confirm Purchase</h2>
            <p>Seats: {popupSeatLabelsText}</p>
            <p>
              Total: NPR{" "}
              {purchaseSummary?.totalPrice || purchaseSeats.length * SEAT_PRICE}
            </p>

            <div className="terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label>I agree to the terms and conditions</label>
            </div>

            <button
              className="confirm-btn"
              onClick={handleConfirmBuy}
              disabled={buying}
            >
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