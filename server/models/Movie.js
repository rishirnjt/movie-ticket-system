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
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Movie', movieSchema);
