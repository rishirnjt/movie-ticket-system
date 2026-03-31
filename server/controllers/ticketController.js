const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");


const getSeatLabelArray = (ticket) => {
  return (ticket.seats || []).map((seat) => {
    if (typeof seat === "string") return seat; // fallback if not populated
    if (seat?.label) return seat.label;
    if (seat?._id) return seat._id.toString();
    return String(seat);
  });
};

const getShowtimeStart = (showtime) => {
  return showtime?.startTime || showtime?.time || null;
};

const getScreenName = (showtime) => {
  return showtime?.screenId?.name || showtime?.hall || "Screen";
};

const buildQrPayload = (ticket) => {
  return {
    ticketId: ticket._id.toString(),
    movie: ticket.movieId?.title || "Unknown Movie",
    seats: getSeatLabelArray(ticket),
    showtime: getShowtimeStart(ticket.showtimeId),
    screen: getScreenName(ticket.showtimeId),
  };
};

const serializeTicket = async (ticket) => {
  let qrCode = null;

  try {
    qrCode = await QRCode.toDataURL(JSON.stringify(buildQrPayload(ticket)));
  } catch (err) {
    console.error(`Failed to generate QR for ticket ${ticket._id}:`, err);
  }

  const movieObj = ticket.movieId?.toObject
    ? ticket.movieId.toObject()
    : ticket.movieId || {};

  const showtimeObj = ticket.showtimeId?.toObject
    ? ticket.showtimeId.toObject()
    : ticket.showtimeId || {};

  return {
    ...ticket.toObject(),
    qrCode,
    seatLabels: getSeatLabelArray(ticket),
    movieId: {
      ...movieObj,
      title: ticket.movieId?.title || movieObj.title || "Unknown Movie",
      posterUrl: ticket.movieId?.posterUrl || movieObj.posterUrl || null,
    },
    showtimeId: {
      ...showtimeObj,
      startTime: getShowtimeStart(ticket.showtimeId),
      time: getShowtimeStart(ticket.showtimeId), // compatibility alias
      hall: getScreenName(ticket.showtimeId),    // compatibility alias
      screenId: ticket.showtimeId?.screenId || showtimeObj.screenId || null,
    },
  };
};

//expire old tickets
const expireOldTickets = async () => {
  const now = new Date();

  const tickets = await Ticket.find({
    userId: { $exists: true },
    status: "active",
  })
    .populate("movieId", "duration title")
    .populate("showtimeId", "startTime endTime");

  const ticketIdsToExpire = [];

  console.log("NOW:", now);

  for (const ticket of tickets) {
    const showtime = ticket.showtimeId;
    const movie = ticket.movieId;

    // if referenced showtime is gone, expire the ticket
    if (!showtime?.startTime && !showtime?.endTime) {
      console.log("Expiring ticket with missing showtime:", ticket._id.toString());
      ticketIdsToExpire.push(ticket._id);
      continue;
    }

    let showEndTime = null;

    if (showtime?.endTime) {
      showEndTime = new Date(showtime.endTime);
    } else if (
      showtime?.startTime &&
      movie?.duration &&
      !isNaN(Number(movie.duration))
    ) {
      showEndTime = new Date(showtime.startTime);
      showEndTime.setMinutes(
        showEndTime.getMinutes() + Number(movie.duration)
      );
    } else if (showtime?.startTime) {
      showEndTime = new Date(showtime.startTime);
    }

    if (!showEndTime || Number.isNaN(showEndTime.getTime())) {
      console.log("Invalid end time, expiring ticket:", ticket._id.toString());
      ticketIdsToExpire.push(ticket._id);
      continue;
    }

    const isExpired = showEndTime < now;

    console.log("CHECKING:", {
      ticket: ticket._id.toString(),
      startTime: showtime?.startTime,
      endTime: showtime?.endTime,
      parsedEndTime: showEndTime,
      duration: movie?.duration,
      isExpired,
    });

    if (isExpired) {
      ticketIdsToExpire.push(ticket._id);
    }
  }

  console.log(
    "Expiring tickets:",
    ticketIdsToExpire.map((id) => id.toString())
  );

  if (!ticketIdsToExpire.length) return;

  await Ticket.updateMany(
    { _id: { $in: ticketIdsToExpire } },
    { $set: { status: "expired" } }
  );
};

/* =========================
   GET ACTIVE TICKETS
========================= */
exports.getMyTickets = async (req, res) => {
  try {
    await expireOldTickets();

    const tickets = await Ticket.find({
      userId: req.user._id,
      status: "active",
    })
      .populate("movieId", "title posterUrl")
      .populate({
        path: "showtimeId",
        populate: {
          path: "screenId",
          select: "name format",
        },
      })
      .populate("seats", "label row number")
      .sort({ createdAt: -1 });

    const ticketsWithQR = await Promise.all(tickets.map(serializeTicket));

    res.json({ tickets: ticketsWithQR });
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET EXPIRED TICKET HISTORY
========================= */
exports.getMyHistory = async (req, res) => {
  try {
    await expireOldTickets();

    const tickets = await Ticket.find({
      userId: req.user._id,
      status: "expired",
    })
      .populate("movieId", "title posterUrl")
      .populate({
        path: "showtimeId",
        populate: {
          path: "screenId",
          select: "name format",
        },
      })
      .populate("seats", "label row number")
      .sort({ createdAt: -1 });

    const formattedTickets = await Promise.all(tickets.map(serializeTicket));

    res.json({ tickets: formattedTickets });
  } catch (err) {
    console.error("Failed to fetch history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DOWNLOAD TICKET PDF
========================= */
exports.downloadTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.ticketId,
      userId: req.user._id,
    })
      .populate("movieId", "title posterUrl")
      .populate({
        path: "showtimeId",
        populate: {
          path: "screenId",
          select: "name format",
        },
      })
      .populate("seats", "label row number");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const fileName = `ticket-${ticket._id}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    const qrData = JSON.stringify(buildQrPayload(ticket));
    const qrImage = await QRCode.toDataURL(qrData);
    const qrBuffer = Buffer.from(
      qrImage.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );

    const showTime = getShowtimeStart(ticket.showtimeId);
    const showTimeDate = showTime ? new Date(showTime) : null;
    const screenName = getScreenName(ticket.showtimeId);
    const seatLabels = getSeatLabelArray(ticket).join(", ");

    doc
      .fontSize(24)
      .text("CinemaX", { align: "center" })
      .moveDown(2);

    doc.fontSize(16).text(`Movie: ${ticket.movieId?.title || "Unknown Movie"}`);
    doc.text(`Screen: ${screenName}`);
    doc.text(`Date: ${showTimeDate ? showTimeDate.toLocaleDateString() : "N/A"}`);
    doc.text(
      `Time: ${showTimeDate
        ? showTimeDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
        : "N/A"
      }`
    );

    doc.moveDown();
    doc.text(`Seats: ${seatLabels}`);
    doc.moveDown();
    doc.text(`Booking ID: ${ticket._id.toString().slice(-8).toUpperCase()}`);
    doc.moveDown(2);

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
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};

/* =========================
   CONVERT BOOKING TO TICKET
========================= */
exports.createTicketFromBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const ticket = await Ticket.create({
      userId: booking.user,
      movieId: booking.movie,
      showtimeId: booking.showtime,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      foods: booking.foods || [],
      status: "active",
    });

    await booking.deleteOne();

    res.json({ message: "Ticket purchased successfully", ticket });
  } catch (err) {
    console.error("Create ticket from booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET SINGLE TICKET
========================= */
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.ticketId,
      userId: req.user._id,
    })
      .populate("movieId", "title posterUrl")
      .populate({
        path: "showtimeId",
        populate: {
          path: "screenId",
          select: "name format",
        },
      })
      .populate("seats", "label row number");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const formattedTicket = await serializeTicket(ticket);

    res.json({ ticket: formattedTicket });
  } catch (err) {
    console.error("Failed to fetch ticket:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ADMIN REVENUE
========================= */
exports.getAdminRevenue = async (req, res) => {
  try {
    const tickets = await Ticket.find({});

    const totalRevenue = tickets.reduce(
      (sum, t) => sum + (t.totalPrice || 0),
      0
    );

    res.json({ revenue: totalRevenue });
  } catch (err) {
    res.status(500).json({ message: "Failed to calculate revenue" });
  }
};