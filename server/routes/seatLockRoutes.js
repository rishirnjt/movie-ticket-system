const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const seatLockController = require("../controllers/seatLockController");

router.get(
  "/showtime/:showtimeId",
  protect(["Customer"]),
  seatLockController.getSeatLockStatus
);

router.post(
  "/lock",
  protect(["Customer"]),
  seatLockController.lockSeat
);

router.delete(
  "/unlock",
  protect(["Customer"]),
  seatLockController.unlockSeat
);

router.delete(
  "/clear/:showtimeId",
  protect(["Customer"]),
  seatLockController.clearMySeatLocks
);

module.exports = router;