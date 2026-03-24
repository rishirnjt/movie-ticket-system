const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");

router.get("/", protect(["Admin"]), reportController.getAdminReport);

module.exports = router;