const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserType = require("../models/UserType");
const bcrypt = require("bcryptjs"); 
const crypto = require("crypto");

const router = express.Router();

const { sendResetPasswordEmail } = require("../utils/sendEmail");

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

    console.log("Entered password:", password);
    console.log("Stored hash:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Password match result:", isMatch);

    if(!isMatch) {
      return res.status(400).json({ message: "Invalid credentials"});
    }
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

router.post("/forgot-password", async (req, res) => {
  try{
    const { email } = req.body;

    const user = await User.findOne({ email });

    if(!user){
      return res.status(404).json({ message: "User not found "});
    }

    //create reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    //store hashed token 
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    await sendResetPasswordEmail(user.email, resetUrl);
    console.log("Reset URL:", resetUrl);

    res.json({
      message: "Password reset link generated",
      resetUrl
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
    }
});

//Reset password
router.post("/reset-password/:token", async (req, res) => {
  try{
    const hashedToken = crypto.createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if(!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = req.body.password;
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error: ", error);
    res.status(500).json({ message: "Server error"});
  }
});

module.exports = router;