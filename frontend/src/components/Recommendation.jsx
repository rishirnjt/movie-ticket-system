// // Recommendation.jsx
// import { useEffect, useState } from "react";
// import axios from "axios";

// const Recommendation = () => {
//     const [movies, setMovies] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchRecommendations = async () => {
//             console.log("Fetching recommendations started");

//             try {
//                 const token = localStorage.getItem("token");
//                 console.log("Token:", token);

//                 const res = await axios.get(
//                     "http://localhost:5001/api/recommendations",
//                     {
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                         },
//                     }
//                 );

//                 console.log("Response received:", res);
//                 setMovies(res.data);
//             } catch (err) {
//                 console.error("Recommendation error:", err);
//             }

//             console.log("Setting loading to false");
//             setLoading(false);
//         };

//         fetchRecommendations();
//     }, []);

//     if (loading) return <p>Loading recommendations...</p>;

//     if (!movies.length)
//         return (
//             <div className="now-showing-container">
//                 <div className="section-header">
//                     <h2>Recommended For You</h2>
//                     <p>No recommendations available yet.</p>
//                 </div>
//             </div>
//         );

//     return (
//         <div className="now-showing-container">
//             <div className="section-header">
//                 <h2>Recommended For You</h2>
//                 <p>Movies we think you’ll love</p>
//             </div>

//             <div className="movies-grid">
//                 {movies.map((movie) => (
//                     <div className="movie-card" key={movie._id}>
//                         {movie.posterUrl ? (
//                             <img
//                                 src={
//                                     movie.posterUrl.startsWith("http")
//                                         ? movie.posterUrl
//                                         : `http://localhost:5001/${movie.posterUrl.replace(/^\/+/, "")}`
//                                 }
//                                 alt={movie.title}
//                                 style={{
//                                     width: "150px",
//                                     height: "220px",
//                                     objectFit: "cover",
//                                     borderRadius: "8px"
//                                 }}
//                                 onError={(e) => {
//                                     e.target.src = "https://via.placeholder.com/150x220?text=No+Image";
//                                 }}
//                             />
//                         ) : (
//                             <img
//                                 src="https://via.placeholder.com/150x220?text=No+Image"
//                                 alt="No poster"
//                                 style={{
//                                     width: "150px",
//                                     height: "220px",
//                                     objectFit: "cover",
//                                     borderRadius: "8px"
//                                 }}
//                             />
//                         )}
//                         <p style={{ textAlign: "center", marginTop: "8px" }}>
//                             {movie.title}
//                         </p>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default Recommendation;