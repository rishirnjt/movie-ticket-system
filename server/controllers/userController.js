const User = require("../models/User");

// Get logged-in user profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get logged-in user loyalty
exports.getMyLoyalty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "loyaltyPoints loyaltyTier freePopcornCount ticketsPurchasedCount"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      points: user.loyaltyPoints || 0,
      tier: user.loyaltyTier || "Bronze",
      freePopcornCount: user.freePopcornCount || 0,
      ticketsPurchasedCount: user.ticketsPurchasedCount || 0,
    });
  } catch (err) {
    console.error("Get loyalty error:", err);
    res.status(500).json({ message: "Failed to fetch loyalty data" });
  }
};

// Update logged-in user profile

exports.updateProfile = async (req, res) => {
  try {
    console.log("req.user =>", req.user);
    console.log("req.body =>", req.body);
    console.log("req.file =>", req.file);

    const userId = req.user._id || req.user.id;
    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof firstName !== "undefined") user.firstName = firstName.trim();
    if (typeof lastName !== "undefined") user.lastName = lastName.trim();
    if (typeof phone !== "undefined") user.phone = phone.trim();

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error full =>", error);
    return res.status(500).json({
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};
// Count users
exports.getUsersCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (err) {
    console.error("Error counting users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("userType")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "blocked" },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("userType");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User blocked successfully", user });
  } catch (err) {
    console.error("Error blocking user:", err);
    res.status(500).json({ message: "Failed to block user" });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("userType");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User unblocked successfully", user });
  } catch (err) {
    console.error("Error unblocking user:", err);
    res.status(500).json({ message: "Failed to unblock user" });
  }
};