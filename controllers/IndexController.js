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

exports.GetByCategories = asyncHandler(async (req, res, next) => {
  const productCat = await db.getProductCategories();
  res.render("category", {
    title: "Category",
    productCat,
  });
});

exports.GetByCountries = asyncHandler(async (req, res, next) => {
  let data = await db.getProductCountries();
  // Filter out countries with no products
  data = data.filter((country) => {
    // Check if the country has any non-null products
    return country.products.some((product) => product.productid !== null);
  });

  // Remove null products from each country
  data.forEach((country) => {
    country.products = country.products.filter(
      (product) => product.productid !== null
    );
  });

  res.render("country", {
    title: "Country",
    data,
  });
});

exports.GetInventory = asyncHandler(async (req, res, next) => {
  const data = await db.getInventory();
  const data2 = await db.getInventory2();

  // Create an object to hold the product information
  let productInventory = {};

  // Loop through the data2 (the product transaction data)
  for (const transaction of data2) {
    const {
      transactionid,
      transactiontype,
      quantity,
      productid,
      quantityin,
      currentquantity,
      name,
    } = transaction;

    // If the product is not yet in the productInventory object, create a new entry
    if (!productInventory[productid]) {
      productInventory[productid] = {
        name,
        productid,
        quantityin: quantityin,
        currentQuantity: currentquantity,
        transactions: [],
      };
    }

    // Add the current transaction to the product's transactions array
    productInventory[productid].transactions.push({
      transactionid,
      transactiontype,
      quantity,
    });
  }
  // const data = await db.getProductTransactions();
  res.render("inventory", {
    title: "Inventory",
    data,
    productInventory,
  });
});

exports.GetSpoilages = asyncHandler(async (req, res, next) => {
  const data = await db.getAllSpoilages();
  // Create an object to hold the spoilage data
  const spoilageData = [];

  // Loop through the data and create an object for each spoilage
  for (const row of data) {
    spoilageData.push({
      spoilageid: row.spoilageid,
      quantityspoilt: row.quantityspoilt,
      costperunit: row.costperunit,
      totalcost: row.totalcost,
      spoilagedate: row.spoilagedate,
      name: row.name,
      size: row.size,
      quantityin: row.quantityin,
      currentquantity: row.currentquantity,
    });
  }

  // Render the spoilages view with the spoilageData object
  res.render("spoilages", {
    title: "Spoilages",
    spoilageData,
  });
});

exports.GetSpecificProduct = asyncHandler(async (req, res, next) => {
  const productid = req.params.id;
  const data = await db.getSpecificProduct(productid);

  if (!data) {
    return res.status(404).send("Product not found");
  }
  res.render("product", {
    title: data[0].name,
    data: data[0],
  });
});
