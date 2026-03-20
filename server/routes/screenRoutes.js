const express = require("express");
const router = express.Router();

const {
  createScreen,
  getAllScreens,
  getScreenById,
  updateScreen,
  deleteScreen,
} = require("../controllers/screenController");

// Create screen
router.post("/", createScreen);

// Get all screens
router.get("/", getAllScreens);

// Get one screen
router.get("/:id", getScreenById);

// Update screen
router.put("/:id", updateScreen);

// Delete screen
router.delete("/:id", deleteScreen);

module.exports = router;