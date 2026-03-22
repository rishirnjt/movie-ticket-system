import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ComingSoon.css";

const ComingSoon = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/movies/coming-soon");
        const data = await res.json();

        if (!res.ok) {
          console.error("Coming soon API error:", data);
          setMovies([]);
          return;
        }

        setMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch upcoming movies:", err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  if (loading) return <p className="no-movies">Loading upcoming movies...</p>;
  if (!Array.isArray(movies) || movies.length === 0) {
    return <p className="no-movies">No upcoming movies yet.</p>;
  }

  return (
    <div className="now-showing-container">
      <div className="section-header">
        <h2>Coming Soon</h2>
        <p>Check out the upcoming movies releasing soon</p>
      </div>

      <div className="movies-grid">
        {movies.map((movie) => (
          <div
            className="movie-card"
            key={movie._id}
            onClick={() => navigate(`/movie/${movie._id}`)}
          >
            <div className="poster-wrapper">
              <img
                src={
                  movie.posterUrl?.startsWith("http")
                    ? movie.posterUrl
                    : `http://localhost:5001/${movie.posterUrl?.replace(/^\/+/, "")}`
                }
                alt={movie.title}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                }}
              />
            </div>

            <div className="hover-info">
              <h4>{movie.title}</h4>
              <p className="genre">
                {Array.isArray(movie.genre)
                  ? movie.genre.join(", ")
                  : movie.genre || "Unknown Genre"}
              </p>
              <p>
                Releasing on:{" "}
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString()
                  : "TBA"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComingSoon;