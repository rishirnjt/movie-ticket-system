

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
        { movieStartDate: { $lte: now } },
        { movieEndDate: { $gte: now } },
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
        { movieEndDate: { $lt: now } },
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
    const movies = await Movie.find().sort({ createdAt: -1 }).lean();
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

    const { error, parsedReleaseDate, parsedStartDate, parsedEndDate } =
      validateMovieDates(data);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const movie = await Movie.create({
      title: data.title?.trim(),
      description: data.description?.trim(),
      genre: data.genre?.trim(),
      posterUrl: data.posterUrl || "",
      trailerUrl: data.trailerUrl?.trim() || "",
      releaseDate: parsedReleaseDate,
      duration: Number(data.duration),
      rating: data.rating || "",
      language: data.language?.trim() || "",
      movieStartDate: parsedStartDate,
      movieEndDate: parsedEndDate,
      isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    });

    res.status(201).json(movie);
  } catch (err) {
    console.error("Create movie error:", err);
    res.status(500).json({ message: "Failed to create movie" });
  }
};

exports.updateMovie = async (req, res) => {
  try {
    const data = req.body;

    const { error, parsedReleaseDate, parsedStartDate, parsedEndDate } =
      validateMovieDates(data);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const updatePayload = {
      title: data.title?.trim(),
      description: data.description?.trim(),
      genre: data.genre?.trim(),
      posterUrl: data.posterUrl || "",
      trailerUrl: data.trailerUrl?.trim() || "",
      releaseDate: parsedReleaseDate,
      duration: Number(data.duration),
      rating: data.rating || "",
      language: data.language?.trim() || "",
      movieStartDate: parsedStartDate,
      movieEndDate: parsedEndDate,
    };

    if (typeof data.isActive === "boolean") {
      updatePayload.isActive = data.isActive;
    }

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

// Soft delete movie
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({ message: "Movie deactivated successfully" });
  } catch (err) {
    console.error("Delete movie error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};