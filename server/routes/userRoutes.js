const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

//@desc Get logged-in user profile
//@route GET/api/user/me
router.get("/me", protect(["Customer"]), userController.getMyProfile);

//@desc Update logged-in user profile
//@route PUT/api/users/update
router.put("/update", protect(["Customer"]), userController.updateMyProfile);

//@desc Get total users count (ADMIN)
//@route GET/api/users/count
router.get("/count", protect(["Admin"]), userController.getUsersCount);

//@desc Get all users (ADMIN)
//@route GET/api/users
router.get("/", protect(["Admin"]), userController.getAllUsers);

//@desc Block user (Admin)
//@route PUT/api/users/:id/block
router.put("/:id/block", protect(["Admin"]), userController.blockUser);

//@desc Unblock user(Admin)
//@route PUT/api/users/:id/unblock
router.put("/:id/unblock", protect(["Admin"]), userController.unblockUser);

module.exports = router;