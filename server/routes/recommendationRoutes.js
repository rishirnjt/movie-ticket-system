// // routes/recommendationRoutes.js
// const express = require("express");
// const router = express.Router();
// const Booking = require("../models/Booking");
// const Movie = require("../models/Movie");
// const { protect } = require("../middleware/authMiddleware");

// // GET /api/recommendations
// router.get("/", protect(), async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const bookings = await Booking.find({ user: userId }).populate("movie");

//     // If no bookings → return latest active movies
//     if (!bookings.length) {
//       const trending = await Movie.find({
//         status: { $in: ["upcoming", "showing"] }
//       })
//         .sort({ createdAt: -1 })
//         .limit(8);

//       return res.json(trending);
//     }

//     const genreCount = {};
//     const watchedMovieIds = [];

//     bookings.forEach((booking) => {
//       if (!booking.movie) return;

//       watchedMovieIds.push(booking.movie._id);

//       const genres = Array.isArray(booking.movie.genre)
//         ? booking.movie.genre
//         : [booking.movie.genre];

//       genres.forEach((g) => {
//         if (g) genreCount[g] = (genreCount[g] || 0) + 1;
//       });
//     });

//     const favoriteGenres = Object.keys(genreCount).sort(
//       (a, b) => genreCount[b] - genreCount[a]
//     );

//     let recommendedMovies = await Movie.find({
//       genre: { $in: favoriteGenres.slice(0, 2) },
//       _id: { $nin: watchedMovieIds },
//       status: { $in: ["upcoming", "showing"] }
//     }).limit(8);

//     // If nothing found → fallback
//     if (!recommendedMovies.length) {
//       recommendedMovies = await Movie.find({
//         status: { $in: ["upcoming", "showing"] }
//       })
//         .sort({ createdAt: -1 })
//         .limit(8);
//     }

//     return res.json(recommendedMovies);

//   } catch (error) {
//     console.error("Recommendation route error:", error);
//     return res.status(500).json({ message: "Recommendation error" });
//   }
// });

// module.exports = router;