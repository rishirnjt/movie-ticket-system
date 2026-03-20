const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
    {
        screenId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Screen",
            required: true,
            index: true
        },

        row:{
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        number:{
            type: Number,
            required: true,
            min: 1
        },

        label:{
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        type:{
            type: String,
            enum: ["regular", "vip","couple", "disabled"],
            default: "regular"
        },
        
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timstamps: true
    }
);

//one seat is unique inside one screen
seatSchema.index({ screenId: 1, label: 1 }, { unique: true });
seatSchema.index({ screenId: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);