const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const { protect } = require("../middleware/authMiddleware");

/* ======================================================
   CREATE BOOKING (START TIMER WHEN SEAT IS SELECTED)
   ====================================================== */
router.post("/reserve", protect(["Customer"]), async (req, res) => {
  try {
    const { movieId, showtimeId, seats, foods = [] } = req.body;

    if (!movieId || !showtimeId || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if seats are already reserved (and not expired)
    const existingBooking = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      status: "reserved",
      expiresAt: { $gt: new Date() }
    });

    if (existingBooking) {
      return res.status(409).json({ message: "Seat already booked" });
    }

    const seatPrice = 300;
    const foodTotal = foods.reduce(
      (sum, f) => sum + f.price * f.quantity,
      0
    );

    const totalPrice = seats.length * seatPrice + foodTotal;

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      foods,
      totalPrice
      // expiresAt auto set (5 mins)
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Reserve error:", err);
    res.status(500).json({ message: "Reservation failed" });
  }
});

/* ======================================================
   CONFIRM BOOKING (STOP TIMER)
   ====================================================== */
router.post("/confirm/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.expiresAt < new Date()) {
      return res.status(400).json({ message: "Booking expired" });
    }

    booking.status = "confirmed";
    booking.expiresAt = null; // VERY IMPORTANT (prevents TTL delete)
    await booking.save();

    res.json({ message: "Booking confirmed", booking });
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ message: "Confirmation failed" });
  }
});

/* ======================================================
   CANCEL BOOKING (RELEASE SEATS)
   ====================================================== */
router.post("/cancel/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    booking.expiresAt = new Date(); // TTL deletes immediately
    await booking.save();

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ message: "Cancel failed" });
  }
});

/* ======================================================
   GET BOOKED SEATS (FOR SEAT MAP)
   ====================================================== */
router.get(
  "/booked-seats/:movieId/:showtimeId",
  async (req, res) => {
    try {
      const { movieId, showtimeId } = req.params;

      const bookings = await Booking.find({
        movie: movieId,
        showtime: showtimeId,
        $or: [
          { status: "confirmed" },
          { status: "reserved", expiresAt: { $gt: new Date() } }
        ]
      });

      const bookedSeats = bookings.flatMap(b => b.seats);
      res.json(bookedSeats);
    } catch (err) {
      console.error("Booked seats error:", err);
      res.status(500).json({ message: "Failed to fetch seats" });
    }
  }
);

/* ======================================================
   USER BOOKINGS
   ====================================================== */
router.get("/my-bookings", protect(["Customer"]), async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("My bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
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

router.put(
  "/admin/:id/status",
  protect(["Admin"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (err) {
      console.error("Admin update error:", err);
      res.status(500).json({ message: "Status update failed" });
    }
  }
);

//reservations
router.get("/my-reservations", protect(["Customer"]), async (req, res) => {
  try{
    const bookings = await Booking.find({
      user: req.user._id,
      status: "reserved",
      expiresAt: { $gt: new Date() }
    })
    .populate("movie")
    .populate("showtime")
    .sort({ createdAt: -1});

    res.json(bookings);
  } catch (err) {
    console.error("My reservations error:", err);
    res.status(500).json({ message: "Failed to fetch reservations"});
  }
});

//booking history
router.get("/my-history", protect(["Customer"]), async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      status: { $in: ["confirmed", "cancelled"] }
    })
      .populate("movie")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("My history error:", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});
module.exports = router;
