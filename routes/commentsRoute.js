const router = require("express").Router();
const {
  verifyToken,
  verifyAdminAndToken,
} = require("../middlewares/verifyToken");
const {
  createCommentCtrl,
  getAllCommentsCtrl,
  deleteCommentCtrl,
  UpdateCommentCtrl,
} = require("../controllers/commentsController");
const validateObjectId = require("../middlewares/validateObjectId");
// api/comments
router
  .route("/")
  .post(verifyToken, createCommentCtrl)
  .get(verifyAdminAndToken, getAllCommentsCtrl);
// api/comments/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyToken, deleteCommentCtrl)
  .put(validateObjectId, verifyToken, UpdateCommentCtrl);
module.exports = router;
