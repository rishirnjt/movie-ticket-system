import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MovieForm.css";

const emptyMovie = {
  title: "",
  description: "",
  genre: "",
  posterUrl: "",
  trailerUrl: "",
  releaseDate: "",
  duration: "",
  rating: "",
  language: "",
  showtimes: [{ hall: "", time: "" }],
};

const MovieForm = ({ mode = "add", movieId, onSuccess }) => {
  const [movie, setMovie] = useState(emptyMovie);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (mode === "edit" && movieId) fetchMovie();
  }, [mode, movieId]);

  const fetchMovie = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
      setMovie({
        ...res.data,
        showtimes:
          res.data.showtimes?.length > 0
            ? res.data.showtimes.map((s) => ({
              hall: s.hall,
              time: s.time?.slice(0, 16) || "",
            }))
            : [{ hall: "", time: "" }],
      });
    } catch (err) {
      console.error("Error loading movie:", err);
    }
  };

  const handleChange = (field, value) =>
    setMovie((prev) => ({ ...prev, [field]: value }));

  const handleShowtimeChange = (i, field, value) => {
    const updated = [...movie.showtimes];
    updated[i][field] = value;
    setMovie((prev) => ({ ...prev, showtimes: updated }));
  };

  const addShowtime = () =>
    setMovie((prev) => ({
      ...prev,
      showtimes: [...prev.showtimes, { hall: "", time: "" }],
    }));

  const removeShowtime = (i) =>
    setMovie((prev) => ({
      ...prev,
      showtimes: prev.showtimes.filter((_, idx) => idx !== i),
    }));

  const uploadPoster = async (file) => {
    const data = new FormData();
    data.append("image", file);
    const res = await axios.post("http://localhost:5001/api/upload", data);
    setMovie((prev) => ({ ...prev, posterUrl: res.data.url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedMovieId = movieId;

      if (mode === "add") {
        const res = await axios.post("http://localhost:5001/api/movies", movie, {
          headers: { Authorization: `Bearer ${token}` },
        });
        savedMovieId = res.data._id;
      } else {
        await axios.put(`http://localhost:5001/api/movies/${movieId}`, movie, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await axios.delete(`http://localhost:5001/api/showtimes/movie/${movieId}`);
      }

      for (const s of movie.showtimes) {
        if (!s.hall || !s.time) continue;

        await axios.post(
          "http://localhost:5001/api/showtimes",
          {
            movieId: savedMovieId,
            hall: s.hall,
            // Ensure time is a valid ISO string for the backend
            time: new Date(s.time).toISOString()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert(mode === "add" ? "🎬 Movie Added!" : "Movie Updated!");
      setMovie(emptyMovie);
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Save failed details:", err.response?.data || err.message);
      alert("Error saving movie.");
    }
  };
  return (
    <div className="movie-form-container">
      <h1 id="movie-form-title">
        {mode === "add" ? "Add New Movie 🎬" : "Edit Movie ✏️"}
      </h1>

      <form id="movie-form" className="movie-form" onSubmit={handleSubmit}>
        {/* LEFT COLUMN */}
        <div className="form-left">
          <div className="input-group">
            <label htmlFor="movie-title">Movie Title</label>
            <input
              id="movie-title"
              placeholder="Enter movie title"
              value={movie.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="movie-description">Description</label>
            <textarea
              id="movie-description"
              placeholder="Write movie description..."
              value={movie.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="movie-genre">Genre</label>
              <input
                id="movie-genre"
                placeholder="Action / Drama"
                value={movie.genre}
                onChange={(e) => handleChange("genre", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="movie-language">Language</label>
              <input
                id="movie-language"
                placeholder="English"
                value={movie.language}
                onChange={(e) => handleChange("language", e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="movie-duration">Duration</label>
              <input
                id="movie-duration"
                placeholder="2hr 30min"
                value={movie.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="movie-rating">Rating</label>
              <input
                id="movie-rating"
                placeholder="PG-13 / 8.5"
                value={movie.rating}
                onChange={(e) => handleChange("rating", e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="movie-release-date">Release Date</label>
            <input
              id="movie-release-date"
              type="date"
              value={movie.releaseDate ? movie.releaseDate.split("T")[0] : ""}
              onChange={(e) => handleChange("releaseDate", e.target.value)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="form-right">
          <div className="poster-upload">
            <label htmlFor="movie-poster">Movie Poster</label>
            <div className="upload-box">
              <p>Click to Upload</p>
              <input
                id="movie-poster"
                type="file"
                onChange={(e) => uploadPoster(e.target.files[0])}
              />
            </div>

            {movie.posterUrl && (
              <img
                id="poster-preview"
                className="poster-preview"
                src={`http://localhost:5001${movie.posterUrl}`}
                alt="Poster"
              />
            )}
          </div>

          <div className="input-group">
            <label htmlFor="movie-trailer">Trailer URL (YouTube)</label>
            <input
              id="movie-trailer"
              placeholder="https://www.youtube.com/watch?v=XXXXXXX"
              value={movie.trailerUrl || ""}
              onChange={(e) => handleChange("trailerUrl", e.target.value)}
            />
          </div>

          <div className="showtime-box">
            <h3 id="showtime-heading">Showtimes</h3>

            {movie.showtimes.map((s, i) => (
              <div className="showtime-row" key={i}>
                <input
                  id={`showtime-hall-${i}`}
                  placeholder="Hall"
                  value={s.hall}
                  onChange={(e) =>
                    handleShowtimeChange(i, "hall", e.target.value)
                  }
                />

                <input
                  id={`showtime-time-${i}`}
                  type="datetime-local"
                  value={s.time}
                  onChange={(e) =>
                    handleShowtimeChange(i, "time", e.target.value)
                  }
                />

                <button
                  id={`remove-showtime-${i}`}
                  type="button"
                  className="remove-btn"
                  onClick={() => removeShowtime(i)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              id="add-showtime-btn"
              type="button"
              className="add-showtime"
              onClick={addShowtime}
            >
              + Add Showtime
            </button>
          </div>

          <button
            id="submit-movie-btn"
            type="submit"
            className="submit-btn"
          >
            {mode === "add" ? "Save Movie" : " Update Movie"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MovieForm;
