const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  genre: String,
  posterUrl: String,
  releaseDate: Date,
  duration: String, 
  rating: String,
  language: String,
  showtimes: [
    {
      hall: String,
      time: String
    },
  ],
  expiresAt: {
    type: Date,
    required: true,
  },
},
  { timestamps: true }
);

module.exports = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
