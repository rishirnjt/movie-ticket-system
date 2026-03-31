import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css";

const Carousel = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [trailerUrl, setTrailerUrl] = useState("");

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: true,
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/banners`);
        setBanners(res.data || []);
      } catch (err) {
        console.error("Failed to fetch banners", err);
      }
    };

    fetchBanners();
  }, [API_URL]);

  // 🎬 Convert YouTube URL to embed
  const getEmbedUrl = (url) => {
    if (!url) return "";

    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }

      if (url.includes("youtube.com/watch?v=")) {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get("v");
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }

      if (url.includes("/embed/")) {
        return url;
      }

      return "";
    } catch (error) {
      console.error("Trailer URL parse error:", error);
      return "";
    }
  };

  const handlePlayTrailer = (e, trailer) => {
    e.stopPropagation();
    const embedUrl = getEmbedUrl(trailer);
    setTrailerUrl(embedUrl);
  };

  // 🎯 Status label
  const getStatusLabel = (status) => {
    switch (status) {
      case "coming":
        return "Coming Soon";
      case "showing":
        return "Now Showing";
      case "archived":
        return "Ended";
      default:
        return "Now Showing";
    }
  };

  // 🎯 Button text based on status
  const getButtonText = (status, buttonText) => {
    if (buttonText) return buttonText;

    switch (status) {
      case "coming":
        return "View Details";
      case "showing":
        return "Book Now";
      case "archived":
        return "View Movie";
      default:
        return "Book Now";
    }
  };

  if (!banners.length) return null;

  return (
    <>
      <div className="carousel-container">
        <Slider {...settings}>
          {banners.map((banner) => {
            const imageUrl = banner.bannerUrl?.startsWith("http")
              ? banner.bannerUrl
              : `${API_URL}${banner.bannerUrl}`;

            const trailer = banner.movieId?.trailerUrl || "";
            const status = banner.movieId?.status || "showing";

            return (
              <div className="slide" key={banner._id}>
                <img src={imageUrl} alt={banner.title} />

                <div className="slide-text">
                  {/* 🔥 Dynamic Status */}
                  <h2 className={`carousel-status ${status}`}>
                    {getStatusLabel(status)}
                  </h2>

                  <h1>{banner.title}</h1>
                  <p>{banner.subtitle}</p>

                  <div className="carousel-actions">
                    {banner.movieId?._id && (
                      <button
                        className="carousel-btn primary"
                        onClick={() =>
                          navigate(`/movie/${banner.movieId._id}`)
                        }
                      >
                        {getButtonText(status, banner.buttonText)}
                      </button>
                    )}

                    {trailer && (
                      <button
                        type="button"
                        className="carousel-btn secondary"
                        onClick={(e) => handlePlayTrailer(e, trailer)}
                      >
                        <span className="play-icon">▶</span>
                        Play Trailer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>

      {/* 🎬 Trailer Modal */}
      {trailerUrl && (
        <div className="trailer-modal" onClick={() => setTrailerUrl("")}>
          <div
            className="trailer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="close-trailer"
              onClick={() => setTrailerUrl("")}
            >
              ×
            </button>

            <iframe
              src={trailerUrl}
              title="Trailer"
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Carousel;