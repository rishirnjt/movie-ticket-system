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
  status: {
    type: String,
    enum: ["upcoming", "showing", "archived"],
    default: "upcoming"
  }

// expiresAt: {
//   type: Date,
//   default: function () {
//     // Auto delete 24 hours after creation
//     return new Date(Date.now() + 24 * 60 * 60 * 1000);
//   },
//   index: { expires: 0 } // TTL: delete at expiresAt
// }

},
  { timestamps: true }
);

module.exports = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
