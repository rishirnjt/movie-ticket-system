const Showtime = require("../models/Showtime");

const createShowtime = async (req, res) => {
  try {
    const { movieId, screenId, startTime, endTime, basePrice } = req.body;

    if (!movieId || !screenId || !startTime || !endTime || basePrice === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const showtime = await Showtime.create({
      movieId,
      screenId,
      startTime,
      endTime,
      basePrice,
    });

    res.status(201).json(showtime);
  } catch (err) {
    console.error("Create showtime error:", err);
    res.status(500).json({ message: "Failed to add showtime", error: err.message });
  }
};

const getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movieId")
      .populate("screenId")
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch showtimes" });
  }
};

const getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movieId")
      .populate("screenId");

    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    res.json(showtime);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch showtime" });
  }
};

const getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movieId: req.params.movieId })
      .populate("screenId")
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (err) {
    console.error("Get showtimes by movie error:", err);
    res.status(500).json({ message: "Failed to fetch showtimes" });
  }
};

const updateShowtime = async (req, res) => {
  try {
    const { movieId, screenId, startTime, endTime, basePrice, status } = req.body;

    const updated = await Showtime.findByIdAndUpdate(
      req.params.id,
      {
        movieId,
        screenId,
        startTime,
        endTime,
        basePrice,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update showtime" });
  }
};

const deleteShowtime = async (req, res) => {
  try {
    const deleted = await Showtime.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    res.json({ message: "Showtime deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete showtime" });
  }
};

const deleteShowtimesByMovie = async (req, res) => {
  try {
    await Showtime.deleteMany({ movieId: req.params.movieId });
    res.json({ message: "Showtimes deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete showtimes" });
  }
};

module.exports = {
  createShowtime,
  getAllShowtimes,
  getShowtimeById,
  getShowtimesByMovie,
  updateShowtime,
  deleteShowtime,
  deleteShowtimesByMovie,
};