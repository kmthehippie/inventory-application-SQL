const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

exports.GetSpecificProduct = asyncHandler(async (req, res, next) => {
  const productid = req.params.id;
  const data = await db.getSpecificProduct(productid);
  if (!data || data.length === 0) {
    return res.status(404).send("Product not found");
  }
  res.render("product", {
    title: data[0].name,
    product: data[0],
    batches: data,
  });
});

exports.CreateProductGet = asyncHandler(async (req, res, next) => {
  try {
    const data = await db.getProductDetsAll();
    return res.status(200).render("newProducts", {
      title: "Create New Products",
      data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

exports.CreateProductPost = asyncHandler(async (req, res, next) => {
  try {
    const productDetails = req.body;

    const result = await db.createProduct(productDetails);
    return res.status(201);
  } catch (err) {
    const productDetails = req.body;
    const data = await db.getProductDetsAll();
    return res.status(400).render("newProducts", {
      title: "Create New Products",
      data,
      error: err.message,
      formData: productDetails,
    });
  }
});

exports.CheckProductName = asyncHandler(async (req, res, next) => {
  const productName = req.query;
  try {
    const products = await db.checkProductName(productName);
    if (products.length > 0) {
      const sizes = products.map((product) => product.size);
      return res.json({ exists: true, sizes });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

exports.DeleteProduct = asyncHandler(async (req, res, next) => {
  try {
    const result = await db.deleteProduct(req.params.id);
    if (!result) {
      res.status(403).json({
        message:
          "Forbidden to delete as there are product batches with this attached product id",
      });
    }
    res.status(204).json({ productid: req.params.id, result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  res.status(200).json({ productid: req.params.id });
});
