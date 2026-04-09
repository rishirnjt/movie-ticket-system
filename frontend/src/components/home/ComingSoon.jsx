import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "./ComingSoon.css";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ComingSoon = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
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
  }, [API_URL]);

  const formatReleaseDate = (date) => {
    if (!date) return "TBA";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "TBA";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPosterUrl = (posterUrl) => {
    if (!posterUrl) return "https://via.placeholder.com/300x450?text=No+Image";

    return posterUrl.startsWith("http")
      ? posterUrl
      : `${API_URL}/${posterUrl.replace(/^\/+/, "")}`;
  };

  const settings = useMemo(() => {
    const count = movies.length;

    return {
      dots: false,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 3500,
      speed: 800,
      cssEase: "ease-in-out",
      centerMode: true,
      centerPadding: "0px",
      slidesToShow: Math.min(3, count || 1),
      slidesToScroll: 1,
      arrows: false,
      pauseOnHover: true,
      swipeToSlide: true,

      responsive: [
        {
          breakpoint: 900,
          settings: {
            slidesToShow: 3,
          },
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    };
  }, [movies.length]);

  if (loading) {
    return (
      <section className="coming-soon-section">
        <div className="coming-soon-header">
          <h2>Coming Soon</h2>
          <p>Loading upcoming movies...</p>
        </div>
      </section>
    );
  }

  if (!movies.length) {
    return (
      <section className="coming-soon-section">
        <div className="coming-soon-header">
          <h2>Coming Soon</h2>
          <p>No upcoming movies yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="coming-soon-section">
      <div className="coming-soon-header">
        <h2>Coming Soon</h2>
        <p>Check out the upcoming movies releasing soon</p>
      </div>

      <div className="coming-soon-stage">
        <div className="coming-glow" />

        <Slider {...settings} className="coming-slider">
          {movies.map((movie) => (
            <div key={movie._id} className="coming-slide">
              <div
                className="coming-poster-card"
                onClick={() => navigate(`/movie/${movie._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/movie/${movie._id}`);
                  }
                }}
              >
                <img
                  src={getPosterUrl(movie.posterUrl)}
                  alt={movie.title}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/300x450?text=No+Image";
                  }}
                />

                <div className="coming-card-overlay">
                  <h4>{movie.title}</h4>
                  <p>{formatReleaseDate(movie.releaseDate)}</p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default ComingSoon;