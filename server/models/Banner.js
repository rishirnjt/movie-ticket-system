const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            default: "",
            trim: true,
        },
        bannerUrl: {
            type: String,
            required: true,
        },
        movieId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
            default: null,
        },
        buttonText: {
            type: String,
            default: "Book Now",
            trim: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }

);

module.exports = mongoose.model("Banner", bannerSchema);