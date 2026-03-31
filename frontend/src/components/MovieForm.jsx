import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MovieForm.css";
import { toast } from "react-toastify";

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
  showtimes: [{ screenId: "", startTime: "", endTime: "", basePrice: "" }],
};

const MovieForm = ({ mode = "add", movieId, onSuccess }) => {
  const [movie, setMovie] = useState(emptyMovie);
  const [screens, setScreens] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchScreens();
    if (mode === "edit" && movieId) fetchMovie();
  }, [mode, movieId]);

  const fetchMovie = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
      setMovie({
        ...res.data,
        duration: res.data.duration || "",
        rating: res.data.rating || "",
        releaseDate: res.data.releaseDate
          ? new Date(res.data.releaseDate).toISOString().split("T")[0]
          : "",
        movieStartDate: res.data.movieStartDate
          ? new Date(res.data.movieStartDate).toISOString().split("T")[0]
          : "",
        movieEndDate: res.data.movieEndDate
          ? new Date(res.data.movieEndDate).toISOString().split("T")[0]
          : "",
      showtimes:
      res.data.showtimes?.length > 0
        ? res.data.showtimes.map((s) => ({
          screenId: s.screenId?._id || s.screenId || "",
          startTime: s.startTime
            ? new Date(s.startTime)
              .toLocaleString("sv-SE", { timeZone: "Asia/Kathmandu" })
              .replace(" ", "T")
              .slice(0, 16)
            : "",
          endTime: s.endTime
            ? new Date(s.endTime)
              .toLocaleString("sv-SE", { timeZone: "Asia/Kathmandu" })
              .replace(" ", "T")
              .slice(0, 16)
            : "",
          basePrice: s.basePrice ?? "",
        }))
        : [{ screenId: "", startTime: "", endTime: "", basePrice: "" }],
      });
  } catch (err) {
    console.error("Error loading movie:", err);
  }
};

const fetchScreens = async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/screens", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Loaded screens:", res.data);
    setScreens(res.data);
  } catch (err) {
    console.error("Error loading screens:", err.response?.data || err.message);
  }
};

const handleChange = (field, value) =>
  setMovie((prev) => ({ ...prev, [field]: value }));

const handleShowtimeChange = (i, field, value) => {
  const updated = [...movie.showtimes];
  updated[i][field] = value;

  // 🔥 auto-calculate endTime
  if (field === "startTime" && movie.duration) {
    const start = new Date(value);

    if (!isNaN(start.getTime())) {
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + Number(movie.duration));

      const localEnd = new Date(
        end.getTime() - end.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);

      updated[i].endTime = localEnd;
    }
  }

  setMovie((prev) => ({ ...prev, showtimes: updated }));
};

const addShowtime = () =>
  setMovie((prev) => ({
    ...prev,
    showtimes: [
      ...prev.showtimes,
      { screenId: "", startTime: "", endTime: "", basePrice: "" },
    ],
  }));

const removeShowtime = (i) =>
  setMovie((prev) => ({
    ...prev,
    showtimes: prev.showtimes.filter((_, idx) => idx !== i),
  }));

const uploadPoster = async (file) => {
  if (!file) return;
  try {


    const data = new FormData();
    data.append("image", file);
    const res = await axios.post("http://localhost:5001/api/upload", data);
    setMovie((prev) => ({ ...prev, posterUrl: res.data.url }));
  } catch (err) {
    console.error("Upload failed:", err.response?.data || err.message);
    toast.error("Poster upload failed");
  }
};

const handleSubmit = async (e, addAnother = false) => {
  try {
    let savedMovieId = movieId;

    const moviePayload = {
      ...movie,

      duration: movie.duration ? Number(movie.duration) : undefined,
      rating: movie.rating ? Number(movie.rating) : undefined,

      posterUrl: movie.posterUrl || undefined,
      trailerUrl: movie.trailerUrl || undefined,

      releaseDate: movie.releaseDate || undefined,
      movieStartDate: movie.movieStartDate || undefined,
      movieEndDate: movie.movieEndDate || undefined,

      showtimes: undefined,
    };
    if (mode === "add") {
      const res = await axios.post(
        "http://localhost:5001/api/movies",
        moviePayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      savedMovieId = res.data._id;
    } else {
      await axios.put(
        `http://localhost:5001/api/movies/${movieId}`,
        moviePayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await axios.delete(
        `http://localhost:5001/api/showtimes/movie/${movieId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

    for (const s of movie.showtimes) {
      if (!s.screenId || !s.startTime || !s.endTime || s.basePrice === "") {
        continue;
      }

      const payload = {
        movieId: savedMovieId,
        screenId: s.screenId,
        startTime: new Date(s.startTime).toISOString(),
        endTime: new Date(s.endTime).toISOString(),
        basePrice: Number(s.basePrice),
      };

      console.log("Submitting showtime payload:", payload);

      try {
        await axios.post("http://localhost:5001/api/showtimes", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Showtime POST failed:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          payload,
        });
        throw err;
      }
    }

    toast.success(mode === "add" ? "🎬 Movie Added!" : "Movie Updated!");

    if (addAnother) {
      setMovie(emptyMovie);
    } else {
      onSuccess && onSuccess();
    }
  } catch (err) {
    console.error("Save failed details:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    toast.error("Error saving movie.");
  }
};

return (
  <div className="movie-form-container">
    <h1 id="movie-form-title">
      {mode === "add" ? "Add New Movie 🎬" : "Edit Movie ✏️"}
    </h1>

    <form id="movie-form" className="movie-form">
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
              placeholder="150"
              value={movie.duration || ""}
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
          <label>Movie Start Date</label>
          <input
            type="date"
            value={movie.movieStartDate}
            onChange={(e) => handleChange("movieStartDate", e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Movie End Date</label>
          <input
            type="date"
            value={movie.movieEndDate}
            onChange={(e) => handleChange("movieEndDate", e.target.value)}
          />
        </div>
      </div>

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
              <select
                value={s.screenId}
                onChange={(e) => handleShowtimeChange(i, "screenId", e.target.value)}
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

              <input
                type="number"
                placeholder="Base Price"
                value={s.basePrice}
                onChange={(e) =>
                  handleShowtimeChange(i, "basePrice", e.target.value)
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
            onClick={(e) => handleSubmit(e, false)}
          >
            {mode === "add" ? "Save Movie" : "Update Movie"}
          </button>

          {mode === "add" && (
            <button
              type="button"
              className="submit-btn"
              style={{ backgroundColor: "#444" }}
              onClick={(e) => handleSubmit(e, true)}
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