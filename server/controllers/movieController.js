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
        const today = new Date();
        today.setHours(0,0,0,0);

        const movies = await Movie.find({
            movieStartDate: { $gt: today },
            status: { $ne: "archived" }
        }).lean();

        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: "Error fetching coming soon movies" });
    }
};


exports.getNowShowing = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);

        const movies = await Movie.find({
            movieStartDate: { $lte: today },
            movieEndDate: { $gte: today },
            status: { $ne: "archived"}
        }).lean();

        const movieIds = movies.map(m => m._id);

        const showtimes = await Showtime.find({
            movie: { $in: movieIds }
        }).lean();

        const moviesWithShowtimes = movies.map(movie => ({
            ...movie,
            showtimes: showtimes.filter(
                st => st.movie.toString() === movie._id.toString()
            )
        }));

        res.json(moviesWithShowtimes);

    } catch (err) {
        res.status(500).json({ message: "Error fetching now showing movies" });
    }
};

//Get all movies
exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find({ isActive: true }).lean();
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

        const showtimes = await Showtime.find({ movie: movie._id })
            .sort({ time: 1 })
            .lean();

        res.json({
            ...movie,
            showtimes,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching movie details" });
    }
};

exports.getAllMoviesAdmin = async (req, res )=> {
    try{
        const movies = await Movie.find().lean();
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: "Error fetching movies for admin"});
    }
}

exports.getRecentMovies = async (req, res) => {
    try{
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

//Create Movie
exports.createMovie = async (req, res) => {
    try {
        const data = req.body;

        const movie = await Movie.create({
            ...data,
            isActive:
                typeof data.isActive === "boolean" ? data.isActive : true,
        });

        res.status(201).json(movie);
    } catch (err) {
        res.status(500).json({ message: "Failed to create movie" });
    }
};

//Update Movie
exports.updateMovie = async (req, res) => {
    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
};

/* =========================
   DELETE MOVIE + SHOWTIMES
========================= */
exports.deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        await Showtime.deleteMany({ movie: req.params.id });

        res.json({ message: "Movie and showtimes deleted" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
};