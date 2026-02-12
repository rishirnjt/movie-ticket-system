// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },

//     movie: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Movie",
//       required: true
//     },

//     showtime: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Showtime",
//       required: true
//     },

//     seats: [{ type: String, required: true }],

//     totalPrice: {
//       type: Number,
//       required: true
//     },

//     foods: [
//       {
//         name: String,
//         price: Number,
//         quantity: { type: Number, default: 1 }
//       }
//     ],

//     status: {
//       type: String,
//       enum: ["holding", "confirmed", "cancelled"],
//       default: "holding"
//     },

//     // For 5-minute hold ONLY
//     expiresAt: {
//       type: Date,
//       default: () => new Date(Date.now() + 5 * 60 * 1000)
//     },

//     // For 1-hour-before-showtime rule
//     purchaseDeadline: {
//       type: Date
//     }
//   },
//   { timestamps: true }
// );

// // TTL index
// bookingSchema.index(
//   { expiresAt: 1 },
//   { expireAfterSeconds: 0 }
// );

// module.exports =
//   mongoose.models.Booking ||
//   mongoose.model("Booking", bookingSchema);

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

    seats: [{ type: String, required: true }],

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
