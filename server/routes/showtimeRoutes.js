const express = require("express");
const router = express.Router();
const Showtime = require("../models/Showtime");

//add showtime
router.post("/add", async(req,res) => {
    try{
        const { movieId, hall, time } = req.body;

        const showtime = await Showtime.create({
            movie: movieId,
            hall,
            time,
        });

        res.status(201).json(showtime);
    } catch (err) {
        res.status(500).json({ message: "Failed to add showtime"});
    }
});

//get showtime for a movie
router.get("/movie/:movieId", async (req, res) => {
    try{
        const showtimes = await Showtime.find({ movie: req.params.movieId })
            .sort({ time: 1 });

        res.json(showtimes);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch showtimes" });
    }
});

module.exports = router;