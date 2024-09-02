const express = require("express");
const router = express.Router();
const countriesController = require("../controllers/CountriesController");

router.get("/", countriesController.GetByCountries);
router.get("/create", countriesController.CreateCountriesGet);
router.post("/create", countriesController.CreateCountriesPost);
router.get("/allCountries", countriesController.GetAllCountries);

module.exports = router;
