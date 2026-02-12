const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const { protect } = require("../middleware/authMiddleware");

// 👤 Get all tickets for logged-in user
router.get("/mytickets", protect(["Customer"]), async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .populate("movieId")
      .populate("showtimeId")
      .sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
