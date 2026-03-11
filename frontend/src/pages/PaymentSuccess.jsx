import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PaymentSuccess.css";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [statusText, setStatusText] = useState("Verifying payment...");
  const [loading, setLoading] = useState(true);

  const gatewayRaw = searchParams.get("gateway");
  const gateway = gatewayRaw?.split("/")[0]; // safety fix

  // Khalti params
  const pidx = searchParams.get("pidx");
  const bookingIdKhalti = searchParams.get("purchase_order_id");

  // eSewa encoded data
  const esewaData = searchParams.get("data");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");

        console.log("Gateway:", gateway);
        console.log("Search params:", Object.fromEntries(searchParams));

        let payload = {};

        // ======================
        // KHALTI
        // ======================
        if (gateway === "khalti") {
          payload = {
            gateway: "khalti",
            pidx,
            bookingId: bookingIdKhalti,
          };
        }

        // ======================
        // ESEWA
        // ======================
        if (gateway === "esewa" && esewaData) {
          const decoded = JSON.parse(atob(esewaData));

          payload = {
            gateway: "esewa",
            bookingId: decoded.transaction_uuid,
          };
        }

        console.log("Verify payload:", payload);

        const res = await axios.post(
          "http://localhost:5001/api/payment/verify",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Verify response:", res.data);

        setStatusText("Payment Successful 🎉");
        setLoading(false);

        const ticketId = res.data.ticket._id;

        setTimeout(() => {
          navigate(`/ticket/${ticketId}`, { replace: true });
        }, 2000);

      } catch (error) {
        console.error("VERIFY ERROR:", error.response?.data || error.message);
        setStatusText("Payment verification failed");
        setLoading(false);
      }
    };

    if (
      (gateway === "khalti" && pidx && bookingIdKhalti) ||
      (gateway === "esewa" && esewaData)
    ) {
      verifyPayment();
    } else {
      console.log("Missing params");
      setStatusText("Missing payment parameters");
      setLoading(false);
    }

  }, [gateway, pidx, bookingIdKhalti, esewaData, navigate, searchParams]);

  return (
    <div className="payment-container">
      {loading && <div className="spinner"></div>}
      <h2>{statusText}</h2>
      {loading && <p>Please do not refresh the page</p>}
    </div>
  );
}

export default PaymentSuccess;