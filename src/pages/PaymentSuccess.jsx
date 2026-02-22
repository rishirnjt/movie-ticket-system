import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PaymentSuccess.css";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [statusText, setStatusText] = useState("Verifying payment...");
  const [loading, setLoading] = useState(true);

  const pidx = searchParams.get("pidx");
  const bookingId = searchParams.get("purchase_order_id");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.post(
          "http://localhost:5001/api/payment/verify",
          { pidx, bookingId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStatusText("Payment Successful 🎉");
        setLoading(false);

        const ticketId = res.data.ticket._id;

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(`/ticket/${ticketId}`, { replace: true });
        }, 2000);

      } catch (error) {
        console.error(error);

        setStatusText("Payment verification failed ");
        setLoading(false);
      }
    };

    if (pidx && bookingId) verifyPayment();
  }, [pidx, bookingId, navigate]);

  return (
    <div className="payment-container">
      {loading && <div className="spinner"></div>}
      <h2>{statusText}</h2>
      {loading && <p>Please do not refresh the page</p>}
    </div>
  );
}

export default PaymentSuccess;