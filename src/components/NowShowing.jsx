import './NowShowing.css';
import background from '../assets/background.jpg';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NowShowing = () => {
  const [groupedByDate, setGroupedByDate] = useState({});
  const [allDates, setAllDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/movies')
      .then(res => {
        console.log('Movies fetched:', res.data);
        const movies = res.data;

        // Group movies by release date
        const grouped = {};
        movies.forEach(movie => {
          const date = new Date(movie.releaseDate).toLocaleDateString('en-CA'); // yyyy-mm-dd
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(movie);
        });

        const dates = Object.keys(grouped).sort();
        setGroupedByDate(grouped);

        const today = new Date().toLocaleDateString('en-CA');
        const defaultDate = dates.includes(today) ? today : dates[0];
        setAllDates(dates);
        setSelectedDate(defaultDate);
      })
      .catch(err => console.error("Failed to fetch movies", err));
  }, []);



  const movies = groupedByDate[selectedDate] || [];

  const handleBuyNow = (movieId) => {
    navigate(`/seats/${movieId}`);
  };

  return (
    <div
      className='now-showing-container'
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: '1.5rem',
        color: '#fff',
      }}
    >
      <h2>Now Showing</h2>

      <div className='date-tabs'>
        {allDates.map(date => (
          <button
            key={date}
            className={date === selectedDate ? 'active' : ''}
            onClick={() => setSelectedDate(date)}
          >
            {new Date(date).toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short'
            })}
          </button>
        ))}
      </div>

      <div className='movies-grid'>
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div className='movie-card' key={movie._id}>
              <img
                src={`http://localhost:5000/${movie.posterUrl}`}
                alt={`${movie.title} poster`}
              />

              <div className="movie-details">
                <h4>{movie.title}</h4>
                <p>{movie.duration}</p>
                <p>{movie.genre}</p>
                <p>{movie.rating}</p>

                <div className="showtimes">
                  {movie.showtimes && movie.showtimes.length > 0 ? (
                    movie.showtimes.map((showtime, index) => (
                      <span key={index}>
                        {showtime.hall} - {showtime.time}
                      </span>
                    ))
                  ) : (
                    <span>No showtimes available</span>
                  )}
                </div>

                <button onClick={() => handleBuyNow(movie._id)}>Buy Now</button>
              </div>
            </div>
          ))
        ) : (
          <p>No movies available for this date.</p>
        )}
      </div>
    </div>
  );
};


export default NowShowing;
