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

    // Generate QR codes safely
    const ticketsWithQR = await Promise.all(
      tickets.map(async (t) => {
        try {
          const movieTitle = t.movieId?.title || "Unknown Movie";
          const posterUrl = t.movieId?.posterUrl || null;
          const showtime = t.showtimeId?.time || "Unknown Time";
          const hall = t.showtimeId?.hall || "Unknown Hall";

          const qrData = {
            ticketId: t._id,
            movie: movieTitle,
            seats: t.seats,
            showtime,
            hall,
          };

          const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

          return {
            ...t.toObject(),
            qrCode,
            movieId: { ...t.movieId?.toObject(), title: movieTitle, posterUrl },
            showtimeId: { ...t.showtimeId?.toObject(), time: showtime, hall },
          };
        } catch (innerErr) {
          console.error(`Failed to generate QR for ticket ${t._id}:`, innerErr);
          return { ...t.toObject(), qrCode: null };
        }
      })
    );

    res.json({ tickets: ticketsWithQR });
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single ticket by ID
router.get("/:ticketId", protect(["Customer"]), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.ticketId,
      userId: req.user._id, 
    })
      .populate("movieId", "title posterUrl")
      .populate("showtimeId", "time hall");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const movieTitle = ticket.movieId?.title || "Unknown Movie";
    const posterUrl = ticket.movieId?.posterUrl || null;
    const showtime = ticket.showtimeId?.time || "Unknown Time";
    const hall = ticket.showtimeId?.hall || "Unknown Hall";

    const qrData = {
      ticketId: ticket._id,
      movie: movieTitle,
      seats: ticket.seats,
      showtime,
      hall,
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    res.json({
      ticket: {
        ...ticket.toObject(),
        qrCode,
        movieId: {
          ...ticket.movieId?.toObject(),
          title: movieTitle,
          posterUrl,
        },
        showtimeId: {
          ...ticket.showtimeId?.toObject(),
          time: showtime,
          hall,
        },
      },
    });
  } catch (err) {
    console.error("Failed to fetch ticket:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
