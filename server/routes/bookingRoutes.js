const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { protect } = require("../middleware/authMiddleware");

// Create a new booking
router.post("/reserve", protect("user"), async (req, res) => {
  try {
    const { movie, showtime, seats, totalPrice } = req.body;

    if (!movie || !showtime || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Please provide all booking details" });
    }

    // Check if seats are already booked
    const existing = await Booking.find({
      movie: movie,
      showtime: showtime,
      seats: { $in: seats },
      status: { $in: ["reserved", "confirmed"] }
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: "Some seats are already taken" });
    }

    const booking = new Booking({
      user: req.user._id,
      movie,
      showtime,
      seats,
      totalPrice,
      status: "reserved"
    });

    await booking.save();
    console.log("Booking saved:", booking);

    //populate 
    const populatedBooking = await Booking.findById(booking._id)
    .populate("user", "name email")
    .populate("movie", "title")
    .populate("showtime", "hall time");


    res.status(201).json({ message: "Booking successful", booking: populatedBooking});
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get booked seats for a showtime
router.get("/booked-seats/:movieId/:showtimeId", async (req, res) => {
  try {
    const { movieId, showtimeId } = req.params;

    const bookings = await Booking.find({
      movie: movieId,
      showtime: showtimeId,
      status: { $in: ["reserved", "confirmed"] }
    });

    const bookedSeats = bookings.flatMap(b => b.seats);
    res.json({ bookedSeats });
  } catch (err) {
    console.error("Error fetching booked seats:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
