const express = require("express");
const router = express.Router();
const { generateSeats } = require("../controllers/seatController");
const { verifyToken, isAdmin } = require("../middleware/auth");

router.post("/screens/:screenId/generate-seats", verifyToken, isAdmin, generateSeats);

module.exports = router;