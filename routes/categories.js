const express = require("express");
const router = express.Router();

const categoriesController = require("../controllers/CategoriesController");

router.get("/", categoriesController.GetByCategories);
router.get(
  "/create",
  categoriesController.CreateCategoriesGet
);
router.post("/create", categoriesController.CreateCategoriesPost);
router.delete("/delete/:id", categoriesController.DeleteCategory);
router.get("/allCategories", categoriesController.GetAllCategories);
module.exports = router;
