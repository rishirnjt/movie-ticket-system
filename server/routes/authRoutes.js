const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserType = require("../models/UserType");

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

    //get customer role
    const customerType = await UserType.findOne({ type: "Customer" });
    if(!customerType){
      return res.status(500).json({ message: "Customer role not found"});
    }

    //create user with userType
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      userType: customerType._id
    });

    //jwt
    const token = jwt.sign(
      { id: user._id, role: user.userType.type },
      process.env.JWT_SECRET,
      { expiresIn: "1d"}
    );

    res.status(201).json({
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
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// LOGIN

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received: ", { email, password });

  try {
    //find user
    const user = await User.findOne({ email }).populate("userType");
    if(!user){
      return res.status(400).json({ message: "Invalid credentials"});
    }

    // Use the model method for password comparison
    const isMatch = await user.matchPassword(password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.userType.type },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

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
