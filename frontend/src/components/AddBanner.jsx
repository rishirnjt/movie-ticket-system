import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import './AddBanner.css';

const AddBanner = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [movieId, setMovieId] = useState("");
  const [buttonText, setButtonText] = useState("Book Now");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/movies`);
        setMovies(res.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMovies();
  }, [API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bannerFile) {
      toast.error("Please select a banner image");
      return;
    }

    try {
      setLoading(true);

      // Step 1: upload image
      const imageFormData = new FormData();
      imageFormData.append("image", bannerFile);

      const uploadRes = await axios.post(`${API_URL}/api/upload`, imageFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const bannerUrl = uploadRes.data.url;

      // Step 2: save banner data
      await axios.post(`${API_URL}/api/banners/admin`, {
        title,
        subtitle,
        bannerUrl,
        movieId: movieId || null,
        buttonText,
        order,
        isActive,
      });

      toast.success("Banner created successfully");
      navigate("/admin/banners");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-page">
      <h2>Add Banner</h2>

      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Banner title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Banner subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <select value={movieId} onChange={(e) => setMovieId(e.target.value)}>
          <option value="">Select related movie (optional)</option>
          {movies.map((movie) => (
            <option key={movie._id} value={movie._id}>
              {movie.title}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Button text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
        />

        <input
          type="number"
          placeholder="Display order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBannerFile(e.target.files[0])}
          required
        />
        {bannerFile && (
            <div className="banner-preview">
                <img src={URL.createObjectURL(bannerFile)} alt="Preview" />
            </div>
        )
        }

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Banner"}
        </button>
      </form>
    </div>
  );
};

export default AddBanner;