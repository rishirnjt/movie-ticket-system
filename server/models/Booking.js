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
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      }
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
      enum: ["holding", "confirmed", "cancelled", "expired"],
      default: "holding"
    },

    // Reservation expires 1 hour before showtime
    reservationExpiresAt: {
      type: Date
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
