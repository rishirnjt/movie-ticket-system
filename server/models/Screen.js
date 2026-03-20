const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
    {
        theatreId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Theater",
            required: true,
            index: true
        },

        name:{
            type: String,
            required: true,
            trim: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

screenSchema.index({ theaterId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Scree", screenSchema);