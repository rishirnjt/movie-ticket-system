const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const { protect } = require("../middleware/authMiddleware"); // destructure the function

//Get all tickets for logged in user
router.get("/mytickets", protect, async(req, res) => {
    try{
        const tickets = await Ticket.find({ userId: req.user.id })
            .populate("movieId")
            .populate("showtimeId");

        res.json({ tickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error"});
    }
});

//POST /api/tickets/buy
router.post("/buy", protect, async (req, res) => {
    try{
        const { userId, movieId, showtimeId, seats } = req.body;

        if(!userId || !movieId || !showtimeId || !seats || seats.length === 0) {
            return res.status(400).json({ message: "Invalid request data"});
        }
        //check if seats are already sold out
        const existing = await Ticket.findOne({
            showtimeId,
            seats: { $in: seats }
        });

        if(existing){
            return res.status(409).json({ message: "Seat already sold out."});
        }

        //create new ticket
        const ticket = new Ticket({
            userId,
            movieId,
            showtimeId,
            seats,
            purchasedAt: new Date()
        });
        await ticket.save();

        return res.status(201).json({ message: "Ticekt purchase successfully", ticket,});
    } catch (err) {
        console.error("Buy API error: ",err);
        return res.status(500).json({ message: "Server error"});
    }
});

module.exports = router;