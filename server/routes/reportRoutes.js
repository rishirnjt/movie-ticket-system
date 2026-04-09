const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getAdminReport } = require("../controllers/reportController");

router.get("/", protect(["Admin"]), getAdminReport);

module.exports = router;