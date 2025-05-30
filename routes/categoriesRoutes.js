const router = require("express").Router();
const {
  verifyToken,
  verifyAdminAndToken,
} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");
const {
  createCategoryCtrl,
  getAllCategoriesCtrl,
  deleteCategoryCtrl,
} = require("../controllers/categoriesController");
const { route } = require("./commentsRoute");
// api/categories
router
  .route("/")
  .post(verifyAdminAndToken, createCategoryCtrl)
  .get(getAllCategoriesCtrl);
// /api/categories/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyAdminAndToken, deleteCategoryCtrl);
module.exports = router;
