const express = require("express");
const router = express.Router();

const indexController = require("../controllers/IndexController");

router.get("/", indexController.GetDashboard);
router.get("/categories", indexController.GetByCategories);
router.get("/countries", indexController.GetByCountries);
router.get("/inventory", indexController.GetInventory);
router.get("/spoilages", indexController.GetSpoilages);
router.get("/product/:id", indexController.GetSpecificProduct);

module.exports = router;
