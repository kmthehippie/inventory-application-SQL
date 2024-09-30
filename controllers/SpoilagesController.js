const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

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

exports.CreateSpoilagesGet = asyncHandler(async (req, res, next) => {
  const data = await db.getProductsAndBatches();

  res.render("newSpoilage", {
    title: "Create New Spoilage",
    productBatches: data,
  });
});

exports.CreateSpoilagesPost = asyncHandler(async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    console.log(req.body);
  } else {
    const spoilageData = req.body;
    try {
      const newSpoilage = await db.createSpoilage(spoilageData);
      res.json(newSpoilage);
    } catch (error) {
      next(error);
    }
  }
});
