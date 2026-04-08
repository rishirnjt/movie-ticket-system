const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    normalPrice: {
      type: Number,
      required: true,
      default: 500,
    },

    midWeekDiscountEnabled: {
      type: Boolean,
      default: true,
    },

    midWeekDays: {
      type: [Number],
      default: [2, 3],
    },

    discountPercentage: {
      type: Number,
      default: 50,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pricing", pricingSchema);