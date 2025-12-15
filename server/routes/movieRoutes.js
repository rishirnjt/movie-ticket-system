const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

//get all movies
router.get('/', async(req, res) => {
    try{
        const movies = await Movie.find();
        res.status(200).json(movies);
    } catch (err){
        res.status(500).json({ message: 'Error fetching movies' });
    }
});

//get single movie
router.get('/:id', async (req, res) => {
    try{
        const movie = await Movie.findById(req.params.id);
        if(!movie){
            return res.status(404).json({message: 'Movie not found '});
        }
        res.status(200).json(movie);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching movie details' });
    }
});

//add movies
router.post('/add-multiple', async (req, res) => {
    try{
        let movies = req.body;

        movies = movies.map(movie => {
            if (movie.posterURL && !movie.posterURL.startsWith('http')) {
            movie.posterUrl = `${req.protocol}://${req.get("host")}${movie.posterUrl}`;
            }
            return movie;
        })
        
        await Movie.insertMany(movies);
        res.status(201).json({ message: 'Movie added Successfully '});
    } catch (err) {
        res.status(500).json({ message: 'Failed to add movie'});
    }
});

//UPDATE
router.put("/:id", async (req, res) => {
    try{
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: "Server Error "});
    }
});

//Delete
router.delete("/:id", async (req, res) => {
    try{
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ message: "Movie deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;