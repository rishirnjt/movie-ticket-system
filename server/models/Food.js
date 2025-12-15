const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true},
    image: String,
    category: {
        type: String,
        enum: ["food", "drink"],
        required: true
    },
    available: {type: Boolean, default: true}
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);