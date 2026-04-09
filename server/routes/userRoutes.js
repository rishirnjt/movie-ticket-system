const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const userController = require("../controllers/userController");

router.get("/me", protect(["Customer"]), userController.getMyProfile);
router.get("/loyalty", protect(["Customer"]), userController.getMyLoyalty);

router.put(
  "/update",
  protect(["Customer"]),
  upload.single("profilePic"),
  userController.updateProfile
);

router.get("/count", protect(["Admin"]), userController.getUsersCount);
router.get("/", protect(["Admin"]), userController.getAllUsers);
router.put("/:id/block", protect(["Admin"]), userController.blockUser);
router.put("/:id/unblock", protect(["Admin"]), userController.unblockUser);

module.exports = router;