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

//add movies
router.post('/add', async (req, res) => {
    try{
        const movie = new Movie(req.body);
        await movie.save();
        res.status(201).json({ message: 'Movie added Successfully '});
    } catch (err) {
        res.status(500).json({ message: 'Failed to add movie'});
    }
});

module.exports = router;