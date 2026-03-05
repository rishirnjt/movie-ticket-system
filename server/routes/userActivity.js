const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/watched", async(req, res) => {
    try{
        const { userId, movieId } = req.body;

        await User.findByIdAndUpdate(userId, {
            $addToSet: { watchedMovies: movieId }
        });
        res.json({ message: "Movie added to history"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update history" });
    }
});

module.exports = router;