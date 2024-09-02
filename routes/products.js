const express = require("express");
const router = express.Router();
const productsController = require("../controllers/ProductsController");

router.get("/create", productsController.CreateProductGet);
router.post("/create", productsController.CreateProductPost);
router.get("/check-name", productsController.CheckProductName);
router.get("/:id", productsController.GetSpecificProduct);
router.delete("/delete/:id", productsController.DeleteProduct);

module.exports = router;
