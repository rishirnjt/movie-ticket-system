import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./NowShowing.css";

const NowShowing = () => {
  const [movies, setMovies] = useState([]);
  const [allDates, setAllDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const formatDuration = (minutes) => {
  if (!minutes) return "";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/movies/now-showing")
      .then((res) => {

          console.log("NOW SHOWING API RESPONSE:", res.data);

        const fetchedMovies = res.data || [];

        const uniqueDates = new Set();

        fetchedMovies.forEach((movie) => {
          (movie.showtimes || []).forEach((showtime) => {
            if (!showtime.startTime) return;

            const showDate = new Date(showtime.startTime);
            showDate.setHours(0, 0, 0, 0);

            const dateKey = showDate.toLocaleDateString("en-CA");
            uniqueDates.add(dateKey);
          });
        });

        const dates = Array.from(uniqueDates).sort();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = today.toLocaleDateString("en-CA");

        setMovies(fetchedMovies);
        setAllDates(dates);
        setSelectedDate(dates.includes(todayKey) ? todayKey : dates[0] || "");
      })
      .catch((err) => console.error("Failed to fetch movies", err));
  }, []);

  const moviesForSelectedDate = movies
    .map((movie) => {
      const filteredShowtimes = (movie.showtimes || [])
        .filter((showtime) => {
          if (!showtime.startTime || !selectedDate) return false;

          const showDate = new Date(showtime.startTime);
          showDate.setHours(0, 0, 0, 0);

          return showDate.toLocaleDateString("en-CA") === selectedDate;
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      return {
        ...movie,
        showtimes: filteredShowtimes,
      };
    })
    .filter((movie) => movie.showtimes.length > 0);

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
        {moviesForSelectedDate.length > 0 ? (
          moviesForSelectedDate.map((movie) => (
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
                <p className="genre">
                  {movie.genre}  - {formatDuration(movie.duration)}</p>

                <div className="showtimes">
                  {movie.showtimes.slice(0, 3).map((showtime) => {
                    const showDateTime = new Date(showtime.startTime);
                    const now = new Date();
                    const isPast = showDateTime < now;

                    return (
                      <span
                        key={showtime._id}
                        className={`time-pill ${isPast ? "disabled" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPast) {
                            handleShowtime(movie._id, showtime);
                          }
                        }}
                      >
                        {showDateTime.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    );
                  })}
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