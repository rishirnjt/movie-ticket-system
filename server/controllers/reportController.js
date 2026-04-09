const Booking = require("../models/Booking");

exports.getAdminReport = async (req, res) => {
  try {
    const { start, end } = req.query;

    const filter = {};

    if (start || end) {
      filter.createdAt = {};

      if (start) {
        filter.createdAt.$gte = new Date(`${start}T00:00:00.000Z`);
      }

      if (end) {
        filter.createdAt.$lte = new Date(`${end}T23:59:59.999Z`);
      }
    }

    const bookings = await Booking.find(filter)
      .populate("movie", "title")
      .sort({ createdAt: 1 })
      .lean();

    let totalRevenue = 0;
    const totalBookings = bookings.length;
    let confirmed = 0;
    let cancelled = 0;

    const dailySalesMap = {};
    const movieMap = {};

    bookings.forEach((booking) => {
      const status = String(booking.status || "").toLowerCase();
      const amount = Number(booking.totalPrice || 0);

      if (status === "confirmed") {
        confirmed += 1;
        totalRevenue += amount;

        const bookingDate = new Date(booking.createdAt);
        const dayKey = bookingDate.toISOString().split("T")[0];

        if (!dailySalesMap[dayKey]) {
          dailySalesMap[dayKey] = 0;
        }

        dailySalesMap[dayKey] += amount;

        const movieId = booking.movie?._id?.toString() || "unknown";
        const movieTitle = booking.movie?.title || "Unknown";

        if (!movieMap[movieId]) {
          movieMap[movieId] = {
            title: movieTitle,
            bookings: 0,
            revenue: 0,
          };
        }

        movieMap[movieId].bookings += 1;
        movieMap[movieId].revenue += amount;
      }

      if (
        status === "cancelled" ||
        status === "canceled" ||
        status === "expired"
      ) {
        cancelled += 1;
      }
    });

    const dailySales = Object.entries(dailySalesMap)
      .map(([date, sales]) => ({
        date,
        sales,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const topMovies = Object.values(movieMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return res.status(200).json({
      totalRevenue,
      totalBookings,
      confirmed,
      cancelled,
      dailySales,
      topMovies,
    });
  } catch (err) {
    console.error("Report error:", err);
    return res.status(500).json({ message: "Failed to generate report" });
  }
};