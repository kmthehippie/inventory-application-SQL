const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");

exports.GetByCountries = asyncHandler(async (req, res, next) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.GetAllCountries = asyncHandler(async (req, res, next) => {
  try {
    let data = await db.getAllCountries();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.CreateCountriesGet = asyncHandler(async (req, res, next) => {
  try {
    let data = await db.getAllCountries();
    console.log(data);
    res.render("newCountries", {
      title: "Add Country to Database",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.CreateCountriesPost = asyncHandler(async (req, res, next) => {
  const countryData = req.body;

  try {
    if (!countryData) {
      res.status(422).json({ error: "Country Name is Required" });
    }

    const existResults = await db.checkCountry(countryData);

    if (existResults[0].exists === true) {
      res
        .status(402)
        .json({ error: `Country ${countryData.country} Exists in Database` });
    }
    const result = await db.createCountry(countryData);

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
