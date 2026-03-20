const mongoose = require("mongoose");
const Screen = require("../models/Screen");
const Seat = require("../models/Seat");

const generateSeats = async (req, res) => {
    try {
        const { screenId } = req.params;
        const { rows, seatsPerRow, typeMap = {}, overwrite = false } = req.body;

        if(!mongoose.Types.ObjectId.isValid(screenId)) {
            return res.status(400).json({ message: "Invalid screenId" });
        }

        if(!Array.isArray(rows) || rows.length === 0){
            return res.status(400).json({ message: "rows must be a non-empty array" });
        }

        if(!Number.isInteger(seatsPerRow) || seatsPerRow <= 0){
            return res.status(400).json({ message: "Seats per row must be a positive integer"});
        }

        const screen = await Screen.findById(screenId);
        if(!screen){
            return res.status(404).json({ message: "Screen not found" });
        }

        const existingCount = await Seat.countDocuments({ screenId });

        if (existingCount > 0 && !overwrite) {
            return res.status(409).json({
                message: "Seats already exist for this screen.",
            });
        }

        if (overwrite) {
            await Seat.deleteMany({ screenId });
        }

        const seatDocs = [];

        for (const rawRow of rows) {
            const row = String(rawRow).trim().toUpperCase();
            const seatType = typeMap[row] || "regular";

            for (let i = 1; i <=seatsPerRow; i+=1){
                seatDocs.push({
                    screenId,
                    row,
                    number: i,
                    label: `${row}${i}`,
                    type: seatType,
                    isActive: true,
                });
            }
        }

        if(seatDocs.length === 0) {
            return res.status(400).json({ message: "No seats generated" });
        }

        await Seat.insertMany(seatDocs, { ordered: true });

        await Screen.findByIdAndUpdate(screenId, {
            capacity: seatDocs.length,
        });

        return res.status(201).json({
            message: "Seats generated successfully",
            totalSeats: seatDocs.length,
            rows: rows.length,
            seatsPerRow,
        });
    } catch (err) {
        console.error("Generate seats error:", err);
        return res.status(500).json({ message: "Failed to generate seats" });
    }
};

const getSeatsByScreen = async (req, res) => {
    try{
        const { screenId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(screenId)){
            return res.status(400).json({ message: "Invalid screenId" });
        }

        const seats = await Seat.find({ screenId, isActive: true}).sort({ row: 1, number: 1 });
        res.json(seats);
    } catch (err) {
        console.error("Get seats by screen error:", err);
        res.status(500).json({ message: "Failed to fetch seats", error: err.message });
    }
};

module.exports = {
    generateSeats,
    getSeatsByScreen,
};