import Slider from "react-slick";
import './ComingSoon.css';
import war from "../assets/War2.jpg";
import conjuring from "../assets/Conjuring.jpg";
import batman from "../assets/Batman.webp";
import avengers from "../assets/Avengers.jpg";

const comingSoonMovies = [
    {id:1, title: "War 2", poster: war},
    {id:2, title:"Conjuring:The Last Rite", poster: conjuring},
    {id:3, title:"Batman II", poster: batman},
    {id:4, title:"Avengers", poster: avengers},
];

const ComingSoon = () => {
    const settings = {
        dots: false,
        infinite: true,
        speed: 900,
        slidesToShow: 2,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: true,
    };
    
    return(
        <div className="coming-soon-cont">
            <h2>Coming Soon</h2>
            <Slider {...settings}>
                {comingSoonMovies.map((movie) => (
                    <div className="coming-card" key={movie.id}>
                        <img src={movie.poster} alt={movie.title} />
                        <h4>{movie.title}</h4>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default ComingSoon;