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

module.exports = router;
