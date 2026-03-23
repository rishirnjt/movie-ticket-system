const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

/* =========================
   SEARCH MOVIES
========================= */
exports.searchMovies = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) return res.json([]);

    const movies = await Movie.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } },
      ],
    }).limit(12);

    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

//Coming Soon
exports.getComingSoon = async (req, res) => {
  try {
    const now = new Date();

    const movies = await Movie.find({
      movieStartDate: { $exists: true, $gt: now },
    })
      .sort({ movieStartDate: 1 })
      .lean();

    res.json(movies);
  } catch (err) {
    console.error("Coming soon error:", err);
    res.status(500).json({ message: "Error fetching coming soon movies" });
  }
};

//Now Showing
exports.getNowShowing = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const movies = await Movie.find({
      movieStartDate: { $lte: today },
      movieEndDate: { $gte: today },
    }).lean();

    const movieIds = movies.map((m) => m._id);

    const showtimes = await Showtime.find({
      movieId: { $in: movieIds },
      startTime: { $gte: now },
    })
      .populate("screenId", "name format")
      .sort({ startTime: 1 })
      .lean();

    const moviesWithShowtimes = movies
      .map((movie) => {
        const movieShowtimes = showtimes.filter(
          (st) => st.movieId.toString() === movie._id.toString()
        );

        return {
          ...movie,
          showtimes: movieShowtimes,
        };
      })

    res.json(moviesWithShowtimes);
  } catch (err) {
    console.error("Now showing error:", err);
    res.status(500).json({ message: "Error fetching now showing movies" });
  }
};
/* =========================
   GET ALL MOVIES
========================= */
exports.getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    }).lean();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error fetching movies" });
  }
};

/* =========================
   GET SINGLE MOVIE + SHOWTIMES
========================= */
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).lean();

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const showtimes = await Showtime.find({ movieId: movie._id })
      .populate("screenId", "name format")
      .sort({ startTime: 1 })
      .lean();

    res.json({
      ...movie,
      showtimes,
    });
  } catch (err) {
    console.error("Get movie by id error:", err);
    res.status(500).json({ message: "Error fetching movie details" });
  }
};

/* =========================
   ADMIN: GET ALL MOVIES
========================= */
exports.getAllMoviesAdmin = async (req, res) => {
  try {
    const movies = await Movie.find().lean();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Error fetching movies for admin" });
  }
};

/* =========================
   RECENT MOVIES
========================= */
exports.getRecentMovies = async (req, res) => {
  try {
    const movies = await Movie.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json(movies);
  } catch (err) {
    console.error("Recent movies error:", err);
    res.status(500).json([]);
  }
};

/* =========================
   CREATE MOVIE
========================= */
exports.createMovie = async (req, res) => {
  try {
    const data = req.body;

    const movie = await Movie.create({
      ...data,
      releaseDate: data.releaseDate ? new Date(`${data.releaseDate}T00:00:00`) : null,
      movieStartDate: data.movieStartDate ? new Date(`${data.movieStartDate}T00:00:00`) : null,
      movieEndDate: data.movieEndDate ? new Date(`${data.movieEndDate}T23:59:59`) : null,
      isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    });

    res.status(201).json(movie);
  } catch (err) {
    console.error("Create movie error:", err);
    res.status(500).json({ message: "Failed to create movie" });
  }
};

//Update movie
exports.updateMovie = async (req, res) => {
  try {
    const data = req.body;

    const updatePayload = {
      ...data,
      releaseDate: data.releaseDate ? new Date(`${data.releaseDate}T00:00:00`) : null,
      movieStartDate: data.movieStartDate ? new Date(`${data.movieStartDate}T00:00:00`) : null,
      movieEndDate: data.movieEndDate ? new Date(`${data.movieEndDate}T23:59:59`) : null,
    };

    const movie = await Movie.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.json(movie);
  } catch (err) {
    console.error("Update movie error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.errors,
      });
    }

    res.status(500).json({ message: "Update failed" });
  }
};

/* =========================
   DELETE MOVIE + SHOWTIMES
========================= */
exports.deleteMovie = async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    await Showtime.deleteMany({ movieId: req.params.id });

    res.json({ message: "Movie and showtimes deleted" });
  } catch (err) {
    console.error("Delete movie error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};