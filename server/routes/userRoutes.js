// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// @desc    Get logged-in user profile
// @route   GET /api/users/me
router.get("/me", protect("user"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password"); 
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/update
router.put("/update", protect("user"), async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    user.name = name || user.name;
    user.phone = phone || user.phone;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
 