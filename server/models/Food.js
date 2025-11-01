const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: { type: String, require: true },
    price: { type: Number, require: true},
    image: String,
    category: String,
    available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);