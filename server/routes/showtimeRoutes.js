const express = require("express");
const router = express.Router();

const {
  createShowtime,
  getAllShowtimes,
  getShowtimeById,
  getShowtimesByMovie,
  updateShowtime,
  deleteShowtime,
  deleteShowtimesByMovie,
} = require("../controllers/showtimeController");

// Create showtime
router.post("/", createShowtime);

// Get all showtimes
router.get("/", getAllShowtimes);

// Get showtimes for a movie
router.get("/movie/:movieId", getShowtimesByMovie);

// Get one showtime by ID
router.get("/:id", getShowtimeById);

// Update one showtime
router.put("/:id", updateShowtime);

// Delete all showtimes for a movie
router.delete("/movie/:movieId", deleteShowtimesByMovie);

// Delete one showtime
router.delete("/:id", deleteShowtime);

module.exports = router;
