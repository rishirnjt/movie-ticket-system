import './NowShowing.css';
import background from '../assets/background.jpg';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const NowShowing = () => {
  const [groupedByDate, setGroupedByDate] = useState({});
  const [allDates, setAllDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios.get('http://localhost:5001/api/movies')
      .then(res => {
        console.log('Movies fetched:', res.data);
        const movies = res.data;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        //filtering movies with releasedate
        const upComingMovies = movies.filter(movie => {
          if (!movie.releaseDate) return false;
          const release = new Date(movie.releaseDate);
          release.setHours(0, 0, 0, 0);
          return release >= today;
        })


        // Group movies by release date
        const grouped = {};
        movies.forEach(movie => {
          const date = new Date(movie.releaseDate).toLocaleDateString('en-CA'); // yyyy-mm-dd
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(movie);
        });

        const dates = Object.keys(grouped).sort();
        setGroupedByDate(grouped);

        const defaultDate = dates.includes(today.toLocaleDateString('en-CA'))
          ? today.toLocaleDateString('en-CA')
          : dates[0];

        setAllDates(dates);
        setSelectedDate(defaultDate);
      })
      .catch(err => console.error("Failed to fetch movies", err));
  }, []);

  const movies = groupedByDate[selectedDate] || [];

  const handleShowtime = (movieId, showtime) => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.setItem("redirectAfterLogin", `/seats/${movieId}`);
      navigate("/auth?tab=signin", {
        state: { backgroundLocation: location }
      });
      return;
    }

    navigate(`/seats/${movieId}`, { state: { selectedShowtime: showtime } });
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

            {/* IMAGE WRAPPER */}
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

            {/* HOVER INFO */}
            <div className="hover-info">
              <h4>{movie.title}</h4>
              <p className="genre">{movie.genre}</p>

              <div className="showtimes">
                {movie.showtimes && movie.showtimes.length > 0 ? (
                  movie.showtimes.slice(0, 3).map((showtime, index) => (
                    <span
                      key={index}
                      className="time-pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowtime(movie._id, showtime);
                      }}
                    >
                      {new Date(showtime.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ))
                ) : (
                  <span className="no-showtime">
                    No showtimes
                  </span>
                )}
              </div>
            </div>

          </div>
        ))
      ) : (
        <p className="no-movies">
          No movies available for this date.
        </p>
      )}
    </div>
  </div>
);
};
export default NowShowing;

