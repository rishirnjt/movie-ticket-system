import React, { useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import './AddMovie.css';
import { useNavigate } from "react-router-dom";

const AddMovies = () => {
  const [movies, setMovies] = useState([
    {
      title: '',
      description: '',
      genre: '',
      posterUrl: '',
      releaseDate: '',
      duration: '',
      rating: '',
      language: '',
      showtimes: []
    }
  ]);

  const navigate = useNavigate();

  // Handle input change for movie fields
  const handleMovieChange = (index, field, value) => {
    const updatedMovies = [...movies];
    updatedMovies[index][field] = value;
    setMovies(updatedMovies);
  };

  // Handle showtime change
  const handleShowtimeChange = (movieIndex, showtimeIndex, field, value) => {
    const updatedMovies = [...movies];
    updatedMovies[movieIndex].showtimes[showtimeIndex][field] = value;
    setMovies(updatedMovies);
  };

  // Add new movie block
  const addMovie = () => {
    setMovies([
      ...movies,
      {
        title: '',
        description: '',
        genre: '',
        posterUrl: '',
        releaseDate: '',
        duration: '',
        rating: '',
        language: '',
        showtimes: [{ hall: '', time: '' }]
      }
    ]);
  };

  // Remove movie block
  const removeMovie = (index) => {
    if (movies.length > 1) {
      const updated = [...movies];
      updated.splice(index, 1);
      setMovies(updated);
    }
  };

  // Add showtime for a movie
  const addShowtime = (movieIndex) => {
    const updatedMovies = [...movies];
    updatedMovies[movieIndex].showtimes.push({ hall: '', time: '' });
    setMovies(updatedMovies);
  };

  // Remove showtime for a movie
  const removeShowtime = (movieIndex, showtimeIndex) => {
    const updatedMovies = [...movies];
    updatedMovies[movieIndex].showtimes.splice(showtimeIndex, 1);
    setMovies(updatedMovies);
  };

  // Handle poster upload for a specific movie
  const handlePosterUpload = async (movieIndex, file) => {
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await axios.post('http://localhost:5001/api/upload', data);
      const updatedMovies = [...movies];
      updatedMovies[movieIndex].posterUrl = res.data.url;
      setMovies(updatedMovies);
    } catch (err) {
      alert("Poster upload failed");
      console.error(err);
    }
  };

  //submit movies
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      for (const movie of movies) {
        //  Create the movie
        const movieRes = await axios.post(
          "http://localhost:5001/api/movies/add-multiple",
          [{
            title: movie.title,
            description: movie.description,
            genre: movie.genre,
            posterUrl: movie.posterUrl,
            releaseDate: movie.releaseDate,
            duration: movie.duration,
            rating: movie.rating,
            language: movie.language
          }],
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const createdMovie = movieRes.data.movies?.[0];

        if (!createdMovie?._id) {
          console.error("Movie creation failed:", movieRes.data);
          alert(`Failed to add movie: ${movie.title}`);
          continue; // skip to next movie
        }

        const movieId = createdMovie._id;

        //  Create showtimes for this movie
        for (const showtime of movie.showtimes) {
          if (!showtime.hall || !showtime.time) continue;
          await axios.post(
            "http://localhost:5001/api/showtimes/add",
            {
              movieId,
              hall: showtime.hall,
              time: new Date(showtime.time) // convert string to Date
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      alert("Movies and showtimes added successfully!");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Error adding movies:", err);
      alert("Failed to add movies. Check console for details.");
    }
  };


  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="content-wrapper">
        <div className="add-movie-cont">
          <h2>Add Multiple Movies</h2>

          <form onSubmit={handleSubmit} className="add-movie-form">
            {movies.map((movie, movieIndex) => (
              <div key={movieIndex} className="movie-block">
                <h3>Movie {movieIndex + 1}</h3>

                <input
                  id="add-title"
                  placeholder="Title"
                  value={movie.title}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "title", e.target.value)
                  }
                  required
                />

                <textarea
                  id="add-description"
                  placeholder="Description"
                  value={movie.description}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "description", e.target.value)
                  }
                />

                <input
                  id="add-genre"
                  placeholder="Genre"
                  value={movie.genre}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "genre", e.target.value)
                  }
                />

                <input
                  id="add-poster"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handlePosterUpload(movieIndex, e.target.files[0])
                  }
                />

                {movie.posterUrl && (
                  <img
                    src={`http://localhost:5001${movie.posterUrl}`}
                    alt="Poster Preview"
                    style={{ width: "150px", marginTop: "10px" }}
                  />
                )}

                <input
                  id="add-release-date"
                  type="date"
                  value={movie.releaseDate}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "releaseDate", e.target.value)
                  }
                />

                <input
                  id="add-duration"
                  placeholder="Duration"
                  value={movie.duration}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "duration", e.target.value)
                  }
                />

                <input
                  id="add-rating"
                  placeholder="Rating"
                  value={movie.rating}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "rating", e.target.value)
                  }
                />

                <input
                  id="add-language"
                  placeholder="Language"
                  value={movie.language}
                  onChange={(e) =>
                    handleMovieChange(movieIndex, "language", e.target.value)
                  }
                />

                <label id="add-showtimes-label">Showtimes:</label>

                {movie.showtimes.map((showtime, showtimeIndex) => (
                  <div key={showtimeIndex} className="showtime-group">
                    <input
                      id="add-hall"
                      placeholder="Hall"
                      value={showtime.hall}
                      onChange={(e) =>
                        handleShowtimeChange(
                          movieIndex,
                          showtimeIndex,
                          "hall",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="datetime-local"
                      value={showtime.time}
                      onChange={(e) =>
                        handleShowtimeChange(movieIndex, showtimeIndex, "time", e.target.value)
                      }
                    />


                    <button
                      id="remove-showtime-btn"
                      type="button"
                      onClick={() =>
                        removeShowtime(movieIndex, showtimeIndex)
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  id="add-showtime-btn"
                  type="button"
                  onClick={() => addShowtime(movieIndex)}
                >
                  Add Showtime
                </button>

                <button
                  id="remove-movie-btn"
                  type="button"
                  onClick={() => removeMovie(movieIndex)}
                >
                  Remove Movie
                </button>

                <hr />
              </div>
            ))}

            <button id="add-movie-btn" type="button" onClick={addMovie}>
              Add Another Movie
            </button>

            <button id="submit-movies-btn" type="submit">
              Submit All Movies
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddMovies;
