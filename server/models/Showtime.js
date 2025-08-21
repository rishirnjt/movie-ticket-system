const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
    movie: {type: mongoose.Schema.Types.ObjectId, ref:"Movie", required: true },
    hall: { type: String, required: true},
    time: { type: Date, required:true}
});

module.exports = mongoose.models.Showtime || mongoose.model("Showtime", showtimeSchema);
