import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MovieForm.css";

const emptyMovie = {
  title: "",
  description: "",
  genre: "",
  posterUrl: "",
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
        await axios.put(
          `http://localhost:5001/api/movies/${movieId}`,
          movie,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await axios.delete(
          `http://localhost:5001/api/showtimes/movie/${movieId}`
        );
      }

      // Save showtimes
      for (const s of movie.showtimes) {
        if (!s.hall || !s.time) continue;
        await axios.post(
          "http://localhost:5001/api/showtimes",
          { movieId: savedMovieId, hall: s.hall, time: s.time },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert(mode === "add" ? "🎬 Movie Added!" : "✅ Movie Updated!");
      setMovie(emptyMovie);
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving movie.");
    }
  };

  return (
    <div className="movie-form-container">
      <form className="movie-block" onSubmit={handleSubmit}>
        <h3>{mode === "add" ? "Add Movie" : "Edit Movie"}</h3>

        <input
          placeholder="Title"
          value={movie.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={movie.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        <input
          placeholder="Genre"
          value={movie.genre}
          onChange={(e) => handleChange("genre", e.target.value)}
        />

        <input
          type="file"
          onChange={(e) => uploadPoster(e.target.files[0])}
        />

        {movie.posterUrl && (
          <img
            src={`http://localhost:5001${movie.posterUrl}`}
            alt="Poster"
            width={150}
          />
        )}

        <input
          type="date"
          value={movie.releaseDate ? movie.releaseDate.split("T")[0] : ""}
          onChange={(e) => handleChange("releaseDate", e.target.value)}
        />

        <input
          placeholder="Duration (e.g. 2hr 30min)"
          value={movie.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
        />

        <input
          placeholder="Rating (e.g. PG-13)"
          value={movie.rating}
          onChange={(e) => handleChange("rating", e.target.value)}
        />

        <input
          placeholder="Language"
          value={movie.language}
          onChange={(e) => handleChange("language", e.target.value)}
        />

        <h4>Showtimes</h4>
        {movie.showtimes.map((s, i) => (
          <div key={i} className="showtime-group">
            <input
              placeholder="Hall"
              value={s.hall}
              onChange={(e) => handleShowtimeChange(i, "hall", e.target.value)}
            />
            <input
              type="datetime-local"
              value={s.time}
              onChange={(e) => handleShowtimeChange(i, "time", e.target.value)}
            />
            <button type="button" onClick={() => removeShowtime(i)}>
              Remove
            </button>
          </div>
        ))}

        <button type="button" onClick={addShowtime}>
          + Add Showtime
        </button>

        <button type="submit" className="submit-btn">
          {mode === "add" ? "Save Movie" : "Update Movie"}
        </button>
      </form>
    </div>
  );
};

export default MovieForm;
