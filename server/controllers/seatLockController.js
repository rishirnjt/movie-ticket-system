const mongoose = require("mongoose");
const SeatLock = require("../models/SeatLock");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");

const LOCK_MINUTES = 10;

const getExpiryTime = () =>
  new Date(Date.now() + LOCK_MINUTES * 60 * 1000);

const cleanupExpiredLocks = async () => {
  await SeatLock.deleteMany({ expiresAt: { $lte: new Date() } });
};

const getSoldSeatIds = async (showtimeId) => {
  const now = new Date();

  const activeBookings = await Booking.find({
    showtime: showtimeId,
    $or: [
      { status: "confirmed" },
      { status: "holding", reservationExpiresAt: { $gt: now } },
    ],
  }).select("seats");

  const activeTickets = await Ticket.find({
    showtimeId,
    status: "active",
  }).select("seats");

  const soldSeatIds = [
    ...activeBookings.flatMap((b) => b.seats.map((s) => s.toString())),
    ...activeTickets.flatMap((t) => t.seats.map((s) => s.toString())),
  ];

  return [...new Set(soldSeatIds)];
};

exports.getSeatLockStatus = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
      return res.status(400).json({ message: "Invalid showtimeId" });
    }

    await cleanupExpiredLocks();

    const now = new Date();

    const [locks, soldSeatIds] = await Promise.all([
      SeatLock.find({
        showtimeId,
        expiresAt: { $gt: now },
      }).select("seatId userId expiresAt"),
      getSoldSeatIds(showtimeId),
    ]);

    const lockedSeatIds = locks.map((l) => l.seatId.toString());

    const myLocks = locks.filter(
      (l) => l.userId.toString() === req.user._id.toString()
    );

    const myLockedSeatIds = myLocks.map((l) => l.seatId.toString());

    const myExpiresAt =
      myLocks.length > 0
        ? new Date(
            Math.min(...myLocks.map((l) => new Date(l.expiresAt).getTime()))
          )
        : null;

    res.json({
      soldSeatIds,
      lockedSeatIds,
      myLockedSeatIds,
      expiresAt: myExpiresAt,
    });
  } catch (err) {
    console.error("Get seat lock status error:", err);
    res.status(500).json({ message: "Failed to fetch seat status" });
  }
};

exports.lockSeat = async (req, res) => {
  try {
    const { showtimeId, seatId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(showtimeId) ||
      !mongoose.Types.ObjectId.isValid(seatId)
    ) {
      return res.status(400).json({ message: "Invalid showtimeId or seatId" });
    }

    await cleanupExpiredLocks();

    const [showtime, seat] = await Promise.all([
      Showtime.findById(showtimeId).select("screenId"),
      Seat.findById(seatId).select("screenId"),
    ]);

    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    if (!showtime.screenId || !seat.screenId) {
      return res.status(400).json({ message: "Screen mapping missing" });
    }

    if (seat.screenId.toString() !== showtime.screenId.toString()) {
      return res.status(400).json({
        message: "Seat does not belong to this showtime screen",
      });
    }

    const [bookingConflict, ticketConflict] = await Promise.all([
      Booking.exists({
        showtime: showtimeId,
        $or: [
          { status: "confirmed" },
          { status: "holding", reservationExpiresAt: { $gt: new Date() } },
        ],
        seats: seatId,
      }),
      Ticket.exists({
        showtimeId,
        status: "active",
        seats: seatId,
      }),
    ]);

    if (bookingConflict || ticketConflict) {
      return res.status(409).json({ message: "Seat already sold" });
    }

    const existingLock = await SeatLock.findOne({ showtimeId, seatId });

    if (existingLock) {
      if (existingLock.userId.toString() === req.user._id.toString()) {
        existingLock.expiresAt = getExpiryTime();
        await existingLock.save();

        return res.json({
          message: "Seat lock refreshed",
          seatId: existingLock.seatId.toString(),
          expiresAt: existingLock.expiresAt,
        });
      }

      return res.status(409).json({
        message: "Seat already locked by another user",
      });
    }

    const lock = await SeatLock.create({
      showtimeId,
      seatId,
      userId: req.user._id,
      expiresAt: getExpiryTime(),
    });

    res.status(201).json({
      message: "Seat locked",
      seatId: lock.seatId.toString(),
      expiresAt: lock.expiresAt,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Seat already locked" });
    }

    console.error("Lock seat error:", err);
    res.status(500).json({ message: "Failed to lock seat" });
  }
};

exports.unlockSeat = async (req, res) => {
  try {
    const { showtimeId, seatId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(showtimeId) ||
      !mongoose.Types.ObjectId.isValid(seatId)
    ) {
      return res.status(400).json({ message: "Invalid showtimeId or seatId" });
    }

    const result = await SeatLock.deleteOne({
      showtimeId,
      seatId,
      userId: req.user._id,
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Seat lock not found" });
    }

    res.json({ message: "Seat unlocked", seatId });
  } catch (err) {
    console.error("Unlock seat error:", err);
    res.status(500).json({ message: "Failed to unlock seat" });
  }
};

exports.clearMySeatLocks = async (req, res) => {
  try {
    const { showtimeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
      return res.status(400).json({ message: "Invalid showtimeId" });
    }

    await SeatLock.deleteMany({
      showtimeId,
      userId: req.user._id,
    });

    res.json({ message: "All seat locks cleared" });
  } catch (err) {
    console.error("Clear seat locks error:", err);
    res.status(500).json({ message: "Failed to clear seat locks" });
  }
};