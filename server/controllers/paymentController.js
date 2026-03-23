const axios = require("axios");
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Seat = require("../models/Seat");

const { sendPurchaseEmail } = require("../utils/sendEmail");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY?.trim();
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY?.trim();

const PRODUCT_CODE = "EPAYTEST";

function generateSignature(total_amount, transaction_uuid) {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;

    console.log("eSewa signature message:", message);
    console.log("eSewa secret exists:", !!ESEWA_SECRET_KEY);

    return crypto
        .createHmac("sha256", ESEWA_SECRET_KEY)
        .update(message)
        .digest("base64");
}

const initiatePayment = async (req, res) => {
    try {
        const { bookingId, gateway } = req.body;

        console.log("\n========== INITIATE PAYMENT ==========");
        console.log("Request body:", req.body);
        console.log("Gateway:", gateway);
        console.log("Booking ID:", bookingId);
        console.log("User from token:", req.user ? req.user._id : "NO USER");

        console.log("KHALTI_SECRET_KEY exists:", !!KHALTI_SECRET_KEY);
        console.log("KHALTI_SECRET_KEY raw length:", process.env.KHALTI_SECRET_KEY?.length);
        console.log("KHALTI_SECRET_KEY trimmed length:", KHALTI_SECRET_KEY?.length);
        console.log("KHALTI_SECRET_KEY preview:", KHALTI_SECRET_KEY?.slice(0, 12));

        console.log("ESEWA_SECRET_KEY exists:", !!ESEWA_SECRET_KEY);

        const booking = await Booking.findById(bookingId)
            .populate("movie")
            .populate("showtime");

        console.log("Booking found:", !!booking);

        if (!booking) {
            console.log("Booking not found");
            return res.status(404).json({ message: "Booking not found" });
        }

        console.log("Booking user:", booking.user?.toString());
        console.log("Request user:", req.user?._id?.toString());
        console.log("Booking status:", booking.status);

        if (!req.user || !req.user._id) {
            console.log("User not authenticated");
            return res.status(401).json({ message: "User not authenticated" });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            console.log("User does not match booking owner");
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (booking.status !== "holding") {
            console.log("Invalid booking status:", booking.status);
            return res.status(400).json({ message: "Invalid booking status" });
        }

        if (!booking.movie) {
            console.log("Movie data missing");
            return res.status(400).json({ message: "Movie data not found" });
        }

        if (!booking.showtime) {
            console.log("Showtime data missing");
            return res.status(400).json({ message: "Showtime data not found" });
        }

        const amount = Number(booking.totalPrice);

        console.log("Booking totalPrice:", booking.totalPrice);
        console.log("Parsed amount:", amount);

        if (!amount || Number.isNaN(amount)) {
            console.log("Invalid booking amount");
            return res.status(400).json({ message: "Invalid booking amount" });
        }

        if (gateway === "khalti") {
            if (!KHALTI_SECRET_KEY) {
                console.log("Khalti secret key missing in env");
                return res.status(500).json({ message: "Khalti secret key missing" });
            }

            const payload = {
                return_url: `http://localhost:5173/payment-success?gateway=khalti&bookingId=${booking._id}`,
                website_url: "http://localhost:5173",
                amount: Math.round(amount * 100),
                purchase_order_id: booking._id.toString(),
                purchase_order_name: booking.movie.title,
                customer_info: {
                    name:
                        `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
                        "Customer",
                    email: req.user.email,
                },
            };

            console.log("\n----- KHALTI INITIATE -----");
            console.log("Khalti URL:", "https://dev.khalti.com/api/v2/epayment/initiate/");
            console.log("Khalti payload:", payload);
            console.log("Khalti Authorization header:", `Key ${KHALTI_SECRET_KEY?.slice(0, 12)}...`);

            const response = await axios.post(
                "https://dev.khalti.com/api/v2/epayment/initiate/",
                payload,
                {
                    headers: {
                        Authorization: `Key ${KHALTI_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Khalti response status:", response.status);
            console.log("Khalti response data:", response.data);

            return res.json({
                gateway: "khalti",
                payment_url: response.data.payment_url,
                pidx: response.data.pidx,
            });
        }

        if (gateway === "esewa") {
            if (!ESEWA_SECRET_KEY) {
                console.log("eSewa secret key missing in env");
                return res.status(500).json({ message: "eSewa secret key missing" });
            }

            const total_amount = String(amount);
            const transaction_uuid = booking._id.toString();
            const signature = generateSignature(total_amount, transaction_uuid);

            const formData = {
                amount: String(amount),
                tax_amount: "0",
                total_amount,
                transaction_uuid,
                product_code: PRODUCT_CODE,
                product_service_charge: "0",
                product_delivery_charge: "0",
                success_url: "http://localhost:5173/payment-success",
                failure_url: "http://localhost:5173/checkout",
                signed_field_names: "total_amount,transaction_uuid,product_code",
                signature,
            };

            console.log("\n----- ESEWA INITIATE -----");
            console.log("eSewa URL:", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
            console.log("eSewa formData:", formData);

            return res.json({
                gateway: "esewa",
                url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
                formData,
            });
        }

        console.log("Invalid payment gateway:", gateway);
        return res.status(400).json({ message: "Invalid payment gateway" });
    } catch (err) {
        console.log("\n========== INITIATE ERROR ==========");
        console.log("Error message:", err.message);
        console.log("Error status:", err.response?.status);
        console.log("Error data:", err.response?.data);

        return res.status(err.response?.status || 500).json({
            message:
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                "Payment initiation failed",
            error: err.response?.data || null,
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { gateway, bookingId, pidx } = req.body;

        console.log("\n========== VERIFY PAYMENT ==========");
        console.log("Request body:", req.body);
        console.log("Gateway:", gateway);
        console.log("Booking ID:", bookingId);
        console.log("PIDX:", pidx);
        console.log("User from token:", req.user ? req.user._id : "NO USER");

        const booking = await Booking.findById(bookingId)
            .populate("movie")
            .populate("showtime");

        console.log("Booking found:", !!booking);

        if (!booking) {
            console.log("Booking not found");
            return res.status(404).json({ message: "Booking not found" });
        }

        if (!req.user || !req.user._id) {
            console.log("User not authenticated");
            return res.status(401).json({ message: "User not authenticated" });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            console.log("User does not match booking owner");
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (booking.status !== "holding") {
            console.log("Booking already processed:", booking.status);
            return res.status(400).json({ message: "Already processed" });
        }

        if (gateway === "khalti") {
            console.log("\n----- KHALTI VERIFY -----");
            console.log("Lookup payload:", { pidx });
            console.log("Khalti Authorization header:", `Key ${KHALTI_SECRET_KEY?.slice(0, 12)}...`);

            const response = await axios.post(
                "https://dev.khalti.com/api/v2/epayment/lookup/",
                { pidx },
                {
                    headers: {
                        Authorization: `Key ${KHALTI_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Khalti verify response:", response.data);

            if (response.data.status !== "Completed") {
                return res.status(400).json({ message: "Payment not completed" });
            }
        } else if (gateway === "esewa") {
            const transaction_uuid = booking._id.toString();
            const total_amount = booking.totalPrice;

            const url = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${PRODUCT_CODE}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;

            console.log("\n----- ESEWA VERIFY -----");
            console.log("Verify URL:", url);

            const response = await axios.get(url);

            console.log("eSewa verify response:", response.data);

            if (response.data.status !== "COMPLETE") {
                return res.status(400).json({ message: "Payment not completed" });
            }
        } else {
            return res.status(400).json({ message: "Invalid payment gateway" });
        }

        booking.status = "confirmed";
        booking.reservationExpiresAt = null;
        await booking.save();

        const ticket = await Ticket.create({
            userId: booking.user,
            movieId: booking.movie._id,
            showtimeId: booking.showtime._id,
            seats: booking.seats,
            totalPrice: booking.totalPrice,
            foods: booking.foods || [],
            status: "active",
        });

        const user = await User.findById(booking.user);

        const seatDocs = await Seat.find({ _id: { $in: booking.seats } })
            .sort({ row: 1, number: 1 })
            .lean();

        const seatLabels = seatDocs.map((s) => s.label).join(", ");

        if (user?.email) {
            await sendPurchaseEmail(user.email, {
                movie: booking.movie.title,
                date: new Date(booking.showtime.startTime).toLocaleDateString(),
                time: new Date(booking.showtime.startTime).toLocaleTimeString(),
                seats: seatLabels,
                foods: booking.foods || [],
                totalPaid: booking.totalPrice,
                ticketId: ticket._id,
            });
        }

        return res.json({
            message: "Payment successful",
            booking,
            ticket,
        });
    } catch (err) {
        console.log("\n========== VERIFY ERROR ==========");
        console.log("Error message:", err.message);
        console.log("Error status:", err.response?.status);
        console.log("Error data:", err.response?.data);

        return res.status(err.response?.status || 500).json({
            message:
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                "Payment verification failed",
            error: err.response?.data || null,
        });
    }
};

module.exports = {
    initiatePayment,
    verifyPayment,
};