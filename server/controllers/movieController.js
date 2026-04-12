// const Movie = require("../models/Movie");
// const Showtime = require("../models/Showtime");

// const NEPAL_OFFSET_MINUTES = 5 * 60 + 45;
// const NEPAL_OFFSET_MS = NEPAL_OFFSET_MINUTES * 60 * 1000;

// // Converts a Nepal calendar date string like "2026-04-07"
// // into the UTC instant representing Nepal 00:00:00.000
// const parseNepalDateStart = (dateStr) => {
//   if (!dateStr) return null;

//   const [year, month, day] = dateStr.split("-").map(Number);

//   return new Date(
//     Date.UTC(year, month - 1, day, 0, 0, 0, 0) - NEPAL_OFFSET_MS
//   );
// };

// // Converts a Nepal calendar date string like "2026-04-07"
// // into the UTC instant representing Nepal 23:59:59.999
// const parseNepalDateEnd = (dateStr) => {
//   if (!dateStr) return null;

//   const [year, month, day] = dateStr.split("-").map(Number);

//   return new Date(
//     Date.UTC(year, month - 1, day, 23, 59, 59, 999) - NEPAL_OFFSET_MS
//   );
// };

// // Search Movie
// exports.searchMovies = async (req, res) => {
//   try {
//     const query = req.query.q;

//     if (!query) return res.json([]);

//     const movies = await Movie.find({
//       $and: [
//         {
//           $or: [
//             { title: { $regex: query, $options: "i" } },
//             { genre: { $regex: query, $options: "i" } },
//           ],
//         },
//         {
//           $or: [{ isActive: true }, { isActive: { $exists: false } }],
//         },
//       ],
//     }).limit(12);

//     res.json(movies);
//   } catch (error) {
//     console.error("Search movie error:", error);
//     res.status(500).json({ message: "Search failed" });
//   }
// };

// exports.getComingSoon = async (req, res) => {
//   try {
//     const now = new Date();

//     const movies = await Movie.find({
//       $and: [
//         { movieStartDate: { $exists: true, $gt: now } },
//         { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
//       ],
//     })
//       .sort({ movieStartDate: 1, title: 1 })
//       .lean();

//     res.json(movies);
//   } catch (err) {
//     console.error("Coming soon error:", err);
//     res.status(500).json({ message: "Error fetching coming soon movies" });
//   }
// };

// exports.getNowShowing = async (req, res) => {
//   try {
//     const now = new Date();

//     const movies = await Movie.find({
//       $and: [
//         { movieStartDate: { $lte: now } },
//         { movieEndDate: { $gte: now } },
//         { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
//       ],
//     })
//       .sort({ movieStartDate: 1, title: 1 })
//       .lean();

//     if (!movies.length) {
//       return res.json([]);
//     }

//     const movieIds = movies.map((m) => m._id);

//     const showtimes = await Showtime.find({
//       movieId: { $in: movieIds },
//     })
//       .populate("screenId", "name format")
//       .sort({ startTime: 1 })
//       .lean();

//     const moviesWithShowtimes = movies.map((movie) => {
//       const movieShowtimes = showtimes.filter(
//         (st) => st.movieId.toString() === movie._id.toString()
//       );

//       return {
//         ...movie,
//         showtimes: movieShowtimes,
//       };
//     });

//     res.json(moviesWithShowtimes);
//   } catch (err) {
//     console.error("Now showing error:", err);
//     res.status(500).json({ message: "Error fetching now showing movies" });
//   }
// };

// exports.getArchivedMovies = async (req, res) => {
//   try {
//     const now = new Date();

//     const movies = await Movie.find({
//       $and: [
//         { movieEndDate: { $lt: now } },
//         { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
//       ],
//     })
//       .sort({ movieEndDate: -1, title: 1 })
//       .lean();

//     res.json(movies);
//   } catch (err) {
//     console.error("Archive movie error:", err);
//     res.status(500).json({ message: "Error fetching archived movies" });
//   }
// };

// // Get all public movies
// exports.getAllMovies = async (req, res) => {
//   try {
//     const movies = await Movie.find({
//       $or: [{ isActive: true }, { isActive: { $exists: false } }],
//     }).lean();

//     res.json(movies);
//   } catch (err) {
//     console.error("Get all movies error:", err);
//     res.status(500).json({ message: "Error fetching movies" });
//   }
// };

// // Get single movie + showtimes
// exports.getMovieById = async (req, res) => {
//   try {
//     const movie = await Movie.findById(req.params.id).lean();

//     if (!movie) {
//       return res.status(404).json({ message: "Movie not found" });
//     }

//     const showtimes = await Showtime.find({ movieId: movie._id })
//       .populate("screenId", "name format")
//       .sort({ startTime: 1 })
//       .lean();

//     res.json({
//       ...movie,
//       showtimes,
//     });
//   } catch (err) {
//     console.error("Get movie by id error:", err);
//     res.status(500).json({ message: "Error fetching movie details" });
//   }
// };

// // Admin: Get all movies
// exports.getAllMoviesAdmin = async (req, res) => {
//   try {
//     const movies = await Movie.find().lean();
//     res.json(movies);
//   } catch (err) {
//     console.error("Get all movies admin error:", err);
//     res.status(500).json({ message: "Error fetching movies for admin" });
//   }
// };

// // Recent Movies
// exports.getRecentMovies = async (req, res) => {
//   try {
//     const movies = await Movie.find({
//       $or: [{ isActive: true }, { isActive: { $exists: false } }],
//     })
//       .sort({ createdAt: -1 })
//       .limit(8)
//       .lean();

//     res.json(movies);
//   } catch (err) {
//     console.error("Recent movies error:", err);
//     res.status(500).json([]);
//   }
// };

// // Create Movie
// exports.createMovie = async (req, res) => {
//   try {
//     const data = req.body;

//     const movie = await Movie.create({
//       ...data,
//       releaseDate: parseNepalDateStart(data.releaseDate),
//       movieStartDate: parseNepalDateStart(data.movieStartDate),
//       movieEndDate: parseNepalDateEnd(data.movieEndDate),
//       isActive: typeof data.isActive === "boolean" ? data.isActive : true,
//     });

//     res.status(201).json(movie);
//   } catch (err) {
//     console.error("Create movie error:", err);
//     res.status(500).json({ message: "Failed to create movie" });
//   }
// };

// exports.updateMovie = async (req, res) => {
//   try {
//     const data = req.body;

//     const updatePayload = {
//       ...data,
//       releaseDate: parseNepalDateStart(data.releaseDate),
//       movieStartDate: parseNepalDateStart(data.movieStartDate),
//       movieEndDate: parseNepalDateEnd(data.movieEndDate),
//     };

//     const movie = await Movie.findByIdAndUpdate(req.params.id, updatePayload, {
//       new: true,
//       runValidators: true,
//     });

//     if (!movie) {
//       return res.status(404).json({ message: "Movie not found" });
//     }

//     res.json(movie);
//   } catch (err) {
//     console.error("Update movie error:", err);

//     if (err.name === "ValidationError") {
//       return res.status(400).json({
//         message: "Validation failed",
//         errors: err.errors,
//       });
//     }

//     res.status(500).json({ message: "Update failed" });
//   }
// };

// // Delete movie and showtimes
// exports.deleteMovie = async (req, res) => {
//   try {
//     await Movie.findByIdAndDelete(req.params.id);
//     await Showtime.deleteMany({ movieId: req.params.id });

//     res.json({ message: "Movie and showtimes deleted" });
//   } catch (err) {
//     console.error("Delete movie error:", err);
//     res.status(500).json({ message: "Delete failed" });
//   }
// };

const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

const NEPAL_OFFSET_MINUTES = 5 * 60 + 45;
const NEPAL_OFFSET_MS = NEPAL_OFFSET_MINUTES * 60 * 1000;

// Converts Nepal date string "YYYY-MM-DD"
// to UTC instant for Nepal 00:00:00.000
const parseNepalDateStart = (dateStr) => {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) - NEPAL_OFFSET_MS
  );
};

// Converts Nepal date string "YYYY-MM-DD"
// to UTC instant for Nepal 23:59:59.999
const parseNepalDateEnd = (dateStr) => {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) - NEPAL_OFFSET_MS
  );
};

// Current Nepal date helpers
const getNepalNow = () => {
  return new Date(Date.now() + NEPAL_OFFSET_MS);
};

const getTodayNepalDateString = () => {
  const nepalNow = getNepalNow();
  const year = nepalNow.getUTCFullYear();
  const month = String(nepalNow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(nepalNow.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayNepalStart = () => {
  return parseNepalDateStart(getTodayNepalDateString());
};

const getTodayNepalEnd = () => {
  return parseNepalDateEnd(getTodayNepalDateString());
};

const validateMovieDates = ({ movieStartDate, movieEndDate, releaseDate }) => {
  const parsedReleaseDate = releaseDate ? parseNepalDateStart(releaseDate) : null;
  const parsedStartDate = movieStartDate ? parseNepalDateStart(movieStartDate) : null;
  const parsedEndDate = movieEndDate ? parseNepalDateEnd(movieEndDate) : null;

  if (!parsedStartDate || !parsedEndDate) {
    return {
      error: "Movie start date and end date are required",
    };
  }

  if (parsedStartDate > parsedEndDate) {
    return {
      error: "Movie start date cannot be after movie end date",
    };
  }

  if (parsedReleaseDate && parsedReleaseDate > parsedEndDate) {
    return {
      error: "Release date cannot be after movie end date",
    };
  }

  return {
    parsedReleaseDate,
    parsedStartDate,
    parsedEndDate,
  };
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

// Coming soon = starts after today ends in Nepal
exports.getComingSoon = async (req, res) => {
  try {
    const todayEnd = getTodayNepalEnd();

    const movies = await Movie.find({
      $and: [
        { movieStartDate: { $gt: todayEnd } },
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

// Now showing = started on/before today ends and ends on/after today starts in Nepal
exports.getNowShowing = async (req, res) => {
  try {
    const todayStart = getTodayNepalStart();
    const todayEnd = getTodayNepalEnd();

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

// Archived = ended before today starts in Nepal
exports.getArchivedMovies = async (req, res) => {
  try {
    const todayStart = getTodayNepalStart();

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