const mongoose = require("mongoose");

const bookingFoodSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["food", "drink"],
      default: "food",
    },
    image: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },

    seats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      },
    ],

    pricePerSeat: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    seatTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    foodTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    foods: [bookingFoodSchema],

    pointsToRedeem: {
      type: Number,
      default: 0,
      min: 0,
    },

    redeemedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    loyaltyProcessed: {
      type: Boolean,
      default: false,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["holding", "confirmed", "cancelled", "expired", "completed"],
      default: "holding",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    reservedAt: {
      type: Date,
      default: Date.now,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    reservationExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);