const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const { protect } = require("../middleware/authMiddleware");

/* SEARCH */
router.get("/search", movieController.searchMovies);

/* COMING SOON */
router.get("/coming-soon", movieController.getComingSoon);

/* NOW SHOWING */
router.get("/now-showing", movieController.getNowShowing);

/*Archived*/
router.get("/archive", movieController.getArchivedMovies);

/* ADMIN MOVIES */
router.get("/admin/movies", protect(['admin']), movieController.getAllMoviesAdmin);

router.get("/recent", movieController.getRecentMovies);

/* GET ALL */
router.get("/", movieController.getAllMovies);

/* GET SINGLE */
router.get("/:id", movieController.getMovieById);

/* CREATE */
router.post("/", movieController.createMovie);

/* UPDATE */
router.put("/:id", movieController.updateMovie);

/* DELETE */
router.delete("/:id", movieController.deleteMovie);

module.exports = router;