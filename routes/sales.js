const express = require("express");
const router = express.Router();

const salesController = require("../controllers/SalesController");

router.get("/", salesController.GetSales);
router.get("/create", salesController.CreateSales);

module.exports = router;
