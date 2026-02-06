// routes/admin.js
const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const User = require("../models/User");

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const activeMovies = await Movie.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();

    res.json({
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeMovies,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//total bookings
router.get("/bookings", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments();

    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate("showtime", "hall time")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
