const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ticketController = require("../controllers/ticketController");

// customer ticket lists
router.get("/mytickets", protect(["Customer"]), ticketController.getMyTickets);
router.get("/myhistory", protect(["Customer"]), ticketController.getMyHistory);

// admin
router.get("/admin/revenue", protect(["Admin"]), ticketController.getAdminRevenue);

// booking -> ticket
router.post(
  "/from-booking/:bookingId",
  protect(["Customer"]),
  ticketController.createTicketFromBooking
);

// download + single ticket
router.get(
  "/:ticketId/download",
  protect(["Customer"]),
  ticketController.downloadTicket
);

router.get("/:ticketId", protect(["Customer"]), ticketController.getTicketById);

module.exports = router;