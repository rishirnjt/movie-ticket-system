// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "./MovieForm.css";

// const emptyMovie = {
//   title: "",
//   description: "",
//   genre: "",
//   posterUrl: "",
//   releaseDate: "",
//   duration: "",
//   rating: "",
//   language: "",
//   showtimes: [{ hall: "", time: "" }],
// };

// const MovieForm = ({ mode = "add", movieId, onSuccess }) => {
//   const [movie, setMovie] = useState(emptyMovie);
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     if (mode === "edit" && movieId) fetchMovie();
//   }, [mode, movieId]);

//   const fetchMovie = async () => {
//     try {
//       const res = await axios.get(`http://localhost:5001/api/movies/${movieId}`);
//       setMovie({
//         ...res.data,
//         showtimes:
//           res.data.showtimes?.length > 0
//             ? res.data.showtimes.map((s) => ({
//               hall: s.hall,
//               time: s.time?.slice(0, 16) || "",
//             }))
//             : [{ hall: "", time: "" }],
//       });
//     } catch (err) {
//       console.error("Error loading movie:", err);
//     }
//   };

//   const handleChange = (field, value) =>
//     setMovie((prev) => ({ ...prev, [field]: value }));

//   const handleShowtimeChange = (i, field, value) => {
//     const updated = [...movie.showtimes];
//     updated[i][field] = value;
//     setMovie((prev) => ({ ...prev, showtimes: updated }));
//   };

//   const addShowtime = () =>
//     setMovie((prev) => ({
//       ...prev,
//       showtimes: [...prev.showtimes, { hall: "", time: "" }],
//     }));

//   const removeShowtime = (i) =>
//     setMovie((prev) => ({
//       ...prev,
//       showtimes: prev.showtimes.filter((_, idx) => idx !== i),
//     }));

//   const uploadPoster = async (file) => {
//     const data = new FormData();
//     data.append("image", file);
//     const res = await axios.post("http://localhost:5001/api/upload", data);
//     setMovie((prev) => ({ ...prev, posterUrl: res.data.url }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       let savedMovieId = movieId;

//       if (mode === "add") {
//         const res = await axios.post("http://localhost:5001/api/movies", movie, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         savedMovieId = res.data._id;
//       } else {
//         await axios.put(
//           `http://localhost:5001/api/movies/${movieId}`,
//           movie,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         await axios.delete(
//           `http://localhost:5001/api/showtimes/movie/${movieId}`
//         );
//       }

//       // Save showtimes
//       for (const s of movie.showtimes) {
//         if (!s.hall || !s.time) continue;
//         await axios.post(
//           "http://localhost:5001/api/showtimes",
//           { movieId: savedMovieId, hall: s.hall, time: s.time },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       }

//       alert(mode === "add" ? "🎬 Movie Added!" : "✅ Movie Updated!");
//       setMovie(emptyMovie);
//       onSuccess && onSuccess();
//     } catch (err) {
//       console.error("Save failed:", err);
//       alert("Error saving movie.");
//     }
//   };

//   return (
//     <div className="movie-form-container">
//       <form className="movie-block" onSubmit={handleSubmit}>
//         <h3>{mode === "add" ? "Add Movie" : "Edit Movie"}</h3>

//         <input
//           id="movie-title"
//           name="title"
//           placeholder="Title"
//           value={movie.title}
//           onChange={(e) => handleChange("title", e.target.value)}
//           required
//         />

//         <textarea
//           id="movie-description"
//           name="description"
//           placeholder="Description"
//           value={movie.description}
//           onChange={(e) => handleChange("description", e.target.value)}
//         />

//         <input
//           id="movie-genre"
//           name="genre"
//           placeholder="Genre"
//           value={movie.genre}
//           onChange={(e) => handleChange("genre", e.target.value)}
//         />

//         <input
//           id="movie-poster"
//           name="poster"
//           type="file"
//           onChange={(e) => uploadPoster(e.target.files[0])}
//         />

//         <input
//           id="movie-release-date"
//           name="releaseDate"
//           type="date"
//           value={movie.releaseDate ? movie.releaseDate.split("T")[0] : ""}
//           onChange={(e) => handleChange("releaseDate", e.target.value)}
//         />

//         <input
//           id="movie-duration"
//           name="duration"
//           placeholder="Duration (e.g. 2hr 30min)"
//           value={movie.duration}
//           onChange={(e) => handleChange("duration", e.target.value)}
//         />

//         <input
//           id="movie-rating"
//           name="rating"
//           placeholder="Rating (e.g. PG-13)"
//           value={movie.rating}
//           onChange={(e) => handleChange("rating", e.target.value)}
//         />

//         <input
//           id="movie-language"
//           name="language"
//           placeholder="Language"
//           value={movie.language}
//           onChange={(e) => handleChange("language", e.target.value)}
//         />


//         <h4>Showtimes</h4>
//         {movie.showtimes.map((s, i) => (
//           <div key={i} className="showtime-group">
//             <input
//               id={`showtime-hall-${i}`}
//               name={`showtimeHall${i}`}
//               placeholder="Hall"
//               value={s.hall}
//               onChange={(e) => handleShowtimeChange(i, "hall", e.target.value)}
//             />

//             <input
//               id={`showtime-time-${i}`}
//               name={`showtimeTime${i}`}
//               type="datetime-local"
//               value={s.time}
//               onChange={(e) => handleShowtimeChange(i, "time", e.target.value)}
//             />

//             <button
//               id={`remove-showtime-${i}`}
//               type="button"
//               onClick={() => removeShowtime(i)}
//             >
//               Remove
//             </button>
//           </div>
//         ))}
//         <button id="add-showtime-btn" type="button" onClick={addShowtime}>
//           + Add Showtime
//         </button>

//         <button id="submit-movie-btn" type="submit" className="submit-btn">
//           {mode === "add" ? "Save Movie" : "Update Movie"}
//         </button>
//       </form >
//     </div >
//   );
// };

// export default MovieForm;

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

    // 1. Save Movie
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

    // 2. Save Showtimes (The likely source of the error)
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

    alert(mode === "add" ? "🎬 Movie Added!" : "✅ Movie Updated!");
    setMovie(emptyMovie);
    onSuccess && onSuccess();
  } catch (err) {
    console.error("Save failed details:", err.response?.data || err.message);
    alert("Error saving movie.");
  }
};

  return (
    <div className="movie-form-container">
      <form className="movie-block" onSubmit={handleSubmit}>
        <h3>{mode === "add" ? "Add Movie" : "Edit Movie"}</h3>

        <input
          id="movie-title"
          placeholder="Title"
          value={movie.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
        />

        <textarea
          id="movie-description"
          placeholder="Description"
          value={movie.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        <input
          id="movie-genre"
          placeholder="Genre"
          value={movie.genre}
          onChange={(e) => handleChange("genre", e.target.value)}
        />

        <input
          id="movie-poster"
          type="file"
          onChange={(e) => uploadPoster(e.target.files[0])}
        />

        {movie.posterUrl && (
          <img
            id="poster-preview"
            src={`http://localhost:5001${movie.posterUrl}`}
            alt="Poster"
            width={150}
          />
        )}

        <input
          id="movie-release-date"
          type="date"
          value={movie.releaseDate ? movie.releaseDate.split("T")[0] : ""}
          onChange={(e) => handleChange("releaseDate", e.target.value)}
        />

        <input
          id="movie-duration"
          placeholder="Duration (e.g. 2hr 30min)"
          value={movie.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
        />

        <input
          id="movie-rating"
          placeholder="Rating (e.g. PG-13)"
          value={movie.rating}
          onChange={(e) => handleChange("rating", e.target.value)}
        />

        <input
          id="movie-language"
          placeholder="Language"
          value={movie.language}
          onChange={(e) => handleChange("language", e.target.value)}
        />

        <h4>Showtimes</h4>
        {movie.showtimes.map((s, i) => (
          <div key={i} className="showtime-group">
            <input
              id={`showtime-hall-${i}`}
              placeholder="Hall"
              value={s.hall}
              onChange={(e) => handleShowtimeChange(i, "hall", e.target.value)}
            />
            <input
              id={`showtime-time-${i}`}
              type="datetime-local"
              value={s.time}
              onChange={(e) => handleShowtimeChange(i, "time", e.target.value)}
            />
            <button id={`remove-showtime-${i}`} type="button" onClick={() => removeShowtime(i)}>
              Remove
            </button>
          </div>
        ))}

        <button id="add-showtime-btn" type="button" onClick={addShowtime}>
          + Add Showtime
        </button>

        <button id="submit-movie-btn" type="submit" className="submit-btn">
          {mode === "add" ? "Save Movie" : "Update Movie"}
        </button>
      </form>
    </div>
  );
};

export default MovieForm;
