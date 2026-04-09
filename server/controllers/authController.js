const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const UserType = require("../models/UserType");
const { sendResetOtpEmail } = require("../utils/sendEmail");

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.userType.type },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

// Register
exports.register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            });
        }
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already in use" });
        }

        const customerType = await UserType.findOne({ type: "Customer" });
        if (!customerType) {
            return res.status(500).json({ message: "Customer role not found" });
        }

        const user = await User.create({
            firstName: firstName?.trim(),
            lastName: lastName?.trim(),
            email: normalizedEmail,
            password,
            userType: customerType._id,
        });

        const populatedUser = await User.findById(user._id).populate("userType");

        const token = generateToken(populatedUser);

        return res.status(201).json({
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

        if (err.code === 11000) {
            return res.status(400).json({ message: "Email is already in use" });
        }

        return res.status(500).json({ message: "Server error" });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = email?.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).populate("userType");

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                message: "Your account has been blocked by admin",
                code: "ACCOUNT_BLOCKED",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);

        return res.json({
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
        return res.status(500).json({ message: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const normalizedEmail = email?.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({
                message: "If account exists, OTP sent",
            });
        }

        const otp = generateOtp();

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
        user.resetPasswordOtpVerified = false;

        await user.save();

        await sendResetOtpEmail(user.email, user.firstName, otp);

        return res.json({ message: "OTP sent" });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

//verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const normalizedEmail = email?.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: "Invalid request" });
        }

        if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
            return res.status(400).json({ message: "No OTP request found" });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.resetPasswordOtpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        user.resetPasswordOtpVerified = true;
        await user.save();

        return res.json({ message: "OTP verified" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = email?.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ message: "Invalid request" });
        }

        if (!user.resetPasswordOtpVerified) {
            return res.status(403).json({ message: "OTP verification required" });
        }

        user.password = password;

        //clear otp
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpires = null;
        user.resetPasswordOtpVerified = false;

        await user.save();

        return res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};