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
    const decodeEsewaData = (encoded) => {
      if (!encoded) return null;

      try {
        const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
        return JSON.parse(atob(padded));
      } catch (err) {
        console.error("Failed to decode eSewa data:", err);
        return null;
      }
    };

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const rawGateway = searchParams.get("gateway");
        const gateway = rawGateway?.toLowerCase()?.trim();

        const pidx = searchParams.get("pidx");
        const purchaseOrderId =
          searchParams.get("purchase_order_id") || searchParams.get("bookingId");

        const esewaData = searchParams.get("data");
        const decodedEsewa = decodeEsewaData(esewaData);

        console.log("Payment success URL:", window.location.href);
        console.log("All params:", Object.fromEntries(searchParams.entries()));
        console.log("Gateway from query:", gateway);
        console.log("pidx:", pidx);
        console.log("purchase_order_id / bookingId:", purchaseOrderId);
        console.log("Decoded eSewa:", decodedEsewa);

        let finalGateway = gateway;
        let payload = {};

        if (!finalGateway) {
          if (esewaData || decodedEsewa) {
            finalGateway = "esewa";
          } else if (pidx || purchaseOrderId) {
            finalGateway = "khalti";
          }
        }

        if (finalGateway === "esewa") {
          const transactionUuid = decodedEsewa?.transaction_uuid;

          if (!transactionUuid) {
            throw new Error("transaction_uuid missing in eSewa response");
          }

          payload = {
            gateway: "esewa",
            bookingId: transactionUuid,
          };
        } else if (finalGateway === "khalti") {
          if (!pidx) {
            throw new Error("pidx missing in Khalti response");
          }

          if (!purchaseOrderId) {
            throw new Error("purchase_order_id missing in Khalti response");
          }

          payload = {
            gateway: "khalti",
            pidx,
            bookingId: purchaseOrderId,
          };
        } else {
          throw new Error("Unknown payment gateway");
        }

        console.log("Final gateway:", finalGateway);
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

        setStatusText("Payment Successful");
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