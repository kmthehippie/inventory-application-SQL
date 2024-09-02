const express = require("express");
const router = express.Router();
const suppliersController = require("../controllers/SuppliersController");

router.get("/", suppliersController.GetSuppliers);
router.get("/create", suppliersController.CreateSupplierGet);
router.post("/create", suppliersController.CreateSupplierPost);
router.get("/list", suppliersController.GetAllSuppliers);
router.post("/update/:id", suppliersController.UpdateSuppliers);
router.delete("/delete/:id", suppliersController.DeleteSupplier);

module.exports = router;
