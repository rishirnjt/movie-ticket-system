import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ArchivedMovies.css";

const ArchivedMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchivedMovies = async () => {
    try {
      const res = await axios.get("/api/movies/archive");
      const data = res.data;

      console.log("Archived movies response:", data);

      setMovies(Array.isArray(data) ? data : data.movies || []);
    } catch (err) {
      console.error("Error fetching archived movies:", err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedMovies();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this movie permanently?")) return;

    try {
      await axios.delete(`/api/movies/${id}`);
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-3">Loading archived movies...</div>;
  }

  return (
    <div className="archived-movies container mt-4">
      <h3 className="mb-4">📦 Archived Movies</h3>

      {!Array.isArray(movies) || movies.length === 0 ? (
        <p>No archived movies found.</p>
      ) : (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Title</th>
              <th>Genre</th>
              <th>Language</th>
              <th>Ended On</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(movies) &&
              movies.map((movie) => (
                <tr key={movie._id}>
                  <td>
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      style={{ width: "50px", height: "70px", objectFit: "cover" }}
                    />
                  </td>
                  <td>{movie.title}</td>
                  <td>{movie.genre}</td>
                  <td>{movie.language}</td>
                  <td>{formatDate(movie.movieEndDate)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(movie._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ArchivedMovies;