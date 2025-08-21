const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user:{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    movie:{type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true},
    showtime:{type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required:true },
    seats: [{ type: String, required: true}],
    totalPrice: { type: Number, required: true},
    status: {
        type: String,
        enum: ["reserved", "confirmed", "cancelled"],
        default: "reserved"
    },

    createdAt: { type: Date, default: Date.now},
});

module.exports=mongoose.models.Booking || mongoose.model("Booking", bookingSchema)
