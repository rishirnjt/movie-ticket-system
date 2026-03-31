import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "./ComingSoon.css";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ComingSoon = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "http://localhost:5001";

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch(`${API_URL}/api/movies/coming-soon`);
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

  const settings = {
  dots: false,
  infinite: movies.length > 1,
  autoplay: movies.length > 1,
  autoplaySpeed: 2500,
  speed: 700,
  slidesToShow: Math.min(5, movies.length || 1),
  slidesToScroll: 1,
  arrows: true,
  pauseOnHover: true,
  swipeToSlide: true,
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: Math.min(4, movies.length || 1),
      },
    },
    {
      breakpoint: 900,
      settings: {
        slidesToShow: Math.min(3, movies.length || 1),
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: Math.min(2, movies.length || 1),
      },
    },
  ],
};
  if (loading) return <p className="no-movies">Loading upcoming movies...</p>;
  if (!movies.length) return <p className="no-movies">No upcoming movies yet.</p>;

  return (
    <div className="coming-carousel-container">
      <div className="section-header">
        <h2>Coming Soon</h2>
        <p>Check out the upcoming movies releasing soon</p>
      </div>

      <Slider {...settings}>
        {movies.map((movie) => {
          const imageUrl = movie.posterUrl?.startsWith("http")
            ? movie.posterUrl
            : `${API_URL}/${movie.posterUrl?.replace(/^\/+/, "")}`;

          return (
            <div key={movie._id} className="coming-slide">
              <div
                className="coming-card"
                onClick={() => navigate(`/movie/${movie._id}`)}
              >
                <img
                  src={imageUrl}
                  alt={movie.title}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/300x450?text=No+Image";
                  }}
                />

                <div className="coming-overlay">
                  <h4>{movie.title}</h4>
                  <p>
                    {movie.releaseDate
                      ? new Date(movie.releaseDate).toLocaleDateString()
                      : "TBA"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default ComingSoon;