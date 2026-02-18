import React from "react";
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Carousel.css';

import poster1 from '../assets/Avatar.webp';
import poster2 from '../assets/FantasticFour.jpg';
import poster3 from '../assets/spider.jpg';

const Carousel = () => {
    const settings={
        dots: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 2000,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        pauseOnHover: true,
    };

    const posters = [
        {src : poster1, title: 'Avatar:Fire and Ash'},
        {src : poster2, title: 'Fantastic Four'},
        {src: poster3, title: 'SpiderMan'}
    ];

   return (
    <div className="carousel-container">
      <Slider {...settings}>
        {posters.map((poster, index) => (
          <div className="slide" key={index}>
            <img src={poster.src} alt={poster.title} />
            <div className="slide-text">
              <h2>Now Showing</h2>
              <h1>{poster.title}</h1>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Carousel;