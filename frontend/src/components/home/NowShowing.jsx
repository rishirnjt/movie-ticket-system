// import { useState, useEffect, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";
// import "./NowShowing.css";

// const API_URL = "http://localhost:5001";
// const NEPAL_TIMEZONE = "Asia/Kathmandu";

// const formatDuration = (minutes) => {
//   if (!minutes) return "";

//   const hours = Math.floor(minutes / 60);
//   const mins = minutes % 60;

//   if (mins === 0) return `${hours}h`;
//   return `${hours}h ${mins}m`;
// };

// const getDateKeyInNepal = (value) => {
//   return new Intl.DateTimeFormat("en-CA", {
//     timeZone: NEPAL_TIMEZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).format(new Date(value));
// };

// const getTodayKeyInNepal = () => {
//   return new Intl.DateTimeFormat("en-CA", {
//     timeZone: NEPAL_TIMEZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).format(new Date());
// };

// const formatTabDate = (dateKey) => {
//   const [year, month, day] = dateKey.split("-").map(Number);

//   return new Intl.DateTimeFormat("en-GB", {
//     timeZone: NEPAL_TIMEZONE,
//     weekday: "short",
//     day: "numeric",
//     month: "short",
//   }).format(new Date(Date.UTC(year, month - 1, day)));
// };

// const formatShowtimeInNepal = (value) => {
//   return new Intl.DateTimeFormat("en-US", {
//     timeZone: NEPAL_TIMEZONE,
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   }).format(new Date(value));
// };

// const getPosterUrl = (posterUrl) => {
//   if (!posterUrl) return "";
//   if (posterUrl.startsWith("http")) return posterUrl;
//   return `${API_URL}${posterUrl}`;
// };

// const NowShowing = () => {
//   const [movies, setMovies] = useState([]);
//   const [selectedDate, setSelectedDate] = useState("");

//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     const fetchMovies = async () => {
//       try {
//         const res = await axios.get(`${API_URL}/api/movies/now-showing`);
//         const fetchedMovies = Array.isArray(res.data) ? res.data : [];
//         setMovies(fetchedMovies);
//       } catch (err) {
//         console.error("Failed to fetch movies", err);
//         setMovies([]);
//       }
//     };

//     fetchMovies();
//   }, []);

//   const allDates = useMemo(() => {
//     const uniqueDates = new Set();
//     const todayKey = getTodayKeyInNepal();

//     movies.forEach((movie) => {
//       (movie.showtimes || []).forEach((showtime) => {
//         if (!showtime.startTime) return;

//         const showDateKey = getDateKeyInNepal(showtime.startTime);

//         // only today/future Nepal dates create tabs
//         if (showDateKey >= todayKey) {
//           uniqueDates.add(showDateKey);
//         }
//       });
//     });

//     return Array.from(uniqueDates).sort();
//   }, [movies]);

//   useEffect(() => {
//     if (allDates.length === 0) {
//       setSelectedDate("");
//       return;
//     }

//     const todayKey = getTodayKeyInNepal();

//     if (allDates.includes(todayKey)) {
//       setSelectedDate((prev) =>
//         prev && allDates.includes(prev) ? prev : todayKey
//       );
//       return;
//     }

//     setSelectedDate((prev) =>
//       prev && allDates.includes(prev) ? prev : allDates[0]
//     );
//   }, [allDates]);

//   const moviesForSelectedDate = useMemo(() => {
//     if (!selectedDate) return [];

//     const todayKey = getTodayKeyInNepal();

//     return movies
//       .map((movie) => {
//         const filteredShowtimes = (movie.showtimes || [])
//           .filter((showtime) => {
//             if (!showtime.startTime) return false;

//             const showDateKey = getDateKeyInNepal(showtime.startTime);

//             const sameSelectedDate = showDateKey === selectedDate;
//             const isUpcomingDate = showDateKey >= todayKey;

//             return sameSelectedDate && isUpcomingDate;
//           })
//           .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

//         return {
//           ...movie,
//           showtimes: filteredShowtimes,
//         };
//       })
//       .filter((movie) => movie.showtimes.length > 0);
//   }, [movies, selectedDate]);

//   const handleShowtime = (movieId, showtime) => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       localStorage.setItem("redirectAfterLogin", `/seats/${movieId}`);
//       navigate("/auth?tab=signin", {
//         state: { backgroundLocation: location },
//       });
//       return;
//     }

//     navigate(`/seats/${movieId}`, {
//       state: { selectedShowtime: showtime },
//     });
//   };

//   const handleMovieClick = (movieId) => {
//     navigate(`/movie/${movieId}`);
//   };

//   return (
//     <div className="now-showing-container">
//       <div className="section-header">
//         <h2>Now Showing</h2>
//       </div>

//       <div className="date-tabs">
//         {allDates.length > 0 ? (
//           allDates.map((date) => (
//             <button
//               key={date}
//               className={`date-tab ${date === selectedDate ? "active" : ""}`}
//               onClick={() => setSelectedDate(date)}
//             >
//               {formatTabDate(date)}
//             </button>
//           ))
//         ) : (
//           <p className="no-movies">No upcoming show dates available.</p>
//         )}
//       </div>

//       <div className="movies-grid">
//         {moviesForSelectedDate.length > 0 ? (
//           moviesForSelectedDate.map((movie) => (
//             <div
//               className="movie-card"
//               key={movie._id}
//               onClick={() => handleMovieClick(movie._id)}
//             >
//               <div className="poster-wrapper">
//                 <img
//                   src={getPosterUrl(movie.posterUrl)}
//                   alt={movie.title}
//                 />
//               </div>

//               <div className="hover-info">
//                 <h4>{movie.title}</h4>
//                 <p className="genre">
//                   {movie.genre} - {formatDuration(movie.duration)}
//                 </p>

//                 <div className="showtimes">
//                   {movie.showtimes.slice(0, 3).map((showtime) => {
//                     const now = new Date();
//                     const isPast = new Date(showtime.startTime) < now;

//                     return (
//                       <span
//                         key={showtime._id}
//                         className={`time-pill ${isPast ? "disabled" : ""}`}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           if (!isPast) {
//                             handleShowtime(movie._id, showtime);
//                           }
//                         }}
//                       >
//                         {formatShowtimeInNepal(showtime.startTime)}
//                       </span>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p className="no-movies">No upcoming movies available for this date.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default NowShowing;

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./NowShowing.css";

const API_URL = "http://localhost:5001";

const formatDuration = (minutes) => {
  if (!minutes) return "";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const getDateKey = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

const getTodayKey = () => {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
};

const formatTabDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatShowtime = (value) => {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";
  if (posterUrl.startsWith("http")) return posterUrl;
  return `${API_URL}${posterUrl}`;
};

const NowShowing = () => {
  const [movies, setMovies] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/movies/now-showing`);
        const fetchedMovies = Array.isArray(res.data) ? res.data : [];
        setMovies(fetchedMovies);
      } catch (err) {
        console.error("Failed to fetch movies", err);
        setMovies([]);
      }
    };

    fetchMovies();
  }, []);

  const allDates = useMemo(() => {
    const uniqueDates = new Set();
    const todayKey = getTodayKey();

    movies.forEach((movie) => {
      (movie.showtimes || []).forEach((showtime) => {
        if (!showtime.startTime) return;

        const showDateKey = getDateKey(showtime.startTime);

        if (showDateKey >= todayKey) {
          uniqueDates.add(showDateKey);
        }
      });
    });

    return Array.from(uniqueDates).sort();
  }, [movies]);

  useEffect(() => {
    if (allDates.length === 0) {
      setSelectedDate("");
      return;
    }

    const todayKey = getTodayKey();

    if (allDates.includes(todayKey)) {
      setSelectedDate((prev) =>
        prev && allDates.includes(prev) ? prev : todayKey
      );
    } else {
      setSelectedDate((prev) =>
        prev && allDates.includes(prev) ? prev : allDates[0]
      );
    }
  }, [allDates]);

  const moviesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const todayKey = getTodayKey();

    return movies
      .map((movie) => {
        const filteredShowtimes = (movie.showtimes || [])
          .filter((showtime) => {
            if (!showtime.startTime) return false;

            const showDateKey = getDateKey(showtime.startTime);
            return showDateKey === selectedDate && showDateKey >= todayKey;
          })
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        return {
          ...movie,
          showtimes: filteredShowtimes,
        };
      })
      .filter((movie) => movie.showtimes.length > 0);
  }, [movies, selectedDate]);

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
        {allDates.length > 0 ? (
          allDates.map((date) => (
            <button
              key={date}
              className={`date-tab ${date === selectedDate ? "active" : ""}`}
              onClick={() => setSelectedDate(date)}
            >
              {formatTabDate(date)}
            </button>
          ))
        ) : (
          <p className="no-movies">No upcoming show dates available.</p>
        )}
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
                <img src={getPosterUrl(movie.posterUrl)} alt={movie.title} />
              </div>

              <div className="hover-info">
                <h4>{movie.title}</h4>
                <p className="genre">
                  {movie.genre} - {formatDuration(movie.duration)}
                </p>

                <div className="showtimes">
                  {movie.showtimes.slice(0, 3).map((showtime) => {
                    const now = new Date();
                    const isPast = new Date(showtime.startTime) < now;

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
                        {formatShowtime(showtime.startTime)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-movies">No upcoming movies available for this date.</p>
        )}
      </div>
    </div>
  );
};

export default NowShowing;