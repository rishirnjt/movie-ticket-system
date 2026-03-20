const express = require("express");
const router = express.Router();

const {
  generateSeats,
  getSeatsByScreen,
} = require("../controllers/seatController");

router.post("/screens/:screenId/generate-seats", generateSeats);
router.get("/screens/:screenId/seats", getSeatsByScreen);

module.exports = router;