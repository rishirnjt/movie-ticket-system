// src/components/EditBanner.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import "./EditBanner.css";

const EditBanner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [movieId, setMovieId] = useState("");
  const [buttonText, setButtonText] = useState("Book Now");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [banner, setBanner] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, moviesRes] = await Promise.all([
          axios.get(`${API_URL}/api/banners/admin/${id}`),
          axios.get(`${API_URL}/api/movies`),
        ]);

        const data = bannerRes.data;
        setMovies(moviesRes.data || []);

        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setMovieId(data.movieId?._id || "");
        setButtonText(data.buttonText || "Book Now");
        setOrder(data.order || 0);
        setIsActive(data.isActive);
        setCurrentBannerUrl(data.bannerUrl || "");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load banner");
      }
    };

    fetchData();
  }, [API_URL, id]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    let finalBannerUrl = currentBannerUrl;

    // If new image selected, upload first
    if (banner) {
      const imageFormData = new FormData();
      imageFormData.append("image", banner);

      const uploadRes = await axios.post(`${API_URL}/api/upload`, imageFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      finalBannerUrl = uploadRes.data.url;
    }

    // Then send normal JSON update
    await axios.put(`${API_URL}/api/banners/admin/${id}`, {
      title,
      subtitle,
      bannerUrl: finalBannerUrl,
      movieId: movieId || null,
      buttonText,
      order,
      isActive,
    });

    toast.success("Banner updated successfully");
    navigate("/admin/banners");
  } catch (error) {
    console.error(error);
    toast.error(
      error?.response?.data?.message || "Failed to update banner"
    );
  }
};
  return (
  <div className="edit-banner-page">
    <div className="edit-banner-wrapper">
      <h2>Edit Banner</h2>

      <form onSubmit={handleSubmit} className="edit-banner-form">
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

        <label className="banner-checkbox">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <div className="banner-upload-section">
          {currentBannerUrl && (
            <img
              className="banner-preview"
              src={`${API_URL}${currentBannerUrl}`}
              alt="Current banner"
            />
          )}

          <label htmlFor="banner-upload" className="banner-upload-box">
            <span>{banner ? banner.name : "Click to choose a new banner image"}</span>
          </label>

          <input
            id="banner-upload"
            className="hidden-file-input"
            type="file"
            accept="image/*"
            onChange={(e) => setBanner(e.target.files[0])}
          />
        </div>

        <button type="submit">Update Banner</button>
      </form>
    </div>
  </div>
);
};
export default EditBanner;