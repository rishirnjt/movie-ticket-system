const Pricing = require("../models/Pricing");

// Get pricing config
exports.getPricing = async (req, res) => {
  try {
    let pricing = await Pricing.findOne();

    if (!pricing) {
      pricing = await Pricing.create({
        normalPrice: 500,
        midWeekDiscountEnabled: true,
        midWeekDays: [2, 3],
        discountPercentage: 50,
      });
    }

    res.json(pricing);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pricing settings",
      error: error.message,
    });
  }
};

// Update pricing config
exports.updatePricing = async (req, res) => {
  try {
    const {
      normalPrice,
      midWeekDiscountEnabled,
      midWeekDays,
      discountPercentage,
    } = req.body;

    let pricing = await Pricing.findOne();

    if (!pricing) {
      pricing = new Pricing();
    }

    pricing.normalPrice = normalPrice;
    pricing.midWeekDiscountEnabled = midWeekDiscountEnabled;
    pricing.midWeekDays = midWeekDays;
    pricing.discountPercentage = discountPercentage;

    await pricing.save();

    res.json({
      message: "Pricing settings updated successfully",
      pricing,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update pricing settings",
      error: error.message,
    });
  }
};