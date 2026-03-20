const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { sendReservationEmail, sendPurchaseEmail } = require("../utils/sendEmail");

// Hold booking
exports.holdBooking = async (req, res) => {
  try {
    const { movieId, showtimeId, seats, foods = [] } = req.body;

    if (!movieId || !showtimeId || !seats?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime || !showtime.startTime) {
      return res.status(500).json({ message: "Showtime start time is missing in database" });
    }

    const showtimeDate = new Date(showtime.startTime);
    const oneHourBefore = new Date(showtimeDate.getTime() - 60 * 60 * 1000);

    if (new Date() > oneHourBefore) {
      return res.status(400).json({ message: "Booking closed (1 hour before showtime)" });
    }

    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      $or: [
        { status: "confirmed" },
        { status: "holding", reservationExpiresAt: { $gt: new Date() } },
      ],
    });

    if (existing) {
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
      reservationExpiresAt: oneHourBefore,
    });

    await booking.populate("movie showtime");

    const user = await User.findById(req.user._id);
    try {
      await sendReservationEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(showtime.startTime).toLocaleDateString(),
        time: new Date(showtime.startTime).toLocaleTimeString(),
        seats: booking.seats.join(", "),
        total: booking.totalPrice,
      });
    } catch (emailErr) {
      console.error("Email failed but booking held:", emailErr);
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error("Hold error:", err);
    res.status(500).json({ message: "Seat hold failed" });
  }
};

// Buy
exports.buyBooking = async (req, res) => {
  try {
    const { movieId, showtimeId, seats } = req.body;

    if (!movieId || !showtimeId || !seats?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    const existing = await Booking.findOne({
      movie: movieId,
      showtime: showtimeId,
      seats: { $in: seats },
      $or: [
        { status: "confirmed" },
        { status: "holding", reservationExpiresAt: { $gt: new Date() } },
      ],
    });

    if (existing) {
      return res.status(409).json({ message: "Seats already taken" });
    }

    const paymentWindow = new Date(Date.now() + 10 * 60 * 1000);

    const booking = await Booking.create({
      user: req.user._id,
      movie: movieId,
      showtime: showtimeId,
      seats,
      totalPrice: seats.length * 300,
      status: "holding",
      reservationExpiresAt: paymentWindow,
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Buy error:", err);
    res.status(500).json({ message: "Buy failed", error: err.message });
  }
};

// Add foods
exports.addFoodsToBooking = async (req, res) => {
  try {
    const { foods } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "confirmed" && booking.status !== "holding") {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    booking.foods = foods;

    const foodTotal = foods.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    booking.totalPrice += foodTotal;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Add foods error:", err);
    res.status(500).json({ message: "Failed to add foods" });
  }
};

// Checkout
exports.checkoutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("showtime")
      .populate("movie");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!booking.reservationExpiresAt || booking.reservationExpiresAt < new Date()) {
      return res.status(400).json({ message: "Payment window expired" });
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

    const user = await User.findById(req.user._id);

    try {
      await sendPurchaseEmail(user.email, {
        movie: booking.movie.title,
        date: new Date(booking.showtime.startTime).toLocaleDateString(),
        time: new Date(booking.showtime.startTime).toLocaleTimeString(),
        seats: booking.seats.join(", "),
        foods: booking.foods || [],
        totalPaid: booking.totalPrice,
        ticketId: ticket._id,
      });
    } catch (emailErr) {
      console.error("Email failed after purchase:", emailErr);
    }

    res.json({
      message: "Payment successful",
      booking,
      ticket,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Checkout failed", error: err.message });
  }
};

// Cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

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

// Get booked seats
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

    const heldSeats = bookings
      .filter(
        (b) =>
          b.status === "holding" &&
          b.reservationExpiresAt &&
          b.reservationExpiresAt > now
      )
      .flatMap((b) => b.seats);

    const soldSeatsFromBookings = bookings
      .filter((b) => b.status === "confirmed")
      .flatMap((b) => b.seats);

    const soldSeatsFromTickets = tickets.flatMap((t) => t.seats);

    const soldSeats = [...soldSeatsFromBookings, ...soldSeatsFromTickets];

    res.json({ soldSeats, heldSeats });
  } catch (err) {
    console.error("Fetch seats error:", err);
    res.status(500).json({ message: "Failed to fetch seats" });
  }
};

// My reservations
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

    const activeBookings = bookings.filter((b) => {
      return b.showtime && new Date(b.showtime.startTime) > now;
    });

    res.json(activeBookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
};

// Admin all bookings
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("movie", "title")
      .populate("showtime")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Admin single booking
exports.getSingleBookingAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("movie")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// Admin update status
exports.updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["holding", "confirmed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;

    if (status === "confirmed") {
      booking.reservationExpiresAt = null;
    }

    await booking.save();

    res.json({ message: "Status updated", booking });
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("movie")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

exports.expireBooking = async (req, res) => {
    try{
        const booking = await Booking.findById(req.param.id);

        if(!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        //only expire holding bookings
        if(booking.status !== "holding"){
            return res.status(400).json({ message: "Booking cannot be expired" });
        }

        booking.status = "cancelled";
        booking.reservationExpiresAt = null;

        await booking.save();

        res.json({ message: "Booking expired and seats released"});
    } catch (err) {
        console.error("Expire booking error:", err);
        res.status(500).json({ message: "Failed to expire booking" });
    }
};