const pool = require("./pool");

exports.getAllCategories = async () => {
  const { rows } = await pool.query("SELECT * FROM categories");
  return rows;
};

exports.getProductCategories = async () => {
  const { rows } = await pool.query("SELECT * FROM category_products");
  return rows;
};

exports.getProductCountries = async () => {
  const { rows } = await pool.query(
    `SELECT 
    c.countryid,
    c.country,
    json_agg(json_build_object(
    'productid', p.productid,
    'name', p.name,
    'size', p.size
    )) AS products
    FROM countries c 
    LEFT JOIN products p 
    ON c.countryid = p.countryid
    GROUP BY c.countryid, c.country`
  );
  return rows;
};

exports.getInventory = async () => {
  const { rows } = await pool.query(`SELECT * FROM inventories`);
  return rows;
};

exports.getInventory2 = async () => {
  const { rows } = await pool.query(
    `SELECT it.transactionid, it.transactiontype, it.quantity, pb.productid, pb.quantityin, pb.currentquantity, p.name 
    FROM inventorytransactions it 
    LEFT JOIN productbatches pb ON pb.batchid = it.batchid 
    LEFT JOIN products p ON pb.productid = p.productid`
  );
  return rows;
};

exports.getAllCountries = async () => {
  const { rows } = await pool.query("SELECT * FROM countries");
  return rows;
};

exports.getAllProducts = async () => {
  const { rows } = await pool.query("SELECT * FROM products");
  return rows;
};

exports.getAllSales = async () => {
  const { rows } = await pool.query(`SELECT 
  s.saleid, s.saledate, s.totalamount, s.paymentmethod,
  si.quantitysold, si.priceperunit, si.totalprice, p.name
  FROM sales s 
  LEFT JOIN saleitems si ON s.saleid = si.saleid 
  LEFT JOIN productbatches pb ON pb.batchid = si.batchid 
  LEFT JOIN products p ON p.productid = pb.productid
  ORDER BY s.saleid DESC`);
  return rows;
};

exports.getAllSpoilages = async () => {
  const { rows } = await pool.query(`
    SELECT s.spoilageid, s.quantityspoilt, s.costperunit, s.totalcost, s.spoilagedate, s.imageurl,
    p.name, pb.quantityin, pb.currentquantity
    FROM spoilages s
    LEFT JOIN productbatches pb ON s.batchid = pb.batchid
    LEFT JOIN products p ON pb.productid = p.productid;`);
  return rows;
};

exports.getSpecificProduct = async (productid) => {
  const { rows } = await pool.query(`
    SELECT * 
    FROM products p
    LEFT JOIN productbatches pb
    ON p.productid = pb.productid
    LEFT JOIN categories cat
    ON cat.categoryid = p.categoryid
    LEFT JOIN countries c
    ON c.countryid = p.countryid
    WHERE p.productid = ${productid}
    `);
  return rows;
};

exports.createSale = async (productid) => {
  const { rows } = await pool.query(`
    `);
  return rows;
};
