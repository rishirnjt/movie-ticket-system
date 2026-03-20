import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PaymentSuccess.css";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [statusText, setStatusText] = useState("Verifying payment...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("PAYMENT_SUCCESS_V2_LOADED");

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const pidx = searchParams.get("pidx");
        const purchaseOrderId = searchParams.get("purchase_order_id");
        const esewaData = searchParams.get("data");

        let gateway = searchParams.get("gateway");

        console.log("Current URL:", window.location.href);
        console.log("All params:", Object.fromEntries(searchParams.entries()));
        console.log("Gateway:", gateway);
        console.log("pidx:", pidx);
        console.log("purchase_order_id:", purchaseOrderId);
        console.log("esewa data:", esewaData);

        if (!gateway && esewaData) {
          gateway = "esewa";
        }

        if (!gateway && (pidx || purchaseOrderId)) {
          gateway = "khalti";
        }

        console.log("FINAL GATEWAY CHECK:", gateway);

        let payload = {};

        if (gateway === "esewa") {
          const decoded = JSON.parse(atob(esewaData));
          console.log("Decoded eSewa data:", decoded);

          const transactionUuid = decoded.transaction_uuid;

          if (!transactionUuid) {
            throw new Error("transaction_uuid missing in eSewa response");
          }

          payload = {
            gateway: "esewa",
            bookingId: transactionUuid,
          };
        } else if (gateway === "khalti") {
          payload = {
            gateway: "khalti",
            pidx,
            bookingId: purchaseOrderId,
          };
        } else {
          throw new Error("Unknown payment gateway");
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

        const ticketId = res.data.ticket?._id;
        if (!ticketId) {
          throw new Error("Ticket ID missing in response");
        }

        setTimeout(() => {
          navigate(`/ticket/${ticketId}`, { replace: true });
        }, 1500);
      } catch (error) {
        console.error("VERIFY ERROR:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        setStatusText(
          error.response?.data?.message ||
            error.message ||
            "Payment verification failed"
        );
        setLoading(false);
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  return (
    <div className="payment-container">
      {loading && <div className="spinner"></div>}
      <h2>{statusText}</h2>
      {loading && <p>Please do not refresh the page</p>}
    </div>
  );
}

export default PaymentSuccess;