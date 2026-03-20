const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Showtime = require("../models/Showtime");

const { sendPurchaseEmail } = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;

const PRODUCT_CODE = "EPAYTEST";

function generateSignature(total_amount, transaction_uuid) {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;

  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

// =============================
// INITIATE PAYMENT
// =============================
router.post("/initiate", protect(["Customer"]), async (req, res) => {
  try {
    const { bookingId, gateway } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("movie")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "holding") {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    if (!booking.movie) {
      return res.status(400).json({ message: "Movie data not found" });
    }

    if (!booking.showtime) {
      return res.status(400).json({ message: "Showtime data not found" });
    }

    const amount = Number(booking.totalPrice);

    if (!amount || Number.isNaN(amount)) {
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    // =============================
    // KHALTI
    // =============================
    if (gateway === "khalti") {
      const payload = {
        return_url: "http://localhost:5173/payment-success?gateway=khalti",
        website_url: "http://localhost:5173",
        amount: Math.floor(amount * 100),
        purchase_order_id: booking._id.toString(),
        purchase_order_name: booking.movie.title,
        customer_info: {
          name:
            `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
            "Customer",
          email: req.user.email,
        },
      };

      const response = await axios.post(
        "https://dev.khalti.com/api/v2/epayment/initiate/",
        payload,
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.json({
        gateway: "khalti",
        payment_url: response.data.payment_url,
        pidx: response.data.pidx,
      });
    }

    // =============================
    // ESEWA
    // =============================
    if (gateway === "esewa") {
      const total_amount = String(amount);
      const transaction_uuid = booking._id.toString();

      const signature = generateSignature(total_amount, transaction_uuid);

      const formData = {
        amount: String(amount),
        tax_amount: "0",
        total_amount: total_amount,
        transaction_uuid: transaction_uuid,
        product_code: PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: "http://localhost:5173/payment-success",
        failure_url: "http://localhost:5173/checkout",
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature: signature,
      };

      console.log("eSewa formData:", formData);

      return res.json({
        gateway: "esewa",
        url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
        formData,
      });
    }

    return res.status(400).json({ message: "Invalid payment gateway" });
  } catch (err) {
    console.error("Initiate error:", err.response?.data || err.message);

    return res.status(err.response?.status || 500).json({
      message:
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Payment initiation failed",
      error: err.response?.data || null,
    });
  }
});

// =============================
// VERIFY PAYMENT
// =============================
router.post("/verify", protect(["Customer"]), async (req, res) => {
  try {
    const { gateway, bookingId, pidx } = req.body;

    console.log("Verify request:", req.body);

    const booking = await Booking.findById(bookingId)
      .populate("movie")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "holding") {
      return res.status(400).json({ message: "Already processed" });
    }

    if (gateway === "khalti") {
      const response = await axios.post(
        "https://dev.khalti.com/api/v2/epayment/lookup/",
        { pidx },
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status !== "Completed") {
        return res.status(400).json({ message: "Payment not completed" });
      }
    } else if (gateway === "esewa") {
      const transaction_uuid = booking._id.toString();
      const total_amount = booking.totalPrice;

      const response = await axios.get(
        `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${PRODUCT_CODE}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`
      );

      console.log("Esewa verify:", response.data);

      if (response.data.status !== "COMPLETE") {
        return res.status(400).json({ message: "Payment not completed" });
      }
    } else {
      return res.status(400).json({ message: "Invalid payment gateway" });
    }

    booking.status = "confirmed";
    booking.reservationExpiresAt = null;
    await booking.save();

    await Showtime.findByIdAndUpdate(booking.showtime._id, {
      $addToSet: {
        bookedSeats: { $each: booking.seats },
      },
    });

    const ticket = await Ticket.create({
      userId: booking.user,
      movieId: booking.movie._id,
      showtimeId: booking.showtime._id,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      foods: booking.foods || [],
      status: "active",
    });

    const user = await User.findById(booking.user);

    if (user?.email) {
      await sendPurchaseEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(booking.showtime.time).toLocaleDateString(),
        time: new Date(booking.showtime.time).toLocaleTimeString(),
        seats: booking.seats.join(", "),
        foods: booking.foods || [],
        totalPaid: booking.totalPrice,
        ticketId: ticket._id,
      });
    }

    return res.json({
      message: "Payment successful",
      booking,
      ticket,
    });
  } catch (err) {
    console.error("Verify error:", err.response?.data || err.message);

    return res.status(err.response?.status || 500).json({
      message:
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Payment verification failed",
      error: err.response?.data || null,
    });
  }
});

module.exports = router;