const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    genre: {
      type: String,
      trim: true,
    },

    posterUrl: {
      type: String,
      trim: true,
    },

    trailerUrl: {
      type: String,
      trim: true,
    },

    releaseDate: {
      type: Date,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    rating: {
      type: String,
      trim: true,
      default: "",
    },

    language: {
      type: String,
      trim: true,
      default: "",
    },

    movieStartDate: {
      type: Date,
      required: true,
    },

    movieEndDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Movie || mongoose.model("Movie", movieSchema);