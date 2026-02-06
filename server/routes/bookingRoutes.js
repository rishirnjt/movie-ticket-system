// const express = require("express");
// const router = express.Router();
// const Booking = require("../models/Booking");
// const { protect } = require("../middleware/authMiddleware");

// // Create a new booking
// router.post("/reserve", protect("user"), async (req, res) => {
//   try {
//     let { movieId, showtime, seats, totalPrice, foods } = req.body;
//     console.log("Incoming booking request body: ", req.body);


//     if (!movieId|| !showtime || !seats || seats.length === 0) {
//       return res.status(400).json({ message: "Please provide all booking details" });
//     }

//     const showtimeId = typeof showtime === "object" ? showtime._id : showtime;


//     // Check if seats are already booked
//     const existing = await Booking.find({
//       movie: movieId,
//       showtime: showtime._id,
//       seats: { $in: seats },
//       status: { $in: ["reserved", "confirmed"] }
//     });

//     if (existing.length > 0) {
//       return res.status(400).json({ message: "Some seats are already taken" });
//     }

//     /// Calculate food total
//     const foodTotal = Array.isArray(foods)
//       ? foods.reduce((sum, f) => sum + f.price * f.quantity, 0)
//       : 0;

//       totalPrice += foodTotal;

//     const booking = new Booking({
//       user: req.user._id,
//       movie: movieId,
//       showtime: showtimeId,
//       seats,
//       foods,
//       totalPrice,
//       status: "reserved"
//     });

//     await booking.save();

//     //populate 
//     const populatedBooking = await Booking.findById(booking._id)
//     .populate("user", "name email")
//     .populate("movie", "title")
//     .populate("showtime", "hall time");


//     res.status(201).json({ message: "Booking successful", booking: populatedBooking});
//   } catch (err) {
//     console.error("Booking error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Get booked seats for a showtime
// router.get("/booked-seats/:movieId/:showtimeId", async (req, res) => {
//   try {
//     const { movieId, showtimeId } = req.params;

//     const bookings = await Booking.find({
//       movie: movieId,
//       showtime: showtimeId,
//       status: { $in: ["reserved", "confirmed"] }
//     });

//     const bookedSeats = bookings.flatMap(b => b.seats);
//     res.json({ bookedSeats });
//   } catch (err) {
//     console.error("Error fetching booked seats:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// // Get user's reservations
// router.get("/my-reservations", protect("user"), async (req, res) => {
//   try {
//     const bookings = await Booking.find({ 
//       user: req.user._id,
//       status: "reserved"
//     })
//       .populate("movie", "title")
//       .populate("showtime", "hall time"); 

//     console.log("All reservations for user:", bookings);

//     res.json(bookings); 
//   } catch (err) {
//     console.error("Error fetching reservations: ", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// //User's history
// router.get("/my-history", protect("user"), async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const now = new Date();

//     const bookings = await Booking.find({ 
//       user: userId,
//       status: { $in: ["reserved", "confirmed"] }
//     })
//       .populate("movie")
//       .populate("showtime", "hall time")
//       .sort({ "showtime.time": -1});

//     // Filter only past showtimes
//     const history = bookings.filter(b => {
//       if (!b.showtime?.time) return false;
//       const showtimeDate = new Date(b.showtime.time);
//       return showtimeDate < now;
//     });

//     res.json(history);
//   } catch (err) {
//     console.error("Error fetching history:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// });

// // Cancel booking
// router.post("/cancel/:id", protect("user"), async (req, res) => {
//   try {
//     console.log("Cancel request params:", req.params);
//     console.log("Cancel request body:", req.body);

//     const booking = await Booking.findById(req.params.id);
//     if (!booking) {
//       console.log("Booking not found");
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     console.log("Old seats:", booking.seats);
//     console.log("Old total:", booking.totalPrice);

//     const { seats } = req.body;
//     if (!seats || seats.length === 0) {
//       return res.status(400).json({ message: "No seats provided for cancellation." });
//     }

//     const oldSeatCount = booking.seats.length;
//     if (oldSeatCount === 0) {
//       return res.status(400).json({ message: "Booking has no seats" });
//     }

//     const pricePerSeat = booking.totalPrice / oldSeatCount;

//     // remove seats
//     booking.seats = booking.seats.filter((s) => !seats.includes(s));
//     console.log("Updated seats:", booking.seats);

//     if (booking.seats.length === 0) {
//       await Booking.findByIdAndDelete(req.params.id);
//       console.log("Booking deleted completely");
//       return res.json({ message: "Booking cancelled completely" });
//     }

//     booking.totalPrice = booking.seats.length * pricePerSeat;
//     await booking.save();
//     console.log("Booking updated:", booking);

//     res.json({ message: "Selected seats cancelled successfully", booking });
//   } catch (err) {
//     console.error("Cancel booking error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET a single booking by ID
// router.get("/:bookingId", protect("user"), async (req, res) => {
//   try {
//     const { bookingId } = req.params;

//     const booking = await Booking.findById(bookingId)
//       .populate("movie", "title")
//       .populate("showtime", "hall time")
//       .populate("user", "name email");

//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     res.json(booking);
//   } catch (err) {
//     console.error("Error fetching booking:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// //add foods 
// router.post("/add-foods/:bookingId", protect("user"), async(req, res) => {
//   try{
//     const{ bookingId } = req.params;
//     const{ items } = req.body;

//     const booking = await Booking.findById(bookingId);
//     if(!booking) {
//       return res.status(404).json({ message: "Booking not found"});
//     }

//     //add foods into booking
//     const newFoods = items.map(item => ({
//       name: item.name,
//       price: item.price,
//       quantity: item.quantity || 1
//     }));

//     //merge foods
//     booking.foods = [...(booking.foods || []), ...newFoods];

//     //update price
//     const foodTotal = newFoods.reduce((sum, f) => sum + f.price * f.quantity, 0);
//     booking.totalPrice += foodTotal;

//     await booking.save();

//     res.json({ message: "Foods added successfully", booking });
//   } catch (err) {
//     console.error("Add foods error: ",err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });


// module.exports = router;
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { protect } = require("../middleware/authMiddleware");

// ============================
// Create a new booking
// ============================
router.post("/reserve", protect(["Customer"]), async (req, res) => {
  try {
    const { movieId, showtime, seats, totalPrice, foods } = req.body;

    if (!movieId || !showtime || !seats || seats.length === 0) {
      return res.status(400).json({ message: "Please provide all booking details" });
    }

    const showtimeId = typeof showtime === "object" ? showtime._id : showtime;

    // Check if seats are already booked
    const existing = await Booking.find({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      status: { $in: ["reserved", "confirmed"] },
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: "Some seats are already taken" });
    }

    // Calculate food total
    const foodTotal = Array.isArray(foods)
      ? foods.reduce((sum, f) => sum + f.price * f.quantity, 0)
      : 0;

    const finalPrice = totalPrice + foodTotal;

    const booking = new Booking({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      foods,
      totalPrice: finalPrice,
      status: "reserved",
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate("showtime", "hall time");

    res.status(201).json({ message: "Booking successful", booking: populatedBooking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// Get booked seats for a showtime
// ============================
router.get("/booked-seats/:movieId/:showtimeId", async (req, res) => {
  try {
    const { movieId, showtimeId } = req.params;

    const bookings = await Booking.find({
      movie: movieId,
      showtime: showtimeId,
      status: { $in: ["reserved", "confirmed"] },
    });

    const bookedSeats = bookings.flatMap(b => b.seats);
    res.json({ bookedSeats });
  } catch (err) {
    console.error("Error fetching booked seats:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ============================
// Get user's reservations
// ============================
router.get("/my-reservations", protect(["Customer"]), async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      status: "reserved",
    })
      .populate("movie", "title")
      .populate("showtime", "hall time");

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// User's booking history
// ============================
router.get("/my-history", protect(["Customer"]), async (req, res) => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      user: req.user._id,
      status: { $in: ["reserved", "confirmed"] },
    })
      .populate("movie")
      .populate("showtime", "hall time")
      .sort({ "showtime.time": -1 });

    const history = bookings.filter(b => b.showtime?.time && new Date(b.showtime.time) < now);

    res.json(history);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// Cancel booking or seats
// ============================
router.post("/cancel/:id", protect(["Customer"]), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const { seats } = req.body;
    if (!seats || seats.length === 0) return res.status(400).json({ message: "No seats provided" });

    const pricePerSeat = booking.totalPrice / booking.seats.length;

    // Remove seats
    booking.seats = booking.seats.filter(s => !seats.includes(s));

    if (booking.seats.length === 0) {
      await Booking.findByIdAndDelete(req.params.id);
      return res.json({ message: "Booking cancelled completely" });
    }

    booking.totalPrice = booking.seats.length * pricePerSeat;
    await booking.save();

    res.json({ message: "Selected seats cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// Add foods to booking
// ============================
router.post("/add-foods/:bookingId", protect(["Customer"]), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { items } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const newFoods = items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    }));

    booking.foods = [...(booking.foods || []), ...newFoods];

    const foodTotal = newFoods.reduce((sum, f) => sum + f.price * f.quantity, 0);
    booking.totalPrice += foodTotal;

    await booking.save();

    res.json({ message: "Foods added successfully", booking });
  } catch (err) {
    console.error("Add foods error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//get bookings for admin
router.get("admin/all", protect(["Admin"]), async (req, res)=> {
  try{
    const booking = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate("showtime", "hall time")
      .sort({ createdAt: -1 });

      res.json(bookings);
  } catch (err) {
    console.error("Admin bookings error:", err);
    res.status(500).json({ message: "Server error "});
  }
});

//update booking status for admin
router.patch("/admin/:id/status", protect(["Admin"]), async (req, res) => {
  try{
    const { status } = req.body;

    if(!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const bookings = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true}
    )
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate("showtime", "hall time");

      if(!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
  } catch (err) {
    console.error("Admin status update error:", err);
    res.status(500).json({ message: "Server error "});
  }
});

module.exports = router;
