const express = require("express");
const router = express.Router();
const {
  getActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

router.get("/", getActiveBanners);
router.get("/admin/all", getAllBanners);
router.get("/admin/:id", getBannerById);
router.post("/admin", createBanner);
router.put("/admin/:id", updateBanner);
router.delete("/admin/:id", deleteBanner);

module.exports = router;