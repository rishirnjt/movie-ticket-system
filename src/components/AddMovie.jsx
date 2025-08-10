import React, { useState } from "react";
import axios from "axios";
import './AddMovie.css';
import { useNavigate, useSearchParams } from "react-router-dom";

const AddMovie = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        genre: '',
        posterUrl: '',
        releaseDate: '',
        duration: '',
        rating: '',
        language: '',
        showtimes: [{ hall: '', time: '' }]
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePosterUpload = async (e) => {
        const file = e.target.files[0];
        const data = new FormData();
        data.append('image', file);

        try {
            const res = await axios.post('http://localhost:5000/api/upload', data);
            setFormData({ ...formData, posterUrl: res.data.url });
        } catch (err) {
            alert("Poster upload failed");
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            await axios.post('http://localhost:5000/api/movies/add', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert("Movie added successfully!");
            navigate('/admin/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add movie');
        }
    };

    return (
        <div className="add-movie-cont">
            <h2>Add Movie</h2>
            <form onSubmit={handleSubmit} className="add-movie-form">
                <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
                <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
                <input name="genre" placeholder="Genre" value={formData.genre} onChange={handleChange} />

                <input type="file" accept="image/*" onChange={handlePosterUpload} />
                {formData.posterUrl && (
                    <img
                        src={`http://localhost:5000${formData.posterUrl}`}
                        alt="Poster Preview"
                        style={{ width: '150px', marginTop: '10px' }}
                    />

                )}

                <input name="releaseDate" type="date" placeholder="Release Date" value={formData.releaseDate} onChange={handleChange} />
                <input name="duration" placeholder="Duration" value={formData.duration} onChange={handleChange} />
                <input name="ratings" placeholder="Rating" value={formData.ratings} onChange={handleChange} />
                <input name="language" placeholder="Language" value={formData.language} onChange={handleChange} />
                <label>Showtimes:</label>
                {formData.showtimes.map((showtime, index) => (
                    <div key={index} className="showtime-group">
                        <input
                            placeholder="Hall"
                            value={showtime.hall}
                            onChange={(e) => {
                                const updated = [...formData.showtimes];
                                updated[index].hall = e.target.value;
                                setFormData({ ...formData, showtimes: updated });
                            }}
                        />
                        <input
                            placeholder="Time (e.g. 12:00 PM)"
                            value={showtime.time}
                            onChange={(e) => {
                                const updated = [...formData.showtimes];
                                updated[index].time = e.target.value;
                                setFormData({ ...formData, showtimes: updated });
                            }}
                        />
                        <button type="button" onClick={() => {
                            const updated = [...formData.showtimes];
                            updated.splice(index, 1);
                            setFormData({ ...formData, showtimes: updated });
                        }}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={() => {
                    setFormData({ ...formData, showtimes: [...formData.showtimes, { hall: '', time: '' }] });
                }}>Add Showtime</button>

                <button type="submit">Add Movie</button>
            </form>

        </div>
    );
};

export default AddMovie;