const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

exports.GetByCategories = asyncHandler(async (req, res, next) => {
  const productCat = await db.getProductCategories();

  const formattedData = productCat.reduce((acc, product) => {
    const { categoryid, category, ...productData } = product;
    const existingCategory = acc.find((cat) => cat.categoryid === categoryid);
    if (existingCategory) {
      existingCategory.productlist.push(productData);
    } else {
      acc.push({
        category,
        categoryid,
        productlist: [productData],
      });
    }
    return acc;
  }, []);

  res.render("category", {
    title: "Categories",
    data: formattedData,
  });
});

exports.GetAllCategories = asyncHandler(async (req, res, next) => {
  try {
    let data = await db.getAllCategories();
    res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: err.message });
  }
});

exports.CreateCategoriesGet = asyncHandler(async (req, res, next) => {
  try {
    let data = await db.getAllCategories();
    res.render("newCategories", {
      title: "Add Category to Database",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.CreateCategoriesPost = asyncHandler(async (req, res, next) => {
  const categoryData = req.body;
  try {
    if (!categoryData) {
      res.status(422).json({ error: "Category Is Required" });
    }
    const existResults = await db.checkCategory(categoryData);
    if (existResults[0].exists === true) {
      res.status(402).json({
        error: `Category ${categoryData.category} Exists in Database`,
      });
    }
    const result = await db.createCategory(categoryData);

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

exports.DeleteCategory = asyncHandler(async (req, res, next) => {
  try {
    const result = await db.deleteCategory(req.params.id);
    if (!result) {
      res.status(403).json({
        success: true,
        message:
          "Forbidden to delete as there are products with this attached category id",
      });
    }
    res.status(204).json({ categoryid: req.params.id, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
