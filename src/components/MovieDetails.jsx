import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MovieDetails.css";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/movies/${id}`
        );
        console.log("Movie details:", res.data);
        setMovie(res.data);
      } catch (err) {
        console.error("Error loading movie", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const getYouTubeId = (url) => {
    if (!url) return null;

    const regExp =
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  if (loading) {
    return <h2 style={{ color: "white" }}>Loading movie...</h2>;
  }

  if (!movie) {
    return <h2 style={{ color: "white" }}>Movie not found</h2>;
  }

  const trailerId = getYouTubeId(movie.trailerUrl);

  return (
    <div className="movie-details-page">
      <div className="movie-details-card">
        {/* POSTER */}
        <img
          src={
            movie.posterUrl?.startsWith("http")
              ? movie.posterUrl
              : `http://localhost:5001${movie.posterUrl}`
          }
          alt={movie.title}
          className="poster"
        />

        {/* INFO */}
        <div className="movie-info">
          <h1>{movie.title}</h1>

          <p>
            <strong>Genre:</strong> {movie.genre}
          </p>

          <p>
            <strong>Language:</strong> {movie.language}
          </p>

          <p>
            <strong>Duration:</strong> {movie.duration} mins
          </p>

          <p>
            <strong>Release Date:</strong>{" "}
            {new Date(movie.releaseDate).toLocaleDateString()}
          </p>

          {/* SHOWTIMES */}
          <h3>Available Showtimes</h3>
          {movie.showtimes && movie.showtimes.length > 0 ? (
            <div className="showtimes">
              {movie.showtimes.map((showtime) => (
                <button
                  key={showtime._id}
                  className="showtime-btn"
                  onClick={() =>
                    navigate(`/seats/${movie._id}`, {
                      state: { selectedShowtime: showtime },
                    })
                  }
                >
                  {showtime.hall} —{" "}
                  {new Date(showtime.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          ) : (
            <p>No showtimes available</p>
          )}

          {/* 🎬 TRAILER */}
          {trailerId && (
            <div className="trailer-section">
              <h3>🎬 Watch Trailer</h3>
              <div className="trailer-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerId}`}
                  title="Movie Trailer"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Optional warning if URL exists but invalid */}
          {movie.trailerUrl && !trailerId && (
            <p style={{ color: "red" }}>
              Invalid YouTube trailer link
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
