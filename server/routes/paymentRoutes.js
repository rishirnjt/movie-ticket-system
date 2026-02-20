const express = require("express");
const axios = require("axios");
const router = express.Router();

const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

const { sendPurchaseEmail } = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;


router.post("/initiate", protect(["Customer"]), async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("movie")
      .populate("showtime");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "holding")
      return res.status(400).json({ message: "Invalid booking status" });

    const amount = Math.floor((booking.totalPrice || 0) * 100);
    if (amount <= 0) return res.status(400).json({ message: "Invalid booking amount" });

    const payload = {
      return_url: "http://localhost:5173/payment-success",
      website_url: "http://localhost:5173",
      amount,
      purchase_order_id: booking._id.toString(),
      purchase_order_name: booking.movie.title,
      customer_info: {
        name: req.user.name || "Customer",
        email: req.user.email,
      },
    };

    console.log("Khalti initiate payload:", payload);

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      payload,
      { headers: { Authorization: `Key ${KHALTI_SECRET_KEY}` } }
    );

    console.log("Khalti response:", response.data);

    res.json({ payment_url: response.data.payment_url, pidx: response.data.pidx });
  } catch (err) {
    console.error("Initiate error:", err.response?.data || err.message);
    res.status(500).json({ message: "Payment initiation failed", error: err.response?.data || err.message });
  }
});


//Verify Payment
router.post("/verify", protect(["Customer"]), async (req, res) => {
  try {
    const { pidx, bookingId } = req.body;

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status !== "Completed") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("movie")
      .populate("showtime");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "holding")
      return res.status(400).json({ message: "Booking already processed" });

    // ✅ Confirm booking
    booking.status = "confirmed";
    booking.reservationExpiresAt = null;
    await booking.save();

    // ✅ Create ticket
    const ticket = await Ticket.create({
      userId: booking.user,
      movieId: booking.movie._id,
      showtimeId: booking.showtime._id,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      foods: booking.foods || [],
      status: "active"
    });

    // ✅ Send email
    const user = await User.findById(booking.user);

    await sendPurchaseEmail(user.email, {
      movie: booking.movie.title,
      date: new Date(booking.showtime.time).toLocaleDateString(),
      time: new Date(booking.showtime.time).toLocaleTimeString(),
      seats: booking.seats.join(", "),
      foods: booking.foods || [],
      totalPaid: booking.totalPrice,
      ticketId: ticket._id
    });

    res.json({
      message: "Payment successful",
      booking,
      ticket
    });

  } catch (err) {
    console.error("Verify error:", err.response?.data || err.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;
