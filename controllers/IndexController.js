const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

exports.GetDashboard = asyncHandler(async (req, res, next) => {
  try {
    const categories = await db.getAllCategories();
    const countries = await db.getAllCountries();
    const products = await db.getAllProducts();
    res.render("dashboard", {
      title: "Dashboard",
      categories: categories,
      countries: countries,
      products: products,
    });
  } catch (err) {
    console.error("Error fetching categories: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.GetInventory = asyncHandler(async (req, res, next) => {
  const data = await db.getInventory();
  const data2 = await db.getInventory2();

  let productInventory = {};
  for (const transaction of data2) {
    const {
      transactionid,
      transactiontype,
      quantity,
      productid,
      batchid,
      quantityin,
      currentquantity,
      name,
    } = transaction;

    if (!productInventory[productid]) {
      productInventory[productid] = {
        name,
        productid,
        batches: {},
      };
    }

    if (!productInventory[productid].batches[batchid]) {
      productInventory[productid].batches[batchid] = {
        batchid,
        quantityin,
        currentquantity,
        transactions: [],
      };
    }
    productInventory[productid].batches[batchid].transactions.push({
      transactionid,
      transactiontype,
      quantity,
    });
  }
  res.render("inventory", {
    title: "Inventory",
    data,
    productInventory,
  });
});

exports.GetBatches = asyncHandler(async (req, res, next) => {
  const data = await db.getProductBatch();
  res.render("newBatch.ejs", {
    title: "Create New Product Batch",
    data,
  });
});

exports.CreateBatchesPost = asyncHandler(async (req, res, next) => {
  const { productID, cost, msrp, quantityIn } = req.body;

  try {
    // JUST FOR FUTURE REF: I CREATED THIS REQ.IMGURLS IN THE MIDDLEWARE
    console.log(req.imgurls);
    const data = {
      productID: productID,
      cost: cost,
      msrp: msrp,
      quantityIn: quantityIn,
      imageURL: req.imgurls,
    };
    const result = await db.createBatch(data);
    if (result) {
      res.redirect("/inventory");
    }
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).send("Internal Server Error");
  }
});
