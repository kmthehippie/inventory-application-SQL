const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

exports.GetSales = asyncHandler(async (req, res, next) => {
  const data = await db.getAllSales();
  // Create an object to hold the sales information
  let salesData = {};
  // Loop through the sales data
  for (const sale of data) {
    const {
      saleid,
      saledate,
      totalamount,
      paymentmethod,
      quantitysold,
      priceperunit,
      totalprice,
      name,
    } = sale;
    // If the sale is not yet in the salesData object, create a new entry
    if (!salesData[saleid]) {
      salesData[saleid] = {
        saleid,
        saledate,
        totalamount,
        paymentmethod,
        saleItems: [],
      };
    }
    // Add the current sale item to the sale's saleItems array
    salesData[saleid].saleItems.push({
      name,
      pricePerUnit: priceperunit,
      quantity: quantitysold,
      totalPrice: totalprice,
    });
  }
  res.render("sales", { title: "Sales", salesData });
});

exports.CreateSales = asyncHandler(async (req, res, next) => {
  res.render("newSales", {
    title: "Create a new sale",
  });
});
