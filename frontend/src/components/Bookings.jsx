import React, { useEffect, useState } from "react";
import "./Bookings.css";

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const limit = 8;

    useEffect(() => {
        fetchBookings();
    }, [page]);

    const fetchBookings = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found. Please login first");
                setLoading(false);
                return;
            }

            const res = await fetch(
                `http://localhost:5001/api/admin/bookings?page=${page}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",

                    },
                }
            );
            const data = await res.json();

            setBookings(data.bookings || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = (bookings || []).filter(b =>
        `${b.user?.firstName || ""} ${b.user?.lastName || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) ||
        b.movie?.title?.toLowerCase().includes(search.toLowerCase())
    );

    const formatShowtime = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="bookings-page">
            <h2>Bookings</h2>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by customer or movie"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <p>Loading bookings...</p>
            ) : (
                <>
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
                            {filteredBookings.length ? (
                                filteredBookings.map(b => (
                                    <tr key={b._id}>
                                        <td>{b._id.slice(-6)}</td>
                                        <td>{b.user?.firstName} {b.user?.lastName}</td>
                                        <td>{b.movie?.title}</td>
                                        <td>{b.showtime?.hall} – {formatShowtime(b.showtime?.time)}</td>
                                        <td>{b.seats.join(", ")}</td>
                                        <td>Rs.{b.totalPrice}</td>
                                        <td className={`status ${b.status}`}>{b.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7">No bookings found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* PAGINATION */}
                    <div className="pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Prev
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={page === i + 1 ? "active" : ""}
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Bookings;
