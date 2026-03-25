import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("Processing payment...");

  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    const verify = async () => {
      try {
        const token = localStorage.getItem("token");

        const gateway = params.get("gateway");
        const bookingId = params.get("bookingId");
        const pidx = params.get("pidx");
        const sessionId = params.get("session_id");

        console.log("PaymentSuccess query params:", {
          gateway,
          bookingId,
          pidx,
          sessionId,
        });

        const res = await axios.post(
          `${API_URL}/api/payments/verify`,
          {
            gateway,
            bookingId,
            pidx,
            sessionId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("VERIFY RESPONSE:", res.data);

        if (res.data.ticket) {
          setTicket(res.data.ticket);
          setMessage("Payment Successful");
          toast.success("Payment successful!");
        } else {
          setMessage(
            res.data.message || "Payment processed, but ticket info was not found."
          );
        }
      } catch (err) {
        console.error(
          "Payment verification failed:",
          err.response?.data || err.message
        );
        setMessage(
          err.response?.data?.message || "Payment verification failed"
        );
        toast.error(
          err.response?.data?.message || "Payment verification failed"
        );
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [params, API_URL]);

  if (loading) {
    return <div>Processing payment...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{message}</h1>

      {ticket && (
        <button onClick={() => navigate(`/ticket/${ticket._id}`)}>
          View Ticket
        </button>
      )}
    </div>
  );
};

export default PaymentSuccess;