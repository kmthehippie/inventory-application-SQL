const express = require("express");
const router = express.Router();
const spoilagesController = require("../controllers/SpoilagesController");

router.get("/", spoilagesController.GetSpoilages);
router.get("/create", spoilagesController.CreateSpoilagesGet);
router.post("/create", spoilagesController.CreateSpoilagesPost);

module.exports = router;
