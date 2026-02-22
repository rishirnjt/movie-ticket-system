const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");

const expireOldTickets = async() => {
    const now = new Date();

    const expiredShowtimes = await require("../models/Showtime")
        .find({ time: { $lt: now} })
        .select("_id");

    const showtimeIds = expiredShowtimes.map(st=> st._id);

    await Ticket.updateMany(
        { showtimeId: { $in: showtimeIds }, status: "active"},
        { $set: { status: "expired"} }
    );
};

// Get all tickets for logged-in user
router.get("/mytickets", protect(["Customer"]), async (req, res) => {
  try {
    await expireOldTickets();

    const tickets = await Ticket.find({ userId: req.user._id, status: "active"})
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

router.get("/myhistory", protect(["Customer"]), async(req, res) => {
    try{
        await expireOldTickets();

        const tickets = await Ticket.find({
            userId: req.user._id,
            status: "expired"
        })
        .populate("movieId", "title posterUrl")
        .populate("showtimeId", "time hall")
        .sort({ created: -1});

    res.json({ tickets });
    } catch (err) {
        console.error("Failed to fetch history:", err);
        res.status(500).json({ message: "Server error" });
    }
});

//Ticket download
router.get("/:ticketId/download", protect(["Customer"]), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.ticketId,
      userId: req.user._id,
    })
      .populate("movieId")
      .populate("showtimeId");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 50 });

    const fileName = `ticket-${ticket._id}.pdf`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Generate QR code
    const qrData = JSON.stringify({
      ticketId: ticket._id,
      movie: ticket.movieId.title,
      seats: ticket.seats,
      hall: ticket.showtimeId.hall,
      time: ticket.showtimeId.time,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    // Convert base64 to buffer
    const qrBuffer = Buffer.from(
      qrImage.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );

    // Design Ticket
    doc
      .fontSize(24)
      .text(" CinemaX ", { align: "center" })
      .moveDown(2);

    doc.fontSize(16).text(`Movie: ${ticket.movieId.title}`);
    doc.text(`Hall: ${ticket.showtimeId.hall}`);

    const showTime = new Date(ticket.showtimeId.time);

    doc.text(`Date: ${showTime.toLocaleDateString()}`);
    doc.text(`Time: ${showTime.toLocaleTimeString()}`);

    doc.moveDown();

    doc.text(`Seats: ${ticket.seats.join(", ")}`);

    doc.moveDown();

    doc.text(
      `Booking ID: ${ticket._id.toString().slice(-8).toUpperCase()}`
    );

    doc.moveDown(2);

    // Add QR code to PDF
    doc.image(qrBuffer, {
      fit: [150, 150],
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12).text("Scan this QR code at the cinema entrance.", {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

//Convert reservation to ticket
router.post("/from-booking/:bookingId", protect(["Customer"]), async(req, res) => {
    try{
        const booking = await Booking.findOne({
            _id: req.params.bookingId,
            user: req.user._id,
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found"});
        }

        const ticket = await Ticket.create({
            userId: booking.user,
            movieId: booking.movie,
            showtimeId: booking.showtime,
            seats: booking.seats,
            totalPrice: booking.totalPrice,
        });

        await booking.deleteOne();
        res.json({ message: "Ticket purchased successfully", ticket});
    } catch (err) {
        console.error(err);
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

//Get Total Revenue
router.get("/admin/revenue", protect(["Admin"]), async(req, res) => {
  try{
    const tickets = await Ticket.find({});

    const totalRevenue = tickets.reduce(
      (sum, t) => sum + (t.totalPrice || 0),
      0
    );

    res.json({ revenue: totalRevenue });
  } catch (err) {
    res.status(500).json({ message: "Failed to calculate revenue" });
  }
});

module.exports = router;
