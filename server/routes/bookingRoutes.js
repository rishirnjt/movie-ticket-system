const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

// customer actions
router.post("/hold", protect(["Customer"]), bookingController.holdBooking);
router.post("/buy", protect(["Customer"]), bookingController.buyBooking);
router.post("/add-foods/:id",protect(["Customer"]),bookingController.addFoodsToBooking);
router.post("/checkout/:id", protect(["Customer"]), bookingController.checkoutBooking);
router.post("/cancel/:id", protect(["Customer"]), bookingController.cancelBooking);
router.delete("/expire/:id", protect(["Customer"]), bookingController.expireBooking);

// seat status
router.get("/booked-seats/:movieId/:showtimeId", bookingController.getBookedSeats);

// reservations
router.get("/my-reservations", protect(["Customer"]), bookingController.getMyReservations);

// admin
router.get("/admin/all", protect(["Admin"]), bookingController.getAllBookingsAdmin);

// single booking
router.get("/:id", protect(["Customer"]), bookingController.getBookingById);

module.exports = router;