import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const ManageBanner = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
  const [banners, setBanners] = useState([]);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/banners/admin/all`);
      setBanners(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/banners/admin/${id}`);
      toast.success("Banner deleted");
      fetchBanners();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete banner");
    }
  };

  return (
    <div className="manage-banners-page">
      <div className="page-header">
        <h2>Manage Banners</h2>
        <Link to="/admin/add-banner">Add Banner</Link>
      </div>

      <div className="banner-grid">
        {banners.map((banner) => (
          <div key={banner._id} className="banner-card">
            <img src={`${API_URL}${banner.bannerUrl}`} alt={banner.title} />
            <h3>{banner.title}</h3>
            <p>{banner.subtitle}</p>
            <p>Movie: {banner.movieId?.title || "None"}</p>
            <p>Order: {banner.order}</p>
            <p>Status: {banner.isActive ? "Active" : "Inactive"}</p>

            <div className="banner-actions">
              <Link to={`/admin/edit-banner/${banner._id}`}>Edit</Link>
              <button onClick={() => handleDelete(banner._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageBanner;