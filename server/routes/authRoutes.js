const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const router = express.Router();


// REGISTER
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (password will be hashed automatically by pre-save hook)
    const user = await User.create({ firstName, lastName, email, password });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: "user",
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// LOGIN

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received: ", { email, password });

  try {
    // Check Admin first
    let account = await Admin.findOne({ email });
    let role = "admin";

    // If not admin, check User
    if (!account) {
      account = await User.findOne({ email });
      role = "user";
    }

    console.log("Found account:", account ? account.email : "none");

    if (!account) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Use the model method for password comparison
    const isMatch = await account.matchPassword(password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: account._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: account._id,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
