const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true
    },

    screenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: true,
      index: true
    },

    startTime: {
      type: Date,
      required: true,
      index: true
    },

    endTime: {
      type: Date,
      required: true
    },
    
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open"
    }
  },
  {
    timestamps: true
  }
);

// Prevent overlapping showtimes on same screen
showtimeSchema.index(
  { screenId: 1, startTime: 1 },
);

// Helpful for queries
showtimeSchema.index({ movieId: 1, startTime: 1 });

module.exports =
  mongoose.models.Showtime ||
  mongoose.model("Showtime", showtimeSchema);