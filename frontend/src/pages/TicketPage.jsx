import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./TicketPage.css";

const TicketPage = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);

  const downloadTicket = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `http://localhost:5001/api/tickets/${ticketId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ticket.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Download failed", error);
    }
  };

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

  const showTime = ticket.showtimeId?.startTime
    ? new Date(ticket.showtimeId.startTime)
    : null;

  const getSeatLabel = (seat, index) => {
    if (typeof seat === "string") return seat;       
    if (seat?.label) return seat.label;             
    if (ticket.seatSnapshot?.[index]?.label) {
      return ticket.seatSnapshot[index].label;      
    }
    return "Seat";
  };

  return (
    <div className="ticket-page">
      {(ticket.seats || []).map((seat, index) => {
        const seatLabel = getSeatLabel(seat, index);

        return (
          <div key={seat?._id || index} className="e-ticket-card">
            <h2>{ticket.movieId?.title}</h2>

            <p>{showTime?.toLocaleDateString()}</p>
            <p>
              {showTime?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>Screen: {ticket.showtimeId?.screenId?.name || "Screen"}</p>

            <p>Seat: {seatLabel}</p>

            <p className="ticket-order">
              #{ticket._id.slice(-8).toUpperCase()}-{seatLabel}
            </p>

            {ticket.qrCode && (
              <img
                src={ticket.qrCode}
                alt="QR"
                className="ticket-qr"
              />
            )}
          </div>
        );
      })}

      <button className="download-btn" onClick={downloadTicket}>
        Download Ticket
      </button>
    </div>
  );
};

export default TicketPage;