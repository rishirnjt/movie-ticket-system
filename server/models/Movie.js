// const mongoose = require("mongoose");

// const calculateMovieStatus = (startDate, endDate) => {
//   const now = new Date();

//   if (startDate > now) return "coming";
//   if (endDate < now) return "archived";
//   return "showing";
// };

// const movieSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     genre: String,
//     posterUrl: String,
//     trailerUrl: String,
//     releaseDate: Date,
//     duration: {
//       type: Number,
//       required: true,
//     },
//     rating: String,
//     language: String,

//     movieStartDate: {
//       type: Date,
//       required: true,
//     },
//     movieEndDate: {
//       type: Date,
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["coming", "showing", "archived"],
//       default: "coming",
//     },
//   },
//   { timestamps: true }
// );

// //Auto update 
// movieSchema.pre("save", function (next) {
//   if (this.movieStartDate && this.movieEndDate) {
//     this.status = calculateMovieStatus(
//       this.movieStartDate,
//       this.movieEndDate
//     );
//   }
//   next();
// });

// module.exports =
//   mongoose.models.Movie || mongoose.model("Movie", movieSchema);

const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    genre: {
      type: String,
      trim: true,
    },

    posterUrl: {
      type: String,
      trim: true,
    },

    trailerUrl: {
      type: String,
      trim: true,
    },

    releaseDate: {
      type: Date,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    rating: {
      type: String,
      trim: true,
      default: "",
    },

    language: {
      type: String,
      trim: true,
      default: "",
    },

    movieStartDate: {
      type: Date,
      required: true,
    },

    movieEndDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Movie || mongoose.model("Movie", movieSchema);