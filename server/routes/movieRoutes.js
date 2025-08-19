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
        const movies = req.body;
        if(!Array.isArray(movies)) {
            return res.status(400).json({ message: 'Invalid data format: expected an array'});
        }
        await Movie.insertMany(movies);
        res.status(201).json({ message: 'Movie added Successfully '});
    } catch (err) {
        res.status(500).json({ message: 'Failed to add movie'});
    }
});

module.exports = router;