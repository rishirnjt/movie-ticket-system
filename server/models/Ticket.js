const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
  seats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    }
  ],
    totalPrice: { type: Number, required: true },
  foods: [{
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    quantity: Number
  }],
  status: {
    type: String,
    enum: ["active", "expired"],
    default: "active"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", ticketSchema);
