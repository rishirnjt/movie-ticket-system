import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./MovieDetails.css";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`${API_URL}/api/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        console.error("Error loading movie", err);
        setError("Failed to load movie details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const getYouTubeId = (url) => {
    if (!url) return null;

    const regExp =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const trailerId = useMemo(() => getYouTubeId(movie?.trailerUrl), [movie]);

  const posterUrl = useMemo(() => {
    if (!movie?.posterUrl) return "";
    return movie.posterUrl.startsWith("http")
      ? movie.posterUrl
      : `${API_URL}${movie.posterUrl}`;
  }, [movie]);

  const groupedShowtimes = useMemo(() => {
    if (!movie?.showtimes?.length) return {};

    return movie.showtimes.reduce((acc, showtime) => {
      const date = new Date(showtime.startTime);
      const key = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      if (!acc[key]) acc[key] = [];
      acc[key].push(showtime);
      return acc;
    }, {});
  }, [movie]);

  if (loading) {
    return (
      <div className="movie-details-state">
        <div className="movie-details-card">
          <h2>Loading movie...</h2>
          <p>Please wait while we fetch the details.</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-details-state">
        <div className="movie-details-card">
          <h2>Movie not found</h2>
          <p>{error || "The requested movie could not be found."}</p>
          <button onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-hero-page">
      <div className="hero-overlay" />

      <div className="hero-content">
        <div className="hero-left">
          <div className="poster-wrapper">
            <img src={posterUrl} alt={movie.title} />
          </div>

          <div className="movie-text">
            <span className="movie-badge">{movie.status || "Now Showing"}</span>
            <h1>{movie.title}</h1>

            <div className="movie-meta-inline">
              <span>{movie.genre || "N/A"}</span>
              <span>{movie.language || "N/A"}</span>
              <span>{movie.duration || "N/A"}</span>
            </div>

            <p className="description">
              {movie.description || "No description available for this movie."}
            </p>
          </div>
        </div>

        <div className="hero-right">
          <div className="details-panel">
            <h3>Movie Info</h3>

            <div className="info-item">
              <span>Genre</span>
              <p>{movie.genre || "N/A"}</p>
            </div>

            <div className="info-item">
              <span>Language</span>
              <p>{movie.language || "N/A"}</p>
            </div>

            <div className="info-item">
              <span>Duration</span>
              <p>{movie.duration || "N/A"}</p>
            </div>

            <div className="info-item">
              <span>Release Date</span>
              <p>
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="details-panel">
            <h3 className="showtime-title">Showtimes</h3>

            {Object.keys(groupedShowtimes).length > 0 ? (
              <div className="showtime-groups">
                {Object.entries(groupedShowtimes).map(([dateLabel, items]) => (
                  <div key={dateLabel} className="showtime-group">
                    <h4>{dateLabel}</h4>

                    <div className="showtimes">
                      {items.map((showtime) => {
                        const showtimeDate = new Date(showtime.startTime);
                        const now = new Date();
                        const isPast = showtimeDate < now;

                        return (
                          <button
                            key={showtime._id}
                            className={`showtime-btn ${
                              isPast ? "past-showtime" : ""
                            }`}
                            disabled={isPast}
                            onClick={() =>
                              navigate(`/seats/${movie._id}`, {
                                state: { selectedShowtime: showtime },
                              })
                            }
                          >
                            <span className="showtime-screen">
                              {showtime.screenId?.name || "Screen"}
                            </span>
                            <span className="showtime-time">
                              {showtimeDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isPast && (
                              <span className="showtime-closed">Closed</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-showtimes">No showtimes available</p>
            )}
          </div>

          {trailerId && (
            <div className="details-panel trailer-panel">
              <h3>Trailer</h3>
              <div className="trailer-mini">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerId}`}
                  title="Movie Trailer"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;