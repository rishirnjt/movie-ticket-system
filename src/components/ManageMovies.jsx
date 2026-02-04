import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./ManageMovies.css";

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch movies from backend
  const fetchMovies = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/movies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies(res.data);
    } catch (err) {
      console.error("Failed to fetch movies", err);
      setMovies([]); // ensure no crash if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Delete movie
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;

    try {
      await axios.delete(`http://localhost:5001/api/movies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete movie");
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="content-wrapper manage-movies">
        <h2 className="page-title">Manage Movies</h2>

        {loading ? (
          <p>Loading movies...</p>
        ) : movies.length === 0 ? (
          <p>No movies found. Add some!</p>
        ) : (
          <table className="table movie-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie) => (
                <tr key={movie._id}>
                  <td>
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl.startsWith("http") ? movie.posterUrl : `http://localhost:5001${movie.posterUrl}`}
                        alt={movie.title}
                        className="movie-poster"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{movie.title}</td>
                  <td>{movie.genre}</td>
                  <td>{movie.language}</td>
                  <td>{movie.duration}</td>
                  <td className="actions">
                    <button
                      className="btn edit"
                      onClick={() => navigate(`/admin/edit-movie/${movie._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn delete"
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
    </div>
  );
};

export default ManageMovies;
