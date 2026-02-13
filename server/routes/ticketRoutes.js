const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const QRCode = require("qrcode");
const { protect } = require("../middleware/authMiddleware");

// Get all tickets for logged-in user
router.get("/mytickets", protect(["Customer"]), async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.user._id })
            .populate("movieId", "title posterUrl")
            .populate("showtimeId", "time hall")
            .sort({ createdAt: -1 });
        // console.log("Tickets with movie:", tickets); 

        //Generate QR codes
        const ticketsWithQR = await Promise.all(
            tickets.map(async (t) => {
                const qrData = {
                    ticketId: t._id,
                    movie: t.movieId.title,
                    seats: t.seats,
                    showtime: t.showtimeId.time,
                };

                const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

                return { ...t.toObject(), qrCode};
            })
        );

        res.json({ tickets: ticketsWithQR });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
