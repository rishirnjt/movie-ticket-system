const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

const sendBookingEmail = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");


//Hold booking
router.post("/hold", protect(["Customer"]), async (req, res) => {
  try {
    const { movieId, showtimeId, seats, foods = [] } = req.body;

    if (!movieId || !showtimeId || !seats?.length)
      return res.status(400).json({ message: "Missing required fields" });

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime.time) {
      return res.status(500).json({
        message: "Showtime time is missing in database"
      });
    }

    const showtimeDate = new Date(showtime.time);
    const oneHourBefore = new Date(showtimeDate.getTime() - 60 * 60 * 1000);


    if (new Date() > oneHourBefore)
      return res.status(400).json({
        message: "Booking closed (1 hour before showtime)"
      });

    // Prevent double booking
    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      $or: [
        { status: "confirmed" },
        { status: "holding", reservationExpiresAt: { $gt: new Date() } }
      ]
    });

    if (existing)
      return res.status(409).json({ message: "Seats already taken" });

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
      totalPrice,
      status: "holding",
      reservationExpiresAt: oneHourBefore
    });

    //send email
    const user = await User.findById(req.user._id);
    try{
      await sendBookingEmail(user.email,{
        movie: showtime.movie.title,
        date: new Date(showtime.time).toLocaleDateString(),
        time: new Date(showtime.time).toLocaleDateString(),
        seats: booking.seats.join(", "),
        total: booking.totalPrice
      });
      console.log("Booking email sent after hold");
    } catch (emailErr) {
      console.error("Email failed but booking held:", emailErr);
    }
    res.status(201).json(booking);

  } catch (err) {
    console.error("Hold error:", err);
    res.status(500).json({ message: "Seat hold failed" });
  }
});


//Buy
router.post("/buy", protect(["Customer"]), async (req, res) => {
  try {
    console.log("Buy request body:", req.body);
    console.log("User info:", req.user);

    const { movieId, showtimeId, seats } = req.body;

    if (!movieId || !showtimeId || !seats?.length) {
      console.log("Missing fields in request");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      console.log("Showtime not found:", showtimeId);
      return res.status(404).json({ message: "Showtime not found" });
    }

    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      $or: [
        { status: "confirmed" },
        { status: "holding", reservationExpiresAt: { $gt: new Date() } }
      ]
    });

    if (existing) {
      console.log("Seats already taken:", seats);
      return res.status(409).json({ message: "Seats already taken" });
    }

    const paymentWindow = new Date(Date.now() + 10 * 60 * 1000);

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      totalPrice: seats.length * 300,
      status: "holding",
      reservationExpiresAt: paymentWindow
    });

    console.log("Booking created:", booking._id);
    res.status(201).json(booking);

  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ message: "Buy failed", error: err.message });
  }
});


// Add foods to booking
router.post("/add-foods/:id", protect(["Customer"]), async (req, res) => {
  try {
    const { foods } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "confirmed" && booking.status !== "holding")
      return res.status(400).json({ message: "Invalid booking status" });

    booking.foods = foods;

    // Recalculate total
    const foodTotal = foods.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    booking.totalPrice += foodTotal;

    await booking.save();

    res.json(booking);

  } catch (err) {
    console.error("Add foods error:", err);
    res.status(500).json({ message: "Failed to add foods" });
  }
});

//Checkout
router.post("/checkout/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("showtime")
      .populate("movie");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (booking.reservationExpiresAt < new Date())
      return res.status(400).json({ message: "Payment window expired" });

    booking.status = "confirmed";
    booking.reservationExpiresAt = null;

    await booking.save();

    const Ticket = require("../models/Ticket");

    await Ticket.create({
      userId: booking.user,
      movieId: booking.movie._id,
      showtimeId: booking.showtime,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      foods: booking.foods || []
    });
    console.log("Creating ticket for user:", booking.user);

    try {
      const user = await User.findById(booking.user);

      await sendBookingEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(booking.showtime.time).toLocaleDateString(),
        time: new Date(booking.showtime.time).toLocaleTimeString(),
        seats: booking.seats.join(", "),
        total: booking.totalPrice
      });

    } catch (emailErr) {
      console.error("Email failed but booking confirmed:", emailErr);
    }


    res.json({
      message: "Payment successful",
      booking
    });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Checkout failed" });
  }
});


//Cancel Booking
router.post("/cancel/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("showtime");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    booking.status = "cancelled";
    booking.reservationExpiresAt = null;

    await booking.save();

    res.json({ message: "Booking cancelled" });

  } catch (err) {
    res.status(500).json({ message: "Cancel failed" });
  }
});


//Get Booked Seats
router.get("/booked-seats/:movieId/:showtimeId", async (req, res) => {
  try {
    const { movieId, showtimeId } = req.params;
    const now = new Date();

    // Active bookings
    const bookings = await Booking.find({
      movie: movieId,
      showtime: showtimeId,
      $or: [
        { status: "confirmed" },
        { status: "holding", reservationExpiresAt: { $gt: now } }
      ]
    });

    // Sold tickets (permanent)
    const tickets = await Ticket.find({
      movieId,
      showtimeId,
      status: "active"
    });

    const heldSeats = bookings
      .filter(b =>
        b.status === "holding" &&
        b.reservationExpiresAt &&
        b.reservationExpiresAt > now
      )
      .flatMap(b => b.seats);

    const soldSeatsFromBookings = bookings
      .filter(b => b.status === "confirmed")
      .flatMap(b => b.seats);

    const soldSeatsFromTickets = tickets.flatMap(t => t.seats);

    const soldSeats = [
      ...soldSeatsFromBookings,
      ...soldSeatsFromTickets
    ];

    res.json({ soldSeats, heldSeats });

  } catch (err) {
    console.error("Fetch seats error:", err);
    res.status(500).json({ message: "Failed to fetch seats" });
  }
});

//reservations
router.get("/my-reservations", protect(["Customer"]), async (req, res) => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      user: req.user._id,
      $or: [
        { status: "holding", reservationExpiresAt: { $gt: now } },
        { status: "confirmed" }
      ]
    })
      .populate("movie")
      .populate("showtime")
      .sort({ createdAt: -1 });

    const activeBookings = bookings.filter(b => {
      return b.showtime && new Date(b.showtime.time) > now;
    });

    res.json(activeBookings);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});


//Admin- Get all bookings
router.get("/admin/all", protect(["Admin"]), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});


// =====================================================
// 👑 ADMIN – GET SINGLE BOOKING
// =====================================================
router.get("/admin/:id", protect(["Admin"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("movie")
      .populate("showtime");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    res.json(booking);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});


//Admin-Updated Status
router.put("/admin/:id/status", protect(["Admin"]), async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["holding", "confirmed", "cancelled"];

    if (!allowedStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const booking = await Booking.findById(req.params.id);

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    booking.status = status;

    if (status === "confirmed") {
      booking.reservationExpiresAt = null;
    }

    await booking.save();

    res.json({ message: "Status updated", booking });

  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
});

// GET booking by ID
router.get("/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("showtime");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    res.json(booking);

  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});



module.exports = router;
