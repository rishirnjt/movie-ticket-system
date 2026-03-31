const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

const getDayStart = (value = new Date()) => {
  return new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
    0, 0, 0, 0
  ));
};

const getDayEnd = (value = new Date()) => {
  return new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
    23, 59, 59, 999
  ));
};

const parseDateStart = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseDateEnd = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Search Movie
exports.searchMovies = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) return res.json([]);

    const movies = await Movie.find({
      $and: [
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { genre: { $regex: query, $options: "i" } },
          ],
        },
        {
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
        },
      ],
    }).limit(12);

    res.json(movies);
  } catch (error) {
    console.error("Search movie error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

// Coming Soon
exports.getComingSoon = async (req, res) => {
  try {
    const todayStart = getDayStart();

    const movies = await Movie.find({
      $and: [
        { movieStartDate: { $exists: true, $gt: todayStart } },
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
      ],
    })
      .sort({ movieStartDate: 1, title: 1 })
      .lean();

    res.json(movies);
  } catch (err) {
    console.error("Coming soon error:", err);
    res.status(500).json({ message: "Error fetching coming soon movies" });
  }
};
// Now Showing
exports.getNowShowing = async (req, res) => {
  try {
    const todayStart = getDayStart();
    const todayEnd = getDayEnd();

    const movies = await Movie.find({
      $and: [
        { movieStartDate: { $lte: todayEnd } },
        { movieEndDate: { $gte: todayStart } },
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
      ],
    })
      .sort({ movieStartDate: 1, title: 1 })
      .lean();

    if (!movies.length) {
      return res.json([]);
    }

    const movieIds = movies.map((m) => m._id);

    const showtimes = await Showtime.find({
      movieId: { $in: movieIds },
      startTime: { $gte: todayStart },
    })
      .populate("screenId", "name format")
      .sort({ startTime: 1 })
      .lean();

    const moviesWithShowtimes = movies.map((movie) => {
      const movieShowtimes = showtimes.filter(
        (st) => st.movieId.toString() === movie._id.toString()
      );

      return {
        ...movie,
        showtimes: movieShowtimes,
      };
    });

    res.json(moviesWithShowtimes);
  } catch (err) {
    console.error("Now showing error:", err);
    res.status(500).json({ message: "Error fetching now showing movies" });
  }
};

// Archived Movies
exports.getArchivedMovies = async (req, res) => {
  try {
    const todayStart = getDayStart();

    const movies = await Movie.find({
      $and: [
        { movieEndDate: { $lt: todayStart } },
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
      ],
    })
      .sort({ movieEndDate: -1, title: 1 })
      .lean();

    res.json(movies);
  } catch (err) {
    console.error("Archive movie error:", err);
    res.status(500).json({ message: "Error fetching archived movies" });
  }
};

// Get all public movies
exports.getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    }).lean();

    res.json(movies);
  } catch (err) {
    console.error("Get all movies error:", err);
    res.status(500).json({ message: "Error fetching movies" });
  }
};

// Get single movie + showtimes
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

// Admin: Get all movies
exports.getAllMoviesAdmin = async (req, res) => {
  try {
    const movies = await Movie.find().lean();
    res.json(movies);
  } catch (err) {
    console.error("Get all movies admin error:", err);
    res.status(500).json({ message: "Error fetching movies for admin" });
  }
};

// Recent Movies
exports.getRecentMovies = async (req, res) => {
  try {
    const movies = await Movie.find({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json(movies);
  } catch (err) {
    console.error("Recent movies error:", err);
    res.status(500).json([]);
  }
};

// Create Movie
exports.createMovie = async (req, res) => {
  try {
    const data = req.body;

    const movie = await Movie.create({
      ...data,
      releaseDate: parseDateStart(data.releaseDate),
      movieStartDate: parseDateStart(data.movieStartDate),
      movieEndDate: parseDateEnd(data.movieEndDate),
      isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    });

    res.status(201).json(movie);
  } catch (err) {
    console.error("Create movie error:", err);
    res.status(500).json({ message: "Failed to create movie" });
  }
};

// Update Movie
exports.updateMovie = async (req, res) => {
  try {
    const data = req.body;

    const updatePayload = {
      ...data,
      releaseDate: parseDateStart(data.releaseDate),
      movieStartDate: parseDateStart(data.movieStartDate),
      movieEndDate: parseDateEnd(data.movieEndDate),
    };

    const movie = await Movie.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

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

// Delete movie and showtimes
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