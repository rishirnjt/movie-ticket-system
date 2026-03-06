const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  genre: String,
  posterUrl: String,
  trailerUrl: String,
  releaseDate: Date,
  duration: String, 
  rating: String,
  language: String,

  movieStartDate: {
    type: Date,
    required: true,
  },
  movieEndDate: {
    type: Date,
    required: true,
  }

},
  { timestamps: true }
);

module.exports = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
