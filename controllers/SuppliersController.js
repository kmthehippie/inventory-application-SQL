const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

exports.GetSuppliers = asyncHandler(async (req, res, next) => {
  try {
    const data = await db.getSuppliers();
    res.render("suppliers", {
      title: "Current Suppliers List",
      suppliers: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.UpdateSuppliers = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, number } = req.body;

  try {
    if (!name || !email || !number) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const updatedSupplier = await db.updateSupplier(id, {
      name,
      email,
      number,
    });

    if (!updatedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(200).json({
      message: "Supplier updated successfully",
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

exports.DeleteSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const deleteSupplier = await db.deleteSupplier(id);
    if (!deleteSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.status(200).json({
      message: "Supplier deleted successfully",
      supplier: deleteSupplier,
    });
  } catch (error) {
    console.error("Error deleting supplier: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

exports.CreateSupplierGet = asyncHandler(async (req, res, next) => {
  // check if supplier name has already been added in the db
  res.render("newSupplier", {
    title: "Create A New Supplier",
  });
});
exports.CreateSupplierPost = asyncHandler(async (req, res, next) => {
  const { name, email, number } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Supplier name is required" });
  }
  try {
    const supplier = await db.createSupplier({ name, email, number });
    res
      .status(201)
      .json({ message: "Supplier created successfully", supplier });
  } catch (error) {
    next(error);
  }
});

exports.GetAllSuppliers = asyncHandler(async (req, res, next) => {
  try {
    const data = await db.getAllSuppliers();
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
