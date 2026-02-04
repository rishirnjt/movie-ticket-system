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

expiresAt: {
  type: Date,
  default: function () {
    // Auto delete 24 hours after creation
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  },
  index: { expires: 0 } // TTL: delete at expiresAt
}

},
  { timestamps: true }
);

module.exports = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
