const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Seat = require("../models/Seat");
const SeatLock = require("../models/SeatLock");
const Food = require("../models/Food");

const { sendReservationEmail, sendPurchaseEmail } = require("../utils/sendEmail");
const calculateTicketPrice = require("../utils/calculateTicketPrice");

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
};

const buildFoodSnapshotAndTotal = async (foods = []) => {
  const foodSnapshots = [];
  let foodTotal = 0;

  for (const item of foods) {
    if (!item.foodId || !mongoose.Types.ObjectId.isValid(item.foodId)) {
      throw new Error("Invalid food id");
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Invalid food quantity");
    }

    const foodDoc = await Food.findById(item.foodId);

    if (!foodDoc) {
      throw new Error("Food item not found");
    }

    if (foodDoc.available === false) {
      throw new Error(`${foodDoc.name} is not available`);
    }

    const lineTotal = foodDoc.price * quantity;
    foodTotal += lineTotal;

    foodSnapshots.push({
      foodId: foodDoc._id,
      name: foodDoc.name,
      category: foodDoc.category,
      image: foodDoc.image,
      price: foodDoc.price, // snapshot price
      quantity,
      lineTotal,
    });
  }

  return { foodSnapshots, foodTotal };
};

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

    const seatPrice = await calculateTicketPrice(showtime.startTime);
    const seatTotal = seats.length * seatPrice;

    const { foodSnapshots, foodTotal } = await buildFoodSnapshotAndTotal(foods);

    const totalPrice = seatTotal + foodTotal;

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      foods: foodSnapshots,
      pricePerSeat: seatPrice,
      seatTotal,
      foodTotal,
      totalPrice,
      status: "holding",
      reservationExpiresAt: lockExpiry,
    });

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
    res.status(500).json({ message: err.message || "Seat hold failed" });
  }
};

/* =========================
   BUY (DIRECT HOLD)
========================= */
exports.buyBooking = async (req, res) => {
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

    const seatPrice = await calculateTicketPrice(showtime.startTime);
    const seatTotal = seats.length * seatPrice;

    const { foodSnapshots, foodTotal } = await buildFoodSnapshotAndTotal(foods);

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      foods: foodSnapshots,
      pricePerSeat: seatPrice,
      seatTotal,
      foodTotal,
      totalPrice: seatTotal + foodTotal,
      status: "holding",
      reservationExpiresAt: lockExpiry,
    });

    await SeatLock.deleteMany({
      userId: req.user._id,
      showtimeId,
      seatId: { $in: seats },
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ message: err.message || "Buy failed" });
  }
};

/* =========================
   ADD FOODS TO BOOKING
========================= */
exports.addFoodsToBooking = async (req, res) => {
  try {
    const { foods = [] } = req.body;

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

    const showtime = await Showtime.findById(booking.showtime);

    if (!showtime || !showtime.startTime) {
      return res.status(500).json({ message: "Showtime not found" });
    }

    const seatPrice = booking.pricePerSeat || await calculateTicketPrice(showtime.startTime);
    const seatTotal = booking.seats.length * seatPrice;

    const { foodSnapshots, foodTotal } = await buildFoodSnapshotAndTotal(foods);

    booking.foods = foodSnapshots;
    booking.pricePerSeat = seatPrice;
    booking.seatTotal = seatTotal;
    booking.foodTotal = foodTotal;
    booking.totalPrice = seatTotal + foodTotal;

    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Add foods error:", err);
    res.status(500).json({ message: err.message || "Failed to add foods" });
  }
};

/* =========================
   CHECKOUT
========================= */
exports.checkoutBooking = async (req, res) => {
  try {
    const { pointsToRedeem = 0 } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (
      !booking.reservationExpiresAt ||
      booking.reservationExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "Payment expired" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let redeemedPoints = 0;
    let discountAmount = 0;

    if (pointsToRedeem > 0) {
      if (!Number.isInteger(pointsToRedeem) || pointsToRedeem < 0) {
        return res.status(400).json({ message: "Invalid points value" });
      }

      if (pointsToRedeem % 50 !== 0) {
        return res.status(400).json({
          message: "Points must be redeemed in multiples of 50",
        });
      }

      if (user.loyaltyPoints < pointsToRedeem) {
        return res.status(400).json({
          message: "Not enough loyalty points",
        });
      }

      discountAmount = pointsToRedeem;

      const maxDiscount = Math.floor(booking.totalPrice * 0.5);
      if (discountAmount > maxDiscount) {
        return res.status(400).json({
          message: `You can redeem up to Rs. ${maxDiscount} for this booking`,
        });
      }

      redeemedPoints = pointsToRedeem;
    }

    const finalTotal = Math.max(0, booking.totalPrice - discountAmount);

    booking.status = "confirmed";
    booking.reservationExpiresAt = null;
    booking.totalPrice = finalTotal;
    booking.discountAmount = discountAmount;
    booking.redeemedPoints = redeemedPoints;
    await booking.save();

    const ticket = await Ticket.create({
      userId: booking.user,
      movieId: booking.movie._id,
      showtimeId: booking.showtime._id,
      seats: booking.seats,
      foods: booking.foods || [],
      pricePerSeat: booking.pricePerSeat || 0,
      seatTotal: booking.seatTotal || 0,
      foodTotal: booking.foodTotal || 0,
      discountAmount,
      redeemedPoints,
      totalPrice: finalTotal,
      status: "active",
    });

    const seatDocs = await Seat.find({ _id: { $in: booking.seats } });
    const seatLabels = seatDocs.map((s) => s.label).join(", ");

    if (redeemedPoints > 0) {
      user.loyaltyPoints -= redeemedPoints;
    }

    let earnedPoints = 10;

    if (booking.foods && booking.foods.length > 0) {
      earnedPoints += 5;
    }

    user.loyaltyPoints += earnedPoints;
    user.ticketsPurchasedCount += booking.seats.length;

    while (user.ticketsPurchasedCount >= 5) {
      user.freePopcornCount += 1;
      user.ticketsPurchasedCount -= 5;
    }

    if (user.loyaltyPoints >= 250) {
      user.loyaltyTier = "Gold";
    } else if (user.loyaltyPoints >= 100) {
      user.loyaltyTier = "Silver";
    } else {
      user.loyaltyTier = "Bronze";
    }

    await user.save();

    try {
      await sendPurchaseEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(booking.showtime.startTime).toLocaleDateString(),
        time: new Date(booking.showtime.startTime).toLocaleTimeString(),
        seats: seatLabels,
        totalPaid: finalTotal,
        ticketId: ticket._id,
      });
    } catch (err) {
      console.error("Email failed:", err);
    }

    res.json({
      message: "Payment successful",
      booking,
      ticket,
      loyalty: {
        redeemedPoints,
        discountAmount,
        earnedPoints,
        totalPoints: user.loyaltyPoints,
        tier: user.loyaltyTier,
        freePopcornCount: user.freePopcornCount,
        ticketsRemainingForPopcorn: 5 - user.ticketsPurchasedCount,
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: err.message || "Checkout failed" });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      user: req.user._id,
      status: "holding",
      reservationExpiresAt: { $gt: now },
    })
      .populate("movie")
      .populate({
        path: "showtime",
        populate: {
          path: "screenId",
          select: "name screenName",
        },
      })
      .populate("seats", "label row number seatNumber name")
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
    const booking = await Booking.findById(req.params.id);

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