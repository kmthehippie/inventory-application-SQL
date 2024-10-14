const express = require("express");
const router = express.Router();
const salesController = require("../controllers/SalesController");

router.get("/", salesController.GetSales);
router.get("/create", salesController.CreateSalesGet);
router.post("/create", salesController.CreateSalesPost);
router.post("/update/:id", salesController.UpdateSalesStatus);

module.exports = router;
