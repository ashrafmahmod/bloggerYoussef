const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserProfileCtrl,
  updateUserProfileCtrl,
  getAllUsersCount,
  profilePhotouploadCtrl,
  deleteUserProfileCtrl,
} = require("../controllers/usersContoller");
const photoUpload = require("../middlewares/photoupload");
const {
  verifyToken,
  verifyAdminAndToken,
  verifyTokenAndOnlyUser,
  verifyTokenAuthorization,
} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");
// get all users
router.get("/profile", verifyAdminAndToken, getAllUsers);
// profile photo upload
router.post(
  "/profile/profile-photo-upload",
  verifyToken,
  photoUpload.single("image") /*from client*/,
  profilePhotouploadCtrl
);

// get single user
router.get("/profile/:id", validateObjectId, getUserProfileCtrl);
// delete user
router.delete(
  "/profile/:id",
  validateObjectId,
  verifyTokenAuthorization,
  deleteUserProfileCtrl
);
// update user
router.put(
  "/profile/:id",
  validateObjectId,
  verifyTokenAndOnlyUser,
  updateUserProfileCtrl
);
// get all users count
router.get("/count", verifyAdminAndToken, getAllUsersCount);
module.exports = router;
