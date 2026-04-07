const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const UserType = require("../models/UserType");
const { sendResetPasswordEmail } = require("../utils/sendEmail");

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

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        await sendResetPasswordEmail(user.email, resetUrl);

        console.log("Reset URL:", resetUrl);

        return res.json({
            message: "Password reset link generated",
            resetUrl,
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};