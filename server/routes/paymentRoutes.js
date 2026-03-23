const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  initiatePayment,
  verifyPayment,
} = require("../controllers/paymentController");

router.post("/initiate", protect(["Customer"]), initiatePayment);
router.post("/verify", protect(["Customer"]), verifyPayment);

module.exports = router;