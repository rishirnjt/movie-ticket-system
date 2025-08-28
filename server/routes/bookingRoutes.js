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

//Get user's reservations
// router.get("/my-reservations", protect("user"), async (req, res) => {
//   try {
//     const now = new Date();

//     const bookings = await Booking.find({ 
//       user: req.user._id,
//       status: "reserved"
//     })
//       .populate("movie", "title")
//       .populate("showtime", "hall time time") // include time explicitly
//       // .sort({ "showtime.time": 1 });
//       console.log("All reservations for user:", bookings);


//     const upcoming = bookings.filter(b => {
//         if (!b.showtime?.time) return false;
//         console.log("Checking showtime:", b.showtime);
//         return b.showtime?.time && new Date(b.showtime.time) >= now;
//       });


//     res.json(upcoming); 
//   } catch (err) {
//     console.error("Error fetching reservations: ", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

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


module.exports = router;