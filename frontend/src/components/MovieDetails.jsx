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
    <div className="movie-hero-page">

      <div className="hero-content">

        {/* LEFT SIDE */}
        <div className="hero-left">
          <div className="poster-wrapper">
            <img
              src={
                movie.posterUrl?.startsWith("http")
                  ? movie.posterUrl
                  : `http://localhost:5001${movie.posterUrl}`
              }
              alt={movie.title}
            />
          </div>

          <div className="movie-text">
            <h1>{movie.title}</h1>
            <p className="description">{movie.description}</p>
          </div>
        </div>

        {/* RIGHT GLASS PANEL */}
        <div className="hero-right">

          <div className="info-item">
            <span>GENRE</span>
            <p>{movie.genre}</p>
          </div>

          <div className="info-item">
            <span>LANGUAGE</span>
            <p>{movie.language}</p>
          </div>

          <div className="info-item">
            <span>DURATION</span>
            <p>{movie.duration}</p>
          </div>

          <div className="info-item">
            <span>RELEASE DATE</span>
            <p>
              {new Date(movie.releaseDate).toLocaleDateString()}
            </p>
          </div>

          <h3 className="showtime-title">Showtimes</h3>

          {movie.showtimes?.length > 0 ? (
            <div className="showtimes">
              {movie.showtimes.map((showtime) => {
                const showtimeDate = new Date(showtime.startTime);
                const now = new Date();
                const isPast = showtimeDate < now;

                return (
                  <button
                    key={showtime._id}
                    className={`showtime-btn ${isPast ? "past-showtime" : ""}`}
                    disabled={isPast}
                    onClick={() =>
                      navigate(`/seats/${movie._id}`, {
                        state: { selectedShowtime: showtime },
                      })
                    }
                  >
                    {showtime.screenId?.name || "Screen"} — {showtimeDate.toLocaleDateString()}{" "}
                    {showtimeDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isPast && " (Closed)"}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="no-showtimes">No showtimes available</p>
          )}

          {trailerId && (
            <div className="trailer-mini">
              <iframe
                src={`https://www.youtube.com/embed/${trailerId}`}
                title="Movie Trailer"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div >
  );
};
export default MovieDetails;
