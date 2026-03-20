import "./NowShowing.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const NowShowing = () => {
  const [groupedByDate, setGroupedByDate] = useState({});
  const [allDates, setAllDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/movies/now-showing")
      .then((res) => {
        const movies = res.data;

        const grouped = {};

        movies.forEach((movie) => {
          if (!movie.showtimes || movie.showtimes.length === 0) return;

          movie.showtimes.forEach((showtime) => {
            if (!showtime.startTime) return;

            const showDate = new Date(showtime.startTime);
            showDate.setHours(0, 0, 0, 0);

            const dateKey = showDate.toLocaleDateString("en-CA");

            if (!grouped[dateKey]) grouped[dateKey] = [];

            let existingMovie = grouped[dateKey].find(
              (m) => m._id === movie._id
            );

            if (!existingMovie) {
              existingMovie = {
                ...movie,
                showtimes: [],
              };
              grouped[dateKey].push(existingMovie);
            }

            existingMovie.showtimes.push(showtime);

            existingMovie.showtimes.sort(
              (a, b) => new Date(a.startTime) - new Date(b.startTime)
            );
          });
        });

        const dates = Object.keys(grouped).sort();

        setGroupedByDate(grouped);
        setAllDates(dates);
        setSelectedDate(dates[0] || "");
      })
      .catch((err) => console.error("Failed to fetch movies", err));
  }, []);

  const movies = groupedByDate[selectedDate] || [];

  const handleShowtime = (movieId, showtime) => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.setItem("redirectAfterLogin", `/seats/${movieId}`);
      navigate("/auth?tab=signin", {
        state: { backgroundLocation: location },
      });
      return;
    }

    navigate(`/seats/${movieId}`, {
      state: { selectedShowtime: showtime },
    });
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="now-showing-container">
      <div className="section-header">
        <h2>Now Showing</h2>
      </div>

      <div className="date-tabs">
        {allDates.map((date) => (
          <button
            key={date}
            className={`date-tab ${date === selectedDate ? "active" : ""}`}
            onClick={() => setSelectedDate(date)}
          >
            {new Date(date).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </button>
        ))}
      </div>

      <div className="movies-grid">
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div
              className="movie-card"
              key={movie._id}
              onClick={() => handleMovieClick(movie._id)}
            >
              <div className="poster-wrapper">
                <img
                  src={`http://localhost:5001${movie.posterUrl}`}
                  alt={movie.title}
                />
              </div>

              <div className="hover-info">
                <h4>{movie.title}</h4>
                <p className="genre">{movie.genre}</p>

                <div className="showtimes">
                  {movie.showtimes && movie.showtimes.length > 0 ? (
                    movie.showtimes.slice(0, 3).map((showtime, index) => {
                      const showDateTime = new Date(showtime.startTime);
                      const now = new Date();
                      const isPast = showDateTime < now;

                      return (
                        <span
                          key={index}
                          className={`time-pill ${isPast ? "disabled" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isPast) {
                              handleShowtime(movie._id, showtime);
                            }
                          }}
                        >
                          {showDateTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      );
                    })
                  ) : (
                    <span className="no-showtime">No showtimes</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-movies">No movies available for this date.</p>
        )}
      </div>
    </div>
  );
};

export default NowShowing;