const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  holdBooking,
  buyBooking,
  addFoodsToBooking,
  checkoutBooking,
  cancelBooking,
  getBookedSeats,
  getMyReservations,
  getAllBookingsAdmin,
  getSingleBookingAdmin,
  updateBookingStatusAdmin,
  getBookingById,
  expireBooking
} = require("../controllers/bookingController");

router.post("/hold", protect(["Customer"]), holdBooking);
router.post("/buy", protect(["Customer"]), buyBooking);
router.post("/add-foods/:id", protect(["Customer"]), addFoodsToBooking);
router.post("/checkout/:id", protect(["Customer"]), checkoutBooking);
router.post("/cancel/:id", protect(["Customer"]), cancelBooking);

router.get("/booked-seats/:movieId/:showtimeId", getBookedSeats);
router.get("/my-reservations", protect(["Customer"]), getMyReservations);

router.get("/admin/all", protect(["Admin"]), getAllBookingsAdmin);
router.get("/admin/:id", protect(["Admin"]), getSingleBookingAdmin);
router.put("/admin/:id/status", protect(["Admin"]), updateBookingStatusAdmin);

router.get("/:id", protect(["Customer"]), getBookingById);
router.delete("/expire/:id", expireBooking);

module.exports = router;