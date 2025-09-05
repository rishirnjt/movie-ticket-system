const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { protect } = require("../middleware/authMiddleware");

// Create a new booking
router.post("/reserve", protect("user"), async (req, res) => {
  try {
    let { movieId, showtime, seats, totalPrice } = req.body;
    console.log("Incoming booking request body: ", req.body);


    if (!movieId|| !showtime || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Please provide all booking details" });
    }

    const showtimeId = typeof showtime === "object" ? showtime._id : showtime;


    // Check if seats are already booked
    const existing = await Booking.find({
      movie: movieId,
      showtime: showtime._id,
      seats: { $in: seats },
      status: { $in: ["reserved", "confirmed"] }
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: "Some seats are already taken" });
    }

    const booking = new Booking({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
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

// Get user's reservations
router.get("/my-reservations", protect("user"), async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user._id,
      status: "reserved"
    })
      .populate("movie", "title")
      .populate("showtime", "hall time"); // get hall + time fields

    console.log("All reservations for user:", bookings);

    res.json(bookings); 
  } catch (err) {
    console.error("Error fetching reservations: ", err);
    res.status(500).json({ message: "Server error" });
  }
});


//User's history
router.get("/my-history", protect("user"), async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const bookings = await Booking.find({ 
      user: userId,
      status: { $in: ["reserved", "confirmed"] }
    })
      .populate("movie")
      .populate("showtime", "hall time")
      .sort({ "showtime.time": -1});

    // Filter only past showtimes
    const history = bookings.filter(b => {
      if (!b.showtime?.time) return false;
      const showtimeDate = new Date(b.showtime.time);
      return showtimeDate < now;
    });

    res.json(history);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Cancel booking
router.post("/cancel/:id", protect("user"), async (req, res) => {
  try {
    console.log("Cancel request params:", req.params);
    console.log("Cancel request body:", req.body);

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      console.log("Booking not found");
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("Old seats:", booking.seats);
    console.log("Old total:", booking.totalPrice);

    const { seats } = req.body;
    if (!seats || seats.length === 0) {
      return res.status(400).json({ message: "No seats provided for cancellation." });
    }

    const oldSeatCount = booking.seats.length;
    if (oldSeatCount === 0) {
      return res.status(400).json({ message: "Booking has no seats" });
    }

    const pricePerSeat = booking.totalPrice / oldSeatCount;

    // remove seats
    booking.seats = booking.seats.filter((s) => !seats.includes(s));
    console.log("Updated seats:", booking.seats);

    if (booking.seats.length === 0) {
      await Booking.findByIdAndDelete(req.params.id);
      console.log("Booking deleted completely");
      return res.json({ message: "Booking cancelled completely" });
    }

    booking.totalPrice = booking.seats.length * pricePerSeat;
    await booking.save();
    console.log("Booking updated:", booking);

    res.json({ message: "Selected seats cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;