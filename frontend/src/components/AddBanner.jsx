import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./AddBanner.css";

const AddBanner = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    movieId: "",
    buttonText: "Book Now",
    order: 0,
    isActive: true,
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setMoviesLoading(true);
        const res = await axios.get(`${API_URL}/api/movies`);
        setMovies(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
        toast.error("Failed to load movies");
        setMovies([]);
      } finally {
        setMoviesLoading(false);
      }
    };

    fetchMovies();
  }, [API_URL]);

  useEffect(() => {
    if (!bannerFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(bannerFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [bannerFile]);

  const selectedMovieTitle = useMemo(() => {
    const selectedMovie = movies.find((movie) => movie._id === form.movieId);
    return selectedMovie?.title || "";
  }, [movies, form.movieId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setBannerFile(file);
  };

  const removeSelectedImage = () => {
    setBannerFile(null);
    setPreviewUrl("");
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Banner title is required");
      return false;
    }

    if (!bannerFile) {
      toast.error("Please select a banner image");
      return false;
    }

    if (Number(form.order) < 0) {
      toast.error("Display order cannot be negative");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const imageFormData = new FormData();
      imageFormData.append("image", bannerFile);

      const uploadRes = await axios.post(`${API_URL}/api/upload`, imageFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const bannerUrl = uploadRes.data.url;

      await axios.post(`${API_URL}/api/banners/admin`, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        bannerUrl,
        movieId: form.movieId || null,
        buttonText: form.buttonText.trim() || "Book Now",
        order: Number(form.order) || 0,
        isActive: form.isActive,
      });

      toast.success("Banner created successfully");
      navigate("/admin/banners");
    } catch (error) {
      console.error("Failed to create banner:", error);
      toast.error(error.response?.data?.message || "Failed to create banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-page add-banner-page">
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Add Banner</h2>
          <p>Create a homepage banner with optional movie linking.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-form add-banner-form">
          <div className="form-grid">
            <div className="form-left">
              <div className="form-group">
                <label>Banner Title</label>
                <input
                  type="text"
                  placeholder="Enter banner title"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Banner Subtitle</label>
                <textarea
                  placeholder="Enter banner subtitle"
                  rows="4"
                  value={form.subtitle}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Related Movie</label>
                <select
                  value={form.movieId}
                  onChange={(e) => handleChange("movieId", e.target.value)}
                  disabled={moviesLoading}
                >
                  <option value="">
                    {moviesLoading
                      ? "Loading movies..."
                      : "Select related movie (optional)"}
                  </option>
                  {movies.map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
                {selectedMovieTitle && (
                  <small className="helper-text">
                    Selected movie: {selectedMovieTitle}
                  </small>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Button Text</label>
                  <input
                    type="text"
                    placeholder="Book Now"
                    value={form.buttonText}
                    onChange={(e) => handleChange("buttonText", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.order}
                    onChange={(e) => handleChange("order", e.target.value)}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => handleChange("isActive", e.target.checked)}
                  />
                  <span>Active banner</span>
                </label>
              </div>
            </div>

            <div className="form-right">
              <div className="form-group">
                <label>Banner Image</label>

                <label className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!bannerFile}
                  />
                  <span>{bannerFile ? "Change image" : "Click to upload banner image"}</span>
                </label>

                {previewUrl ? (
                  <div className="banner-preview-card">
                    <img src={previewUrl} alt="Banner preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={removeSelectedImage}
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="empty-preview">
                    <span>No image selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/admin/banners")}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Saving..." : "Create Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBanner;