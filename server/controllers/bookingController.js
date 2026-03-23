const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Seat = require("../models/Seat");
const SeatLock = require("../models/SeatLock");

const { sendReservationEmail, sendPurchaseEmail } = require("../utils/sendEmail");

const verifyUserOwnSeatLocks = async (userId, showtimeId, seatIds) => {
  const now = new Date();

  const locks = await SeatLock.find({
    userId,
    showtimeId,
    seatId: { $in: seatIds },
    expiresAt: { $gt: now },
  }).select("seatId expiresAt");

  if (locks.length !== seatIds.length) return null;

  const lockSet = new Set(locks.map((l) => l.seatId.toString()));
  const allOwned = seatIds.every((id) => lockSet.has(id.toString()));

  if (!allOwned) return null;

  const earliestExpiry = new Date(
    Math.min(...locks.map((l) => new Date(l.expiresAt).getTime()))
  );

  return earliestExpiry;
}



/* =========================
   HOLD BOOKING
========================= */
exports.holdBooking = async (req, res) => {
  try {
    const { movieId, showtimeId, seats, foods = [] } = req.body;

    if (!movieId || !showtimeId || !seats?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const invalidSeat = seats.some((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidSeat) {
      return res.status(400).json({ message: "Invalid seat id" });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime || !showtime.startTime) {
      return res.status(500).json({ message: "Showtime startTime missing" });
    }

    const lockExpiry = await verifyUserOwnSeatLocks(
      req.user._id,
      showtimeId,
      seats
    );

    if (!lockExpiry) {
      return res.status(409).json({
        message: "Selected seats are not locked by this user or lock expired",
      });
    }

    const now = new Date();

    // extra safety against confirmed sales
    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      status: "confirmed",
    });

    const soldTicket = await Ticket.findOne({
      movieId,
      showtimeId,
      seats: { $in: seats },
      status: "active",
    });

    if (existing || soldTicket) {
      return res.status(409).json({ message: "Seats already taken" });
    }

    const seatPrice = 300;
    const foodTotal = foods.reduce((sum, f) => sum + f.price * f.quantity, 0);
    const totalPrice = seats.length * seatPrice + foodTotal;

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      foods,
      totalPrice,
      status: "holding",
      reservationExpiresAt: lockExpiry,
    });

    // remove locks once booking is created
    await SeatLock.deleteMany({
      userId: req.user._id,
      showtimeId,
      seatId: { $in: seats },
    });

    await booking.populate("movie showtime");

    const seatDocs = await Seat.find({ _id: { $in: booking.seats } }).sort({
      row: 1,
      number: 1,
    });
    const seatLabels = seatDocs.map((s) => s.label).join(", ");

    const user = await User.findById(req.user._id);

    try {
      await sendReservationEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(showtime.startTime).toLocaleDateString(),
        time: new Date(showtime.startTime).toLocaleTimeString(),
        seats: seatLabels,
        total: booking.totalPrice,
      });
    } catch (err) {
      console.error("Email failed:", err);
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error("Hold error:", err);
    res.status(500).json({ message: "Seat hold failed" });
  }
};

/* =========================
   BUY (DIRECT HOLD)
========================= */
exports.buyBooking = async (req, res) => {
  try {
    const { movieId, showtimeId, seats } = req.body;

    if (!movieId || !showtimeId || !seats?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const invalidSeat = seats.some((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidSeat) {
      return res.status(400).json({ message: "Invalid seat id" });
    }

    //  verify seats are locked by this user
    const lockExpiry = await verifyUserOwnSeatLocks(
      req.user._id,
      showtimeId,
      seats
    );

    if (!lockExpiry) {
      return res.status(409).json({
        message: "Selected seats are not locked by this user or lock expired",
      });
    }

    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      status: "confirmed",
    });

    const soldTicket = await Ticket.findOne({
      movieId,
      showtimeId,
      seats: { $in: seats },
      status: "active",
    });

    if (existing || soldTicket) {
      return res.status(409).json({ message: "Seats already taken" });
    }

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      totalPrice: seats.length * 300,
      status: "holding",
      reservationExpiresAt: lockExpiry,
    });

    // remove locks once booking is created
    await SeatLock.deleteMany({
      userId: req.user._id,
      showtimeId,
      seatId: { $in: seats },
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ message: "Buy failed" });
  }
};

exports.addFoodsToBooking = async (req, res) => {
  try {
    const { foods } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "holding" && booking.status !== "confirmed") {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    booking.foods = foods || [];

    const foodTotal = (foods || []).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const seatTotal = booking.seats.length * 300;
    booking.totalPrice = seatTotal + foodTotal;

    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Add foods error:", err);
    res.status(500).json({ message: "Failed to add foods" });
  }
};

/* =========================
   CHECKOUT
========================= */
exports.checkoutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("showtime");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!booking.reservationExpiresAt || booking.reservationExpiresAt < new Date()) {
      return res.status(400).json({ message: "Payment expired" });
    }

    booking.status = "confirmed";
    booking.reservationExpiresAt = null;
    await booking.save();

    const ticket = await Ticket.create({
      userId: booking.user,
      movieId: booking.movie._id,
      showtimeId: booking.showtime._id,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      foods: booking.foods || [],
      status: "active",
    });

    const seatDocs = await Seat.find({ _id: { $in: booking.seats } });
    const seatLabels = seatDocs.map(s => s.label).join(", ");

    const user = await User.findById(req.user._id);

    try {
      await sendPurchaseEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(booking.showtime.startTime).toLocaleDateString(),
        time: new Date(booking.showtime.startTime).toLocaleTimeString(),
        seats: seatLabels,
        totalPaid: booking.totalPrice,
        ticketId: ticket._id,
      });
    } catch (err) {
      console.error("Email failed:", err);
    }

    res.json({ message: "Payment successful", booking, ticket });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Checkout failed" });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      user: req.user._id,
      $or: [
        { status: "holding", reservationExpiresAt: { $gt: now } },
        { status: "confirmed" },
      ],
    })
      .populate("movie")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate({
        path: "showtime",
        populate: {
          path: "screenId",
          select: "name format",
        },
      })
      .populate("seats", "label row number");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};


/* =========================
   CANCEL
========================= */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.status = "cancelled";
    booking.reservationExpiresAt = null;

    await booking.save();

    res.json({ message: "Booking cancelled" });

  } catch (err) {
    res.status(500).json({ message: "Cancel failed" });
  }
};

/* =========================
   EXPIRE
========================= */
exports.expireBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id); // ✅ fixed

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "holding") {
      return res.status(400).json({ message: "Cannot expire booking" });
    }

    booking.status = "cancelled";
    booking.reservationExpiresAt = null;

    await booking.save();

    res.json({ message: "Booking expired" });

  } catch (err) {
    console.error("Expire error:", err);
    res.status(500).json({ message: "Failed to expire booking" });
  }
};

/* =========================
   GET BOOKED SEATS
========================= */
exports.getBookedSeats = async (req, res) => {
  try {
    const { movieId, showtimeId } = req.params;
    const now = new Date();

    const bookings = await Booking.find({
      movie: movieId,
      showtime: showtimeId,
      $or: [
        { status: "confirmed" },
        { status: "holding", reservationExpiresAt: { $gt: now } },
      ],
    });

    const tickets = await Ticket.find({
      movieId,
      showtimeId,
      status: "active",
    });

    const seatLocks = await SeatLock.find({
      showtimeId,
      expiresAt: { $gt: now },
    });

    const heldSeatsFromBookings = bookings
      .filter((b) => b.status === "holding" && b.reservationExpiresAt > now)
      .flatMap((b) => b.seats.map((s) => s.toString()));

    const heldSeatsFromLocks = seatLocks.map((l) => l.seatId.toString());

    const soldSeats = [
      ...bookings
        .filter((b) => b.status === "confirmed")
        .flatMap((b) => b.seats.map((s) => s.toString())),
      ...tickets.flatMap((t) => t.seats.map((s) => s.toString())),
    ];

    const heldSeats = [...new Set([...heldSeatsFromBookings, ...heldSeatsFromLocks])];

    res.json({ soldSeats, heldSeats });
  } catch (err) {
    console.error("Failed to fetch seats:", err);
    res.status(500).json({ message: "Failed to fetch seats" });
  }
};

/* =========================
   ADMIN
========================= */
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate({
        path: "showtime",
        populate: {
          path: "screenId",
          select: "name format",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const allSeatIds = bookings.flatMap((b) => b.seats || []);
    const uniqueSeatIds = [...new Set(allSeatIds.map(String))];

    const seatDocs = await Seat.find({ _id: { $in: uniqueSeatIds } })
      .select("_id label row number")
      .lean();

    const seatMap = new Map(
      seatDocs.map((seat) => [seat._id.toString(), seat.label])
    );

    const bookingsWithSeatLabels = bookings.map((booking) => ({
      ...booking,
      seatLabels: (booking.seats || []).map(
        (seatId) => seatMap.get(String(seatId)) || String(seatId)
      ),
    }));

    res.json(bookingsWithSeatLabels);
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};