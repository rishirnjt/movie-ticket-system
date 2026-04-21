import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MovieForm.css";
import { toast } from "react-toastify";

const API_URL = "http://localhost:5001";

const emptyMovie = {
  title: "",
  description: "",
  genre: "",
  posterUrl: "",
  trailerUrl: "",
  releaseDate: "",
  movieStartDate: "",
  movieEndDate: "",
  duration: "",
  rating: "",
  language: "",
  showtimes: [{ screenId: "", startTime: "", endTime: "" }],
};

const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateTimeForInput = (dateValue) => {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const MovieForm = ({ mode = "add", movieId, onSuccess }) => {
  const [movie, setMovie] = useState(emptyMovie);
  const [screens, setScreens] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchScreens();
    if (mode === "edit" && movieId) {
      fetchMovie();
    }
  }, [mode, movieId]);

  const fetchMovie = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/movies/${movieId}`);

      setMovie({
        title: res.data.title || "",
        description: res.data.description || "",
        genre: res.data.genre || "",
        posterUrl: res.data.posterUrl || "",
        trailerUrl: res.data.trailerUrl || "",
        releaseDate: formatDateForInput(res.data.releaseDate),
        movieStartDate: formatDateForInput(res.data.movieStartDate),
        movieEndDate: formatDateForInput(res.data.movieEndDate),
        duration: res.data.duration || "",
        rating: res.data.rating || "",
        language: res.data.language || "",
        showtimes:
          res.data.showtimes?.length > 0
            ? res.data.showtimes.map((s) => ({
              screenId: s.screenId?._id || s.screenId || "",
              startTime: formatDateTimeForInput(s.startTime),
              endTime: formatDateTimeForInput(s.endTime),
            }))
            : [{ screenId: "", startTime: "", endTime: "" }],
      });
    } catch (err) {
      console.error("Error loading movie:", err);
      toast.error("Failed to load movie");
    }
  };

  const fetchScreens = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/screens`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScreens(res.data || []);
    } catch (err) {
      console.error("Error loading screens:", err.response?.data || err.message);
      toast.error("Failed to load screens");
    }
  };

  const handleChange = (field, value) => {
    setMovie((prev) => ({ ...prev, [field]: value }));
  };

  const handleShowtimeChange = (index, field, value) => {
    setMovie((prev) => {
      const updatedShowtimes = [...prev.showtimes];
      updatedShowtimes[index] = {
        ...updatedShowtimes[index],
        [field]: value,
      };

      if (field === "startTime" && prev.duration) {
        const start = new Date(value);

        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setMinutes(end.getMinutes() + Number(prev.duration));
          updatedShowtimes[index].endTime = formatDateTimeForInput(end);
        }
      }

      return { ...prev, showtimes: updatedShowtimes };
    });
  };

  const addShowtime = () => {
    setMovie((prev) => ({
      ...prev,
      showtimes: [
        ...prev.showtimes,
        { screenId: "", startTime: "", endTime: "" },
      ],
    }));
  };

  const removeShowtime = (index) => {
    setMovie((prev) => ({
      ...prev,
      showtimes: prev.showtimes.filter((_, i) => i !== index),
    }));
  };

  const uploadPoster = async (file) => {
    if (!file) return;

    try {
      const data = new FormData();
      data.append("image", file);

      const res = await axios.post(`${API_URL}/api/upload`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMovie((prev) => ({ ...prev, posterUrl: res.data.url }));
      toast.success("Poster uploaded");
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      toast.error("Poster upload failed");
    }
  };

  const validateForm = () => {
    if (!movie.title.trim()) {
      toast.error("Movie title is required");
      return false;
    }

    if (!movie.description.trim()) {
      toast.error("Description is required");
      return false;
    }

    if (!movie.duration || Number(movie.duration) < 1) {
      toast.error("Duration must be at least 1 minute");
      return false;
    }

    if (!movie.movieStartDate || !movie.movieEndDate) {
      toast.error("Movie start date and end date are required");
      return false;
    }

    if (movie.movieStartDate > movie.movieEndDate) {
      toast.error("Movie start date cannot be after end date");
      return false;
    }

    for (let i = 0; i < movie.showtimes.length; i++) {
      const s = movie.showtimes[i];
      const hasAnyValue = s.screenId || s.startTime || s.endTime;

      if (!hasAnyValue) continue;

      if (!s.screenId || !s.startTime || !s.endTime) {
        toast.error(`Please complete all fields for showtime ${i + 1}`);
        return false;
      }

      if (new Date(s.endTime) <= new Date(s.startTime)) {
        toast.error(`End time must be after start time for showtime ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (addAnother = false) => {
    try {
      if (!validateForm()) return;

      let savedMovieId = movieId;

      const moviePayload = {
        title: movie.title.trim(),
        description: movie.description.trim(),
        genre: movie.genre.trim(),
        posterUrl: movie.posterUrl || undefined,
        trailerUrl: movie.trailerUrl.trim() || undefined,
        releaseDate: movie.releaseDate || undefined,
        movieStartDate: movie.movieStartDate || undefined,
        movieEndDate: movie.movieEndDate || undefined,
        duration: movie.duration ? Number(movie.duration) : undefined,
        rating: movie.rating?.toString().trim() || "",
        language: movie.language.trim(),
      };

      if (mode === "add") {
        const res = await axios.post(`${API_URL}/api/movies`, moviePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        savedMovieId = res.data._id;
      } else {
        await axios.put(`${API_URL}/api/movies/${movieId}`, moviePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        await axios.delete(`${API_URL}/api/showtimes/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      for (const s of movie.showtimes) {
        const hasAnyValue = s.screenId || s.startTime || s.endTime;
        if (!hasAnyValue) continue;

        const payload = {
          movieId: savedMovieId,
          screenId: s.screenId,
          startTime: new Date(s.startTime).toISOString(),
          endTime: new Date(s.endTime).toISOString(),
        };

        await axios.post(`${API_URL}/api/showtimes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(
        mode === "add"
          ? "Movie added successfully"
          : "Movie updated successfully"
      );

      if (addAnother) {
        setMovie(emptyMovie);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Save failed details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      toast.error(err.response?.data?.message || "Error saving movie");
    }
  };

  return (
    <div className="movie-form-container">
      <h1 id="movie-form-title">
        {mode === "add" ? "Add New Movie" : "Edit Movie"}
      </h1>

      <form
        id="movie-form"
        className="movie-form"
        onSubmit={(e) => e.preventDefault()}
      >
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
              <label htmlFor="movie-duration">Duration (minutes)</label>
              <input
                id="movie-duration"
                type="number"
                min="1"
                placeholder="150"
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
              value={movie.releaseDate}
              onChange={(e) => handleChange("releaseDate", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="movie-start-date">Movie Start Date</label>
            <input
              id="movie-start-date"
              type="date"
              value={movie.movieStartDate}
              onChange={(e) => handleChange("movieStartDate", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="movie-end-date">Movie End Date</label>
            <input
              id="movie-end-date"
              type="date"
              value={movie.movieEndDate}
              onChange={(e) => handleChange("movieEndDate", e.target.value)}
            />
          </div>
        </div>

        <div className="form-right">
          <div className="poster-upload">
            <label htmlFor="movie-poster">Movie Poster</label>

            <label htmlFor="movie-poster" className="upload-box">
              <p>Click to Upload</p>
            </label>

            <input
              id="movie-poster"
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={(e) => uploadPoster(e.target.files[0])}
            />

            {movie.posterUrl && (
              <img
                id="poster-preview"
                className="poster-preview"
                src={
                  movie.posterUrl.startsWith("http")
                    ? movie.posterUrl
                    : `${API_URL}${movie.posterUrl}`
                }
                alt="Poster"
              />
            )}
          </div>

          <div className="input-group">
            <label htmlFor="movie-trailer">Trailer URL (YouTube)</label>
            <input
              id="movie-trailer"
              placeholder="https://www.youtube.com/watch?v=XXXXXXX"
              value={movie.trailerUrl}
              onChange={(e) => handleChange("trailerUrl", e.target.value)}
            />
          </div>

          <div className="showtime-box">
            <h3 id="showtime-heading">Showtimes</h3>

            {movie.showtimes.map((s, i) => (
              <div className="showtime-row" key={i}>
                <select
                  value={s.screenId}
                  onChange={(e) =>
                    handleShowtimeChange(i, "screenId", e.target.value)
                  }
                >
                  <option value="">Select Screen</option>
                  {screens.map((screen) => (
                    <option key={screen._id} value={screen._id}>
                      {screen.name} ({screen.format})
                    </option>
                  ))}
                </select>

                <input
                  type="datetime-local"
                  value={s.startTime}
                  onChange={(e) =>
                    handleShowtimeChange(i, "startTime", e.target.value)
                  }
                />

                <input
                  type="datetime-local"
                  value={s.endTime}
                  onChange={(e) =>
                    handleShowtimeChange(i, "endTime", e.target.value)
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

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="submit-movie-btn"
              type="button"
              className="submit-btn"
              onClick={() => handleSubmit(false)}
            >
              {mode === "add" ? "Save Movie" : "Update Movie"}
            </button>

            {mode === "add" && (
              <button
                type="button"
                className="submit-btn"
                style={{ backgroundColor: "#444" }}
                onClick={() => handleSubmit(true)}
              >
                Save & Add Another
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MovieForm;