import React, { useState } from "react";
import "./SeatSelection.css";
import background from '../assets/cinema.jpg'; 

const rows = 19;
const cols = 10;
const bookedSeats = ["A2", "B4", "C6"];

const SeatSelection = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
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
            className={`seat ${isBooked ? "booked" : isSelected ? "selected" : ""}`}
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
    <div
      className="seat-selection"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: '2rem',
        color: '#fff'
      }}
    >
      <h2>Select Your Seats</h2>
      <div className="screen">SCREEN</div>

      <div className="legend">
        <div><div className="seat booked"></div> Booked</div>
        <div><div className="seat selected"></div> Selected</div>
        <div><div className="seat available"></div> Available</div>
      </div>

      <div className="seats-grid">{renderSeats()}</div>

      {selectedSeats.length > 0 && (
        <div className="summary">
          <p>Selected Seats: {selectedSeats.join(", ")}</p>
          <button className="proceed-btn">Book</button>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
