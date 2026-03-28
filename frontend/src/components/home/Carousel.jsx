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

  if (!banners.length) return null;

  return (
    <div className="carousel-container">
      <Slider {...settings}>
        {banners.map((banner) => {
          const imageUrl = banner.bannerUrl?.startsWith("http")
            ? banner.bannerUrl
            : `${API_URL}${banner.bannerUrl}`;

          return (
            <div className="slide" key={banner._id}>
              <img src={imageUrl} alt={banner.title} />

              <div className="slide-text">
                <h2>Now Showing</h2>
                <h1>{banner.title}</h1>
                <p>{banner.subtitle}</p>

                {banner.movieId && (
                  <button
                    className="carousel-btn"
                    onClick={() =>
                      navigate(`/movie/${banner.movieId._id}`)
                    }
                  >
                    {banner.buttonText || "Book Now"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default Carousel;