// const Movie = require("../models/Movie");

// const archieveOldMovies = async() => {
//     try{
//         const today = new Date();

//         const result = await Movie.updateMany(
//             {
//             releaseDate: { $lt: today },
//             status: { $ne : "archived" }
//             },
//             { status: "archieved" }
//         );
//         console.log(`Archived ${result.modifiedCount} movies`);
//     } catch (error) {
//         console.error("Archive job failed:",error.message);
//     }
// };

// module.exports = archiveOldMovies;