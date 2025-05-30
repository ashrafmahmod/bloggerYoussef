const router = require("express").Router();
const photoUpload = require("../middlewares/photoupload");
const { verifyToken } = require("../middlewares/verifyToken");
const {
  createPostCtrl,
  getAllPostsCtrl,
  getSinglePostsCtrl,
  getPostsCountCtrl,
  deletePostsCtrl,
  updatePostCtrl,
  updatePostImageCtrl,
  toggleLikeCtrl,
} = require("../controllers/postsConrollers");
const validateObjetId = require("../middlewares/validateObjectId");
// api/posts create new post
router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), createPostCtrl)
  .get(getAllPostsCtrl);
// api/posts/count
// router.route("/count").get(getPostsCountCtrl);
router.get("/count", getPostsCountCtrl);
// api/posts/:id
router
  .route("/:id")
  .get(validateObjetId, getSinglePostsCtrl)
  .delete(validateObjetId, verifyToken, deletePostsCtrl)
  .put(validateObjetId, verifyToken, updatePostCtrl);
router
  .route("/update-image/:id")
  .put(
    validateObjetId,
    verifyToken,
    photoUpload.single("image"),
    updatePostImageCtrl
  );
// api/posts/like/:id
router.route("/like/:id").put(validateObjetId, verifyToken, toggleLikeCtrl);
module.exports = router;
