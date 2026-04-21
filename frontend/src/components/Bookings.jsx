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

            const res = await fetch("http://localhost:5001/api/bookings/admin/all", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();
            console.log("BOOKINGS API:", data);
            console.log("seatLabels:", data.bookings[0]?.seatLabels);
            console.log("showtime:", data.bookings[0]?.showtime);

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

    const formatCustomer = (booking) => {
        const fullName =
            `${booking.user?.firstName || ""} ${booking.user?.lastName || ""}`.trim();

        return fullName || "N/A";
    };

    const formatMovie = (booking) => {
        return booking.movie?.title || "N/A";
    };

    const formatScreen = (showtime) => {
        return showtime?.screenId?.name || showtime?.screenId?.screenName || "N/A";
    };

    const formatShowtime = (showtime) => {
        if (!showtime?.startTime) return "N/A";

        const d = new Date(showtime.startTime);
        if (Number.isNaN(d.getTime())) return "N/A";

        return d.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatSeats = (booking) => {
        if (Array.isArray(booking.seatLabels) && booking.seatLabels.length > 0) {
            return booking.seatLabels.join(", ");
        }

        return "N/A";
    };

    const formatTotal = (booking) => {
        return `Rs. ${booking.totalPrice ?? 0}`;
    };

    const formatStatus = (booking) => {
        return booking.status || "N/A";
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
                                    <td>{b._id?.slice(-6) || "N/A"}</td>
                                    <td>{formatCustomer(b)}</td>
                                    <td>{formatMovie(b)}</td>
                                    <td>
                                        {formatScreen(b.showtime)} • {formatShowtime(b.showtime)}
                                    </td>
                                    <td>{formatSeats(b)}</td>
                                    <td>{formatTotal(b)}</td>
                                    <td>{formatStatus(b)}</td>
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