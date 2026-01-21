import React, { useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import './AddMovie.css';
import { useNavigate } from "react-router-dom";

const AddMovies = () => {
    const [movies, setMovies] = useState([
        {
            title: '',
            description: '',
            genre: '',
            posterUrl: '',
            releaseDate: '',
            duration: '',
            rating: '',
            language: '',
            showtimes: [{ hall: '', time: '' }]
        }
    ]);

    const navigate = useNavigate();

    // Handle input change for movie fields
    const handleMovieChange = (index, field, value) => {
        const updatedMovies = [...movies];
        updatedMovies[index][field] = value;
        setMovies(updatedMovies);
    };

    // Handle showtime change
    const handleShowtimeChange = (movieIndex, showtimeIndex, field, value) => {
        const updatedMovies = [...movies];
        updatedMovies[movieIndex].showtimes[showtimeIndex][field] = value;
        setMovies(updatedMovies);
    };

    // Add new movie block
    const addMovie = () => {
        setMovies([
            ...movies,
            {
                title: '',
                description: '',
                genre: '',
                posterUrl: '',
                releaseDate: '',
                duration: '',
                rating: '',
                language: '',
                showtimes: [{ hall: '', time: '' }]
            }
        ]);
    };

    // Remove movie block
    const removeMovie = (index) => {
        if (movies.length > 1) {
            const updated = [...movies];
            updated.splice(index, 1);
            setMovies(updated);
        }
    };

    // Add showtime for a movie
    const addShowtime = (movieIndex) => {
        const updatedMovies = [...movies];
        updatedMovies[movieIndex].showtimes.push({ hall: '', time: '' });
        setMovies(updatedMovies);
    };

    // Remove showtime for a movie
    const removeShowtime = (movieIndex, showtimeIndex) => {
        const updatedMovies = [...movies];
        updatedMovies[movieIndex].showtimes.splice(showtimeIndex, 1);
        setMovies(updatedMovies);
    };

    // Handle poster upload for a specific movie
    const handlePosterUpload = async (movieIndex, file) => {
        const data = new FormData();
        data.append('image', file);

        try {
            const res = await axios.post('http://localhost:5001/api/upload', data);
            const updatedMovies = [...movies];
            updatedMovies[movieIndex].posterUrl = res.data.url;
            setMovies(updatedMovies);
        } catch (err) {
            alert("Poster upload failed");
            console.error(err);
        }
    };

    // Submit all movies
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5001/api/movies/add-multiple', movies, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Movies added successfully!");
            navigate('/admin/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add movies');
        }
    };

    return (
        <div className="admin-layout">

            <Sidebar />
            <div className="content-wrapper">

                <div className="add-movie-cont">
                    <h2>Add Multiple Movies</h2>
                    <form onSubmit={handleSubmit} className="add-movie-form">
                        {movies.map((movie, movieIndex) => (
                            <div key={movieIndex} className="movie-block">
                                <h3>Movie {movieIndex + 1}</h3>

                                <input
                                    id="add-title"
                                    placeholder="Title"
                                    value={movie.title}
                                    onChange={(e) => handleMovieChange(movieIndex, 'title', e.target.value)}
                                    required
                                />
                                <textarea
                                    id="add-description"
                                    placeholder="Description"
                                    value={movie.description}
                                    onChange={(e) => handleMovieChange(movieIndex, 'description', e.target.value)}
                                />
                                <input
                                    id="add-genre"
                                    placeholder="Genre"
                                    value={movie.genre}
                                    onChange={(e) => handleMovieChange(movieIndex, 'genre', e.target.value)}
                                />

                                <input
                                    id="add-poster"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePosterUpload(movieIndex, e.target.files[0])}
                                />
                                {movie.posterUrl && (
                                    <img
                                        src={`http://localhost:5001${movie.posterUrl}`}
                                        alt="Poster Preview"
                                        style={{ width: '150px', marginTop: '10px' }}
                                    />
                                )}

                                <input
                                    id="add-release-date"
                                    type="date"
                                    placeholder="Release Date"
                                    value={movie.releaseDate}
                                    onChange={(e) => handleMovieChange(movieIndex, 'releaseDate', e.target.value)}
                                />
                                <input
                                    id="add-duration"
                                    placeholder="Duration"
                                    value={movie.duration}
                                    onChange={(e) => handleMovieChange(movieIndex, 'duration', e.target.value)}
                                />
                                <input
                                    id="add-rating"
                                    placeholder="Rating"
                                    value={movie.rating}
                                    onChange={(e) => handleMovieChange(movieIndex, 'rating', e.target.value)}
                                />
                                <input
                                    id="add-language"
                                    placeholder="Language"
                                    value={movie.language}
                                    onChange={(e) => handleMovieChange(movieIndex, 'language', e.target.value)}
                                />

                                <label>Showtimes:</label>
                                {movie.showtimes.map((showtime, showtimeIndex) => (
                                    <div key={showtimeIndex} className="showtime-group">
                                        <input
                                            placeholder="Hall"
                                            value={showtime.hall}
                                            onChange={(e) => handleShowtimeChange(movieIndex, showtimeIndex, 'hall', e.target.value)}
                                        />
                                        <input
                                            placeholder="Time (e.g. 12:00 PM)"
                                            value={showtime.time}
                                            onChange={(e) => handleShowtimeChange(movieIndex, showtimeIndex, 'time', e.target.value)}
                                        />
                                        <button type="button" onClick={() => removeShowtime(movieIndex, showtimeIndex)}>Remove</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addShowtime(movieIndex)}>Add Showtime</button>

                                <button type="button" onClick={() => removeMovie(movieIndex)}>Remove Movie</button>
                                <hr />
                            </div>
                        ))}

                        <button type="button" onClick={addMovie}>Add Another Movie</button>
                        <button type="submit">Submit All Movies</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddMovies;
