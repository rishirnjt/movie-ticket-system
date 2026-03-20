const mongoose = require("mongoose");
const Screen = require("../models/Screen");

const createScreen = async (req, res) => {
  try {
    const { name, format, capacity, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Screen name is required" });
    }

    const existing = await Screen.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Screen already exists" });
    }

    const screen = await Screen.create({
      name: name.trim(),
      format: format || "2D",
      capacity: Number(capacity),
      isActive: isActive ?? true,
    });

    res.status(201).json(screen);
  } catch (err) {
    console.error("Create screen error:", err);
    res.status(500).json({ message: "Failed to create screen", error: err.message });
  }
};

const getAllScreens = async (req, res) => {
  try {
    const screens = await Screen.find().sort({ name: 1 });
    res.json(screens);
  } catch (err) {
    console.error("Get all screens error:", err);
    res.status(500).json({ message: "Failed to fetch screens", error: err.message });
  }
};

const getScreenById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid screen id" });
    }

    const screen = await Screen.findById(id);

    if (!screen) {
      return res.status(404).json({ message: "Screen not found" });
    }

    res.json(screen);
  } catch (err) {
    console.error("Get screen by id error:", err);
    res.status(500).json({ message: "Failed to fetch screen", error: err.message });
  }
};

const updateScreen = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, format, capacity, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid screen id" });
    }

    const updated = await Screen.findByIdAndUpdate(
      id,
      { name, format, capacity, isActive },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Screen not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update screen error:", err);
    res.status(500).json({ message: "Failed to update screen", error: err.message });
  }
};

const deleteScreen = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid screen id" });
    }

    const deleted = await Screen.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Screen not found" });
    }

    res.json({ message: "Screen deleted" });
  } catch (err) {
    console.error("Delete screen error:", err);
    res.status(500).json({ message: "Failed to delete screen", error: err.message });
  }
};

module.exports = {
  createScreen,
  getAllScreens,
  getScreenById,
  updateScreen,
  deleteScreen,
};