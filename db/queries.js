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
    `SELECT it.transactionid, it.transactiontype, it.quantity, pb.productid, pb.quantityin, pb.currentquantity, pb.batchid, p.name 
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
  s.saleid, s.saledate, s.totalamount, s.status, s.paymentmethod,
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
    SELECT p.*, pb.*, cat.category, c.country
    FROM products p
    LEFT JOIN categories cat ON cat.categoryid = p.categoryid
    LEFT JOIN countries c ON c.countryid = p.countryid
    LEFT JOIN productbatches pb ON p.productid = pb.productid
    WHERE p.productid = ${productid}
  `);
  return rows;
};

exports.getProductsAndBatches = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM products p
    LEFT JOIN productBatches pb
    ON p.productid = pb.productid
    `);
  return rows;
};

exports.createSale = async (saleData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { totalAmount, paymentMethod, saleItems } = saleData;
    const saleResult = await client.query(
      `INSERT INTO sales (totalAmount, paymentMethod)
       VALUES ($1, $2)
       RETURNING saleID`,
      [totalAmount, paymentMethod]
    );

    const new_saleID = saleResult.rows[0].saleid;

    for (const item of saleItems) {
      await client.query(
        `INSERT INTO saleItems (saleID, batchID, quantitySold, pricePerUnit)
         VALUES ($1, $2, $3, $4)`,
        [new_saleID, item.batchID, item.quantitySold, item.pricePerUnit]
      );

      await client.query(
        `INSERT INTO inventoryTransactions (transactionType, batchID, quantity)
         VALUES ($1, $2, $3)`,
        ["SOLD", item.batchID, item.quantitySold]
      );

      await client.query(
        `UPDATE productBatches
         SET currentQuantity = currentQuantity - $1
         WHERE batchID = $2`,
        [item.quantitySold, item.batchID]
      );
    }

    await client.query("COMMIT");
    return { saleID: new_saleID, ...saleData };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Sale transaction failed", error);
    throw error;
  } finally {
    client.release();
  }
};

exports.createSpoilage = async (spoilages) => {
  const client = await pool.connect();
  let spoilageIds = [];

  try {
    await client.query("BEGIN");

    for (const spoilage of spoilages) {
      try {
        const spoilageResult = await client.query(
          `INSERT INTO spoilages (batchID, quantitySpoilt, costPerUnit, totalCost, imageURL)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING spoilageid`,
          [
            spoilage.batchID,
            spoilage.quantitySpoilt,
            spoilage.costPerUnit,
            spoilage.costPerUnit * spoilage.quantitySpoilt,
            spoilage.imageurl,
          ]
        );
        spoilageIds.push(spoilageResult.rows[0].spoilageid);

        await client.query(
          `INSERT INTO inventoryTransactions (batchId, transactionType, quantity)
          VALUES ($1, $2, $3)`,
          [spoilage.batchID, "SPOILT", spoilage.quantitySpoilt]
        );

        await client.query(
          `UPDATE productBatches
          SET currentQuantity = currentQuantity - $1
          WHERE batchId = $2`,
          [spoilage.quantitySpoilt, spoilage.batchID]
        );
      } catch (spoilageError) {
        console.error(
          "Error Processing Spoilages",
          spoilage,
          "error: ",
          spoilageError
        );
        throw spoilageError;
      }
    }

    await client.query("COMMIT");
    return { spoilageIds: spoilageIds };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction failed", error);
    throw error;
  } finally {
    client.release();
  }
};

exports.createCountry = async (country) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO countries (country)
      VALUES ($1)
      RETURNING *`,
      [country.country]
    );
    return rows;
  } catch (error) {
    console.error("Error", error.message);
  }
};

exports.checkCountry = async (country) => {
  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (SELECT * FROM countries WHERE country = $1)`,
      [country.country]
    );
    return rows;
  } catch (error) {
    console.error("Error", error.message);
  }
};

exports.createCategory = async (category) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO categories (category)
      VALUES ($1)
      RETURNING *`,
      [category.category]
    );
    return rows;
  } catch (error) {
    console.error("Error", error.message);
  }
};

exports.checkCategory = async (category) => {
  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (SELECT * FROM categories WHERE category = $1)`,
      [category.category]
    );
    return rows;
  } catch (error) {
    console.error("Error", error.message);
  }
};

exports.getProductDetsAll = async () => {
  const result = await pool.query(`
    SELECT s.supplierid, s.name FROM suppliers s;
    SELECT * FROM categories;
    SELECT * FROM countries`);
  let data = {
    supplier: result[0].rows,
    category: result[1].rows,
    country: result[2].rows,
  };
  return data;
};

exports.createProduct = async (p) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      `
      INSERT INTO products (name, description, size, categoryID, countryID, supplierID, status) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        p.name,
        p.description,
        p.size,
        p.categoryID,
        p.countryID,
        p.supplierID,
        p.status,
      ]
    );
    const productID = productResult.rows[0].productid;
    let batchResult;

    if (p.status === "IN_STOCK") {
      batchResult = await client.query(
        `INSERT INTO productbatches (productID, cost, msrp, quantityIn, currentQuantity, imageURL) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          productID,
          p.cost,
          (p.cost * 1.15) / p.quantityIn.toFixed(2),
          p.quantityIn,
          p.quantityIn,
          p.imageURL,
        ]
      );
      const batchID = batchResult.rows[0].batchID;
      inventoryResult = await client.query(
        `INSERT INTO inventoryTransactions(batchId, transactionType, quantity) VALUES ($1,$2,$3) RETURNING *`,
        [batchID, "IN", p.quantityIn]
      );
    }
    await client.query("COMMIT");
    return { product: productResult, batch: batchResult };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Sale transaction failed", error);
    throw error;
  } finally {
    client.release();
  }
};

exports.checkProductName = async (product) => {
  const { rows } = await pool.query(
    ` SELECT p.name, p.size FROM products p
    WHERE name = $1`,
    [product.name]
  );
  return rows;
};

exports.getSuppliers = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM suppliers GROUP BY supplierid ORDER BY supplierid ASC`
  );
  return rows;
};

exports.getAllSuppliers = async () => {
  const { rows } = await pool.query(`SELECT * FROM suppliers`);
  return rows;
};

exports.updateSupplier = async (id, { name, email, number }) => {
  const query =
    "UPDATE suppliers SET name = $1, email = $2, number = $3 WHERE supplierid = $4 RETURNING *";
  const values = [name, email, number, id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in updateSupplier:", error);
    throw error;
  }
};

exports.deleteSupplier = async (id) => {
  try {
    const { rows } = await pool.query(
      `
      DELETE FROM suppliers
      WHERE supplierID = $1
      AND NOT EXISTS (
      SELECT 1 FROM products WHERE supplierID = $1)
      RETURNING *`,
      [id]
    );

    return rows;
  } catch (error) {
    console.error("Error in deleting supplier", error);
    throw error;
  }
};

exports.createSupplier = async (s) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, email, number)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [s.name, s.email, s.number]
    );
    return rows;
  } catch (error) {
    console.error("Error", error.message);
  }
};

exports.deleteCategory = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM categories
      WHERE categoryID = $1
      AND NOT EXISTS (
        SELECT 1 FROM products
        WHERE categoryID = $1
      )
      RETURNING 1`,
      [id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error in deleting category", error);
    throw error;
  }
};

exports.deleteProduct = async (id) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM products
      WHERE productID = $1
      AND NOT EXISTS (
      SELECT 1 FROM productBatches
      WHERE batchID = $1)
      RETURNING 1 as result
      `,
      [id]
    );
    return rows;
  } catch (error) {
    console.error("Error in deleting supplier", error);
    throw error;
  }
};

exports.getProductBatch = async () => {
  const { rows } = await pool.query(`
    SELECT p.name AS product, p.productID, p.size, c.category, co.country, s.name AS supplier
    FROM products p
    LEFT JOIN categories c ON p.categoryID = c.categoryID
    LEFT JOIN countries co ON p.countryID = co.countryID
    LEFT JOIN suppliers s ON p.supplierID = s.supplierID;`);
  return rows;
};

exports.createBatch = async (b) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const batchResult = await client.query(
      `INSERT INTO productBatches (productID, cost, msrp, quantityIn, currentQuantity, imageURL)
     VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [b.productID, b.cost, b.msrp, b.quantityIn, b.quantityIn, b.imageURL]
    );
    const batchID = batchResult.rows[0].batchid;
    let inventoryResult;
    if (batchResult.rows[0].status === "ACTIVE") {
      inventoryResult = await client.query(
        `INSERT INTO inventoryTransactions(batchId, transactionType, quantity) VALUES ($1,$2,$3) RETURNING *`,
        [batchID, "IN", b.quantityIn]
      );
    }
    await client.query("COMMIT");
    return {
      batch: batchResult,
      inventory: inventoryResult,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Batch Creation failed", error);
    throw error;
  } finally {
    client.release();
  }
};

exports.getProductImages = async (productId) => {
  const { rows } = await pool.query(
    `SELECT * FROM productBatches
      WHERE productid = $1`,
    [productId]
  );
  return rows;
};

exports.updateSaleStatus = async (saleId, status) => {
  console.log("Sale status: ", saleId, status);
  const query1 = "UPDATE sales SET status = $1 WHERE saleID = $2 RETURNING *";
  const query2 =
    "UPDATE saleItems SET status = $1 WHERE saleID = $2 RETURNING *";
  const values = [status, saleId];

  try {
    const result1 = await pool.query(query1, values);
    const result2 = await pool.query(query2, values);
    return result1.rows[0], result2.rows[0];
  } catch (error) {
    console.error("Error in updateSupplier:", error);
    throw error;
  }
};
