const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserType = require("../models/UserType");
const bcrypt = require("bcryptjs"); 

const router = express.Router();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.userType.type }, // include role in token
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

//Register
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Get "Customer" role from UserType
    const customerType = await UserType.findOne({ type: "Customer" });
    if (!customerType) {
      return res.status(500).json({ message: "Customer role not found" });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      userType: customerType._id,
    });

    // Populate userType to access type for token
    const populatedUser = await User.findById(user._id).populate("userType");

    // Generate JWT
    const token = generateToken(populatedUser);

    res.status(201).json({
      token,
      user: {
        id: populatedUser._id,
        firstName: populatedUser.firstName,
        lastName: populatedUser.lastName,
        email: populatedUser.email,
        role: populatedUser.userType.type,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate("userType");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Use matchPassword (bcrypt if hashed)
    console.log("Entered password:", password);
    console.log("Stored hash:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Password match result:", isMatch);
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.userType.type,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;