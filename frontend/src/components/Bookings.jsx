import React, { useEffect, useState } from "react";
import "./Bookings.css";

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/admin/bookings", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();
            console.log("BOOKINGS API:", data);

            setBookings(data.bookings || []);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };
    const filteredBookings = bookings.filter((b) => {
        const customer =
            `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.toLowerCase();
        const movie = (b.movie?.title || "").toLowerCase();
        const q = search.toLowerCase();

        return customer.includes(q) || movie.includes(q);
    });

    const formatShowtime = (showtime) => {
        if (!showtime) return "N/A";

        const rawTime =
            showtime.startTime ||
            showtime.time ||
            showtime.showTime ||
            showtime.dateTime ||
            showtime.date;

        if (!rawTime) return "N/A";

        const d = new Date(rawTime);
        if (Number.isNaN(d.getTime())) return "N/A";

        return d.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatScreen = (showtime) => {
        return (
            showtime?.screenId?.name ||
            showtime?.screen?.name ||
            showtime?.hall ||
            showtime?.screenName ||
            "N/A"
        );
    };

    const formatSeats = (booking) => {
        if (Array.isArray(booking.seatLabels) && booking.seatLabels.length > 0) {
            return booking.seatLabels.join(", ");
        }
        return "N/A";
    };

    return (
        <div className="bookings-page">
            <h2>Bookings</h2>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by customer or movie"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <p>Loading bookings...</p>
            ) : (
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Movie</th>
                            <th>Showtime</th>
                            <th>Seats</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map((b) => (
                                <tr key={b._id}>
                                    <td>{b._id?.slice(-6)}</td>
                                    <td>
                                        {b.user?.firstName} {b.user?.lastName}
                                    </td>
                                    <td>{b.movie?.title || "N/A"}</td>
                                    <td>
                                        {formatScreen(b.showtime)} • {formatShowtime(b.showtime)}
                                    </td>
                                    <td>{formatSeats(b)}</td>
                                    <td>Rs. {b.totalPrice ?? 0}</td>
                                    <td>{b.status || "N/A"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No bookings found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Bookings;