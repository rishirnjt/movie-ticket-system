import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./SearchResults.css";

const SearchResults = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q");

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5001/api/movies/search?q=${query}`
        );
        setMovies(res.data);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="search-page">
      <div className="search-overlay" />

      <div className="search-content">
        <h2>
          Search results for <span>“{query}”</span>
        </h2>

        {loading && <p className="loading">Searching...</p>}

        {!loading && movies.length === 0 && (
          <p className="no-results">No movies found</p>
        )}

        <div className="search-grid">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="search-card"
              onClick={() => navigate(`/seats/${movie._id}`)}
            >
              <img
                src={
                  movie.posterUrl?.startsWith("http")
                    ? movie.posterUrl
                    : `http://localhost:5001${movie.posterUrl}`
                }
                alt={movie.title}
              />

              <div className="card-info">
                <h4>{movie.title}</h4>
                <p>{movie.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
