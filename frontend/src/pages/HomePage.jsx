import Carousel from "../components/home/Carousel";
import NowShowing from "../components/home/NowShowing";
import ComingSoon from "../components/home/ComingSoon";
import PromoBanner from "../components/home/promoBanner";

const HomePage = () => {
    return (
        <>
            <Carousel />
            <NowShowing />
            <PromoBanner />
            <ComingSoon />
        </>
    );
};

export default HomePage;