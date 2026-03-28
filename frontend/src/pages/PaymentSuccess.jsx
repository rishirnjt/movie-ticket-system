import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("Processing payment...");
  const [status, setStatus] = useState("loading"); // loading | success | error

  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const gatewayLabel = useMemo(() => {
    const gateway = params.get("gateway");
    if (gateway === "khalti") return "Khalti";
    if (gateway === "esewa") return "eSewa";
    if (gateway === "stripe") return "Stripe";
    return "Payment Gateway";
  }, [params]);

  useEffect(() => {
    const verify = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setStatus("error");
          setMessage("You must be logged in to verify payment.");
          toast.error("Please login first");
          return;
        }

        const gateway = params.get("gateway");
        const pidx = params.get("pidx");
        const sessionId = params.get("session_id");

        const rawBookingId = params.get("bookingId") || "";
        let embeddedEsewaData = params.get("data");
        let cleanBookingId = rawBookingId;

        if (rawBookingId.includes("?data=")) {
          const parts = rawBookingId.split("?data=");
          cleanBookingId = parts[0];
          if (!embeddedEsewaData && parts[1]) {
            embeddedEsewaData = parts[1];
          }
        }

        let decoded = null;
        if (embeddedEsewaData) {
          try {
            decoded = JSON.parse(atob(embeddedEsewaData));
            console.log("Decoded eSewa data:", decoded);
          } catch (err) {
            console.error("eSewa decode failed:", err);
          }
        }

        const bookingId = decoded?.transaction_uuid || cleanBookingId;

        if (!gateway) {
          setStatus("error");
          setMessage("Missing payment gateway.");
          toast.error("Missing payment gateway");
          return;
        }

        if (!bookingId) {
          setStatus("error");
          setMessage("Missing booking ID.");
          toast.error("Missing booking ID");
          return;
        }

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

        if (res.data.ticket) {
          setTicket(res.data.ticket);
          setStatus("success");
          setMessage("Your payment was verified successfully.");
          toast.success("Payment successful!");
        } else {
          setStatus("success");
          setMessage(
            res.data.message ||
              "Payment was processed, but ticket details were not returned."
          );
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Payment verification failed";

        console.error(
          "Payment verification failed:",
          err.response?.data || err.message
        );

        setStatus("error");
        setMessage(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [params, API_URL]);

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        {loading ? (
          <>
            <div className="payment-icon loading-ring" />
            <p className="payment-kicker">Verifying Payment</p>
            <h1>Processing your payment...</h1>
            <p className="payment-text">
              Please wait while we confirm your transaction with {gatewayLabel}.
            </p>
          </>
        ) : (
          <>
            <div
              className={`payment-icon ${
                status === "success" ? "success-icon" : "error-icon"
              }`}
            >
              {status === "success" ? "✓" : "!"}
            </div>

            <p className="payment-kicker">
              {status === "success" ? "Payment Successful" : "Payment Failed"}
            </p>

            <h1>
              {status === "success"
                ? "Your booking is confirmed"
                : "We could not verify your payment"}
            </h1>

            <p className="payment-text">{message}</p>

            <div className="payment-meta">
              <div className="payment-meta-row">
                <span>Gateway</span>
                <strong>{gatewayLabel}</strong>
              </div>

              {ticket?._id && (
                <div className="payment-meta-row">
                  <span>Ticket ID</span>
                  <strong>#{ticket._id.slice(-6).toUpperCase()}</strong>
                </div>
              )}
            </div>

            <div className="payment-actions">
              {ticket && (
                <button
                  className="primary-btn"
                  onClick={() => navigate(`/ticket/${ticket._id}`)}
                >
                  View Ticket
                </button>
              )}

              <button
                className="secondary-btn"
                onClick={() => navigate("/myaccount")}
              >
                Go to My Account
              </button>

              <button
                className="ghost-btn"
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;