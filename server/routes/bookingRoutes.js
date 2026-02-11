const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const { protect } = require("../middleware/authMiddleware");

//Create booking
router.post("/hold", protect(["Customer"]), async (req, res) => {
  try {
    const { movieId, showtimeId, seats, foods = [] } = req.body;
    console.log("Body: ", req.body);

    if (!movieId || !showtimeId || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    // Booking closed 1 hour before showtime
    const oneHourBefore = new Date(showtime.time.getTime() - 60 * 60 * 1000);
    if (new Date() > oneHourBefore) {
      return res.status(400).json({ message: "Booking closed (1 hour before showtime)" });
    }

    // Check if seats are already booked or held
    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      $or: [
        { status: "confirmed" },
        { status: "holding", expiresAt: { $gt: new Date() } }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: "Seats already taken" });
    }

    // Dynamically calculate expiration: until 1 hour before showtime
    const now = new Date();
    const expiresAt = oneHourBefore; // seats hold until 1 hour before showtime

    const seatPrice = 300;
    const foodTotal = foods.reduce((sum, f) => sum + f.price * f.quantity, 0);
    const totalPrice = seats.length * seatPrice + foodTotal;

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      foods,
      totalPrice,
      status: "holding",
      expiresAt
    });

    res.status(201).json(booking);

  } catch (err) {
    console.error("Hold booking error:", err);
    res.status(500).json({ message: "Seat hold failed" });
  }
});


/* ======================================================
   CONFIRM BOOKING
   ====================================================== */
router.post("/confirm/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "holding") {
      return res.status(400).json({ message: "Invalid booking state" });
    }

    if (booking.expiresAt < new Date()) {
      return res.status(400).json({ message: "Hold expired" });
    }

    if (!booking.showtime || !booking.showtime.time) {
      return res.status(500).json({ message: "Showtime data missing" });
    }

    const showtimeTime = new Date(booking.showtime.time);
    const oneHourBefore = new Date(showtimeTime.getTime() - 60 * 60 * 1000);

    if (new Date() > oneHourBefore) {
      return res.status(400).json({
        message: "Booking closed (cannot confirm 1 hour before showtime)",
      });
    }

    booking.status = "confirmed";
    booking.expiresAt = null; // stop TTL
    booking.purchasedDeadline = oneHourBefore;

    await booking.save();

    res.json({ message: "Booking confirmed", booking });
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ message: "Confirmation failed" });
  }
});

/* ======================================================
   CANCEL BOOKING / RELEASE SEATS
   ====================================================== */
router.post("/cancel/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    booking.expiresAt = new Date(); // triggers TTL deletion if needed
    await booking.save();

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ message: "Cancel failed" });
  }
});

/* ======================================================
   GET BOOKED / HELD SEATS
   ====================================================== */
router.get("/booked-seats/:movieId/:showtimeId", async (req, res) => {
  try {
    const { movieId, showtimeId } = req.params;

    const bookings = await Booking.find({
      movie: movieId,
      showtime: showtimeId,
      $or: [
        { status: "confirmed" },
        { status: "holding", expiresAt: { $gt: new Date() } },
      ],
    });

    const bookedSeats = bookings.flatMap((b) => b.seats);
    res.json(bookedSeats);
  } catch (err) {
    console.error("Booked seats error:", err);
    res.status(500).json({ message: "Failed to fetch seats" });
  }
});

// My Reservations (active bookings)
router.get("/my-reservations", protect(["Customer"]), async (req, res) => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      user: req.user._id,
      $or: [
        // still holding (timer not expired)
        { status: "holding", expiresAt: { $gt: now } },
        // confirmed but purchase deadline not passed
        { status: "confirmed", purchasedDeadline: { $gt: now } }
      ]
    })
      .populate("movie")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("My reservations error:", err);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

/* ======================================================
   ADMIN ROUTES
   ====================================================== */
router.get("/admin/all", protect(["Admin"]), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user")
      .populate("movie")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.put("/admin/:id/status", protect(["Admin"]), async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (err) {
    console.error("Admin update error:", err);
    res.status(500).json({ message: "Status update failed" });
  }
});

module.exports = router;
