const Pricing = require("../models/Pricing");

const calculateTicketPrice = async (showDate) => {
    let pricing = await Pricing.findOne();

    if(!pricing) {
        pricing = {
            normalPrice: 350,
            midWeekDiscountEnabled: true,
            midWeekDays: [2, 3],
            discountPercentage: 50,
        };
    }

    const day = new Date(showDate).getDate();
    let finalPrice = pricing.normalPrice;

    if(
        pricing.midWeekDiscountEnables &&
        pricing.midWeekDays.includes(day)
    ) {
        finalPrice =
            pricing.normalPrice * (1 - pricing.discountPercentage / 100);
    }

    return Math.round(finalPrice);
};

module.exports = calculateTicketPrice;