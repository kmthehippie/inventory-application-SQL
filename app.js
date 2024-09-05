const express = require("express");
const session = require("express-session");
const app = express();

const createError = require("http-errors");
const path = require("path");
require("dotenv").config();

//routers
const indexRouter = require("./routes/index");
const salesRouter = require("./routes/sales");
const spoilagesRouter = require("./routes/spoilages");
const countriesRouter = require("./routes/countries");
const categoriesRouter = require("./routes/categories");
const productsRouter = require("./routes/products");
const suppliersRouter = require("./routes/suppliers");

//view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//setup all other stuff
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

app.use("/", indexRouter);
app.use("/sales", salesRouter);
app.use("/spoilages", spoilagesRouter);
app.use("/countries", countriesRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/suppliers", suppliersRouter);

//error handling
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", { title: "Error", error: err });
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
