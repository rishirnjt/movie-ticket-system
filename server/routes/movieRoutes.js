// routes/movieRoutes.js
const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

//search
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const movies = await Movie.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } }
      ]
    }).limit(12);

    res.json(movies);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
});

/* =========================
   GET ALL MOVIES WITH SHOWTIMES
========================= */
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().lean();

    // Attach showtimes
    const moviesWithShowtimes = await Promise.all(
      movies.map(async (movie) => {
        const showtimes = await Showtime.find({ movie: movie._id })
          .sort({ time: 1 })
          .lean();
        return {
          _id: movie._id,
          title: movie.title || "Untitled",
          genre: movie.genre || "N/A",
          language: movie.language || "N/A",
          duration: movie.duration || "N/A",
          posterUrl: movie.posterUrl || "",
          trailerUrl: movie.trailerUrl || "",
          releaseDate: movie.releaseDate
            ? movie.releaseDate.toISOString().split("T")[0]
            : "N/A",
          isActive: typeof movie.isActive === "boolean" ? movie.isActive : true,
          createdAt: movie.createdAt,
          showtimes,
        };
      })
    );

    res.status(200).json(moviesWithShowtimes);
  } catch (err) {
    console.error("Error fetching movies:", err);
    res
      .status(500)
      .json({ message: "Error fetching movies", error: err.message });
  }
});

/* =========================
   GET RECENT MOVIES
========================= */
router.get("/recent", async (req, res) => {
  try {
    let movies = await Movie.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    movies = movies.map((m) => ({
      _id: m._id,
      title: m.title || "Untitled",
      releaseDate: m.releaseDate
        ? m.releaseDate.toISOString().split("T")[0]
        : "N/A",
      isActive: typeof m.isActive === "boolean" ? m.isActive : true,
      posterUrl: m.posterUrl || "",
    }));

    res.status(200).json(movies);
  } catch (err) {
    console.error("Recent movies error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch recent movies", error: err.message });
  }
});

/* =========================
   GET SINGLE MOVIE + SHOWTIMES
========================= */
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).lean();
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const showtimes = await Showtime.find({ movie: movie._id })
      .sort({ time: 1 })
      .lean();

    res.status(200).json({
      _id: movie._id,
      title: movie.title || "Untitled",
      genre: movie.genre || "N/A",
      language: movie.language || "N/A",
      duration: movie.duration || "N/A",
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "", 
      releaseDate: movie.releaseDate
        ? movie.releaseDate.toISOString().split("T")[0]
        : "N/A",
      isActive: typeof movie.isActive === "boolean" ? movie.isActive : true,
      createdAt: movie.createdAt,
      showtimes,
    });
  } catch (err) {
    console.error("Error fetching movie details:", err);
    res
      .status(500)
      .json({ message: "Error fetching movie details", error: err.message });
  }
});

//add single movies
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (data.posterUrl && !data.posterUrl.startsWith("http")) {
      data.posterUrl = `${req.protocol}://${req.get("host")}${data.posterUrl}`;
    }
    const movie = await Movie.create({
      ...data,
      isActive: typeof data.isActive === "boolean" ? data.isActive : true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(201).json(movie);
  } catch (err) {
    console.error("Create movie error:", err);
    res.status(500).json({ message: "Failed to create movie", error: err.message });
  }
})

/* =========================
   ADD MULTIPLE MOVIES
========================= */
router.post("/add-multiple", async (req, res) => {
  try {
    let movies = req.body;

    movies = movies.map((movie) => {
      if (movie.posterUrl && !movie.posterUrl.startsWith("http")) {
        movie.posterUrl = `${req.protocol}://${req.get("host")}${movie.posterUrl}`;
      }
      return {
        ...movie,
        isActive: typeof movie.isActive === "boolean" ? movie.isActive : true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    });

    const inserted = await Movie.insertMany(movies);
    res.status(201).json({ movies: inserted });
  } catch (err) {
    console.error("Failed to add movie:", err);
    res.status(500).json({ message: "Failed to add movie", error: err.message });
  }
});

/* =========================
   UPDATE MOVIE
========================= */
router.put("/:id", async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(movie);
  } catch (err) {
    console.error("Update movie error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

/* =========================
   DELETE MOVIE + SHOWTIMES
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    await Showtime.deleteMany({ movie: req.params.id });
    res.status(200).json({ message: "Movie & showtimes deleted" });
  } catch (err) {
    console.error("Delete movie error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
