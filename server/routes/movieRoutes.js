const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');

//get all movies
// router.get('/', async (req, res) => {
//     try {
//         const movies = await Movie.find().lean();

//         //attach showtimes
//         const moviesWithShowtime = await Promise.all(
//             movies.map(async (movie) => {
//                 const showtimes = (await Showtime.find({ movie: movie._id })).toSorted({ time: 1 });
//                 return { ...movie, showtimes };
//             })
//         );
//         res.status(200).json(movies);
//     } catch (err) {
//         res.status(500).json({ message: 'Error fetching movies' });
//     }
// });

router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find().lean();
        const moviesWithShowtimes = await Promise.all(
            movies.map(async (movie) => {
                const showtimes = await Showtime.find({ movie: movie._id }).sort({ time: 1 }).lean();
                return { ...movie, showtimes };
            })
        );
        res.status(200).json(moviesWithShowtimes);
    } catch (err) {
        console.error("Error fetching movies:", err);
        res.status(500).json({ message: 'Error fetching movies', error: err.message });
    }
});



//get recent movies
router.get("/recent", async (req, res) => {
    try {
        const movies = await Movie.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.status(200).json(movies);
    } catch (error) {
        console.error("Recent movies error:", error);
        res.status(500).json({ message: "Failed to fetch recent movies" });
    }
});

//get single movie
router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).lean();
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found ' });
        }

        const showtimes = await Showtime.find({ movie: movie._id }).sort({ time: 1 });
        res.status(200).json({ ...movie, showtimes });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching movie details' });
    }
});

//add movies
router.post('/add-multiple', async (req, res) => {
    try {
        let movies = req.body;

        movies = movies.map(movie => {
            if (movie.posterURL && !movie.posterURL.startsWith('http')) {
                movie.posterUrl = `${req.protocol}://${req.get("host")}${movie.posterUrl}`;
            }
            return {
                ...movie,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            };
        });

        const inserted = await Movie.insertMany(movies);
        res.status(201).json({ movies: inserted });

    } catch (err) {
        res.status(500).json({ message: 'Failed to add movie' });
    }
});

//UPDATE
router.put("/:id", async (req, res) => {
    try {
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: "Server Error " });
    }
});

//Delete
router.delete("/:id", async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ message: "Movie deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;