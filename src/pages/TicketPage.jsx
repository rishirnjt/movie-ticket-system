import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./TicketPage.css";

const TicketPage = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:5001/api/tickets/${ticketId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setTicket(res.data.ticket);
      } catch (err) {
        console.error("Failed to fetch ticket", err);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (!ticket) return <p>Loading ticket...</p>;

  const showTime = ticket.showtimeId?.time
    ? new Date(ticket.showtimeId.time)
    : null;

  return (
    <div className="ticket-page">
      {ticket.seats.map((seat, index) => (
        <div key={index} className="e-ticket-card">
          <h2>{ticket.movieId?.title}</h2>

          <p>{showTime?.toLocaleDateString()}</p>
          <p>{showTime?.toLocaleTimeString()}</p>
          <p>Hall: {ticket.showtimeId?.hall}</p>

          <p>Seat: {seat}</p>

          <p className="ticket-order">
            #{ticket._id.slice(-8).toUpperCase()}-{seat}
          </p>

          {ticket.qrCode && (
            <img
              src={ticket.qrCode}
              alt="QR"
              className="ticket-qr"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default TicketPage;
