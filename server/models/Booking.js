const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true
    },

    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true
    },

    seats: [
      { type: String, required: true }
    ],

    totalPrice: {
      type: Number,
      required: true
    },

    foods: [
      {
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 }
      }
    ],

    status: {
      type: String,
      enum: ["reserved", "confirmed", "cancelled"],
      default: "reserved"
    },

    // seat hold timer (5 minutes)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000)
    }
  },
  { timestamps: true }
);

/* 🔥 Prevent double booking */
bookingSchema.index(
  { movie: 1, showtime: 1, seats: 1 },
  { unique: true }
);

/*  Auto delete expired reservations */
bookingSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports =
  mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
