import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ManageMovies.css";

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movieToDelete, setMovieToDelete] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchMovies = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/movies/admin/movies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies(res.data);
    } catch (err) {
      console.error("Failed to fetch movies", err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const openDeletePopup = (movie) => {
    setMovieToDelete(movie);
  };

  const closeDeletePopup = () => {
    setMovieToDelete(null);
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;

    try {
      await axios.delete(`http://localhost:5001/api/movies/${movieToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMovies((prev) => prev.filter((m) => m._id !== movieToDelete._id));
      closeDeletePopup();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete movie");
    }
  };

  return (
    <div className="content-wrapper manage-movies" id="manage-movies-content">
      <h2 className="page-title" id="manage-movies-title">
        Manage Movies
      </h2>

      {loading ? (
        <p id="movies-loading">Loading movies...</p>
      ) : movies.length === 0 ? (
        <p id="no-movies-msg">No movies found. Add some!</p>
      ) : (
        <table id="manage-movies-table" className="movie-table">
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
            {movies.map((movie, index) => (
              <tr key={movie._id} id={`movie-row-${index}`}>
                <td>
                  {movie.posterUrl ? (
                    <img
                      id={`movie-poster-${index}`}
                      src={
                        movie.posterUrl.startsWith("http")
                          ? movie.posterUrl
                          : `http://localhost:5001${movie.posterUrl}`
                      }
                      alt={movie.title}
                      className="movie-poster"
                    />
                  ) : (
                    <span id={`movie-no-poster-${index}`}>—</span>
                  )}
                </td>

                <td id={`movie-title-${index}`}>{movie.title}</td>
                <td id={`movie-genre-${index}`}>{movie.genre}</td>
                <td id={`movie-language-${index}`}>{movie.language}</td>
                <td id={`movie-duration-${index}`}>{movie.duration}</td>

                <td className="movie-actions">
                  <div className="movie-actions-inner">
                    <button
                      type="button"
                      className="movie-btn movie-btn-edit"
                      onClick={() => navigate(`/admin/edit-movie/${movie._id}`)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="movie-btn movie-btn-delete"
                      onClick={() => openDeletePopup(movie)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {movieToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete Movie</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{movieToDelete.title}</strong>?
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="movie-btn cancel-btn"
                onClick={closeDeletePopup}
              >
                Cancel
              </button>

              <button
                type="button"
                className="movie-btn movie-btn-delete"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMovies;