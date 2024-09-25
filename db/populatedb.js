const { Client } = require("pg");
require("dotenv").config();

const SQL_TABLE = `
CREATE DOMAIN email AS VARCHAR(255)
CHECK (VALUE ~* '^[A-Za-z0-9.%+-]+@[A-Za-z0-9.%+-]+\\.[A-Za-z]{2,}$');

CREATE TABLE IF NOT EXISTS categories (
categoryID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
category VARCHAR (255) UNIQUE
);

CREATE TABLE IF NOT EXISTS countries (
countryID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
country VARCHAR (255) UNIQUE
);

CREATE TABLE IF NOT EXISTS suppliers (
supplierID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
name VARCHAR(255) NOT NULL UNIQUE,
email email NOT NULL, 
number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS products (
productID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
name VARCHAR(100) NOT NULL,
size VARCHAR(50) NOT NULL,
description VARCHAR(1000),
categoryID INTEGER REFERENCES categories(categoryID),
countryID INTEGER REFERENCES countries (countryID),
supplierID INTEGER REFERENCES suppliers (supplierID),
status VARCHAR(20) CHECK (status IN ('IN_STOCK', 'SOLD_OUT', 'DISCONTINUED', 'COMING SOON')) DEFAULT 'IN_STOCK'
);

CREATE TABLE IF NOT EXISTS productBatches (
  batchID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  productID INTEGER REFERENCES products(productID),
  cost NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
  msrp NUMERIC(10,2) NOT NULL CHECK (msrp >= 0),
  quantityIn INTEGER NOT NULL CHECK (quantityIn > 0),
  currentQuantity INTEGER NOT NULL CHECK (currentQuantity >= 0),
  dateIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  imageURL VARCHAR(255)[],
  status VARCHAR(20) CHECK (status IN('ACTIVE', 'DEPLETED')) DEFAULT 'ACTIVE',
  CONSTRAINT check_quantity CHECK (currentQuantity <= quantityIn)
);

CREATE TABLE inventoryTransactions (
transactionID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
transactionType VARCHAR(10) NOT NULL CHECK (transactionType IN ('IN', 'SOLD', 'SPOILT', 'RETURNED', 'CANCELLED')),
batchID INTEGER REFERENCES productBatches(batchID),
quantity INTEGER NOT NULL CHECK (quantity > 0),
transactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
  saleID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  saleDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  totalAmount NUMERIC(10, 2) DEFAULT 0,
  paymentMethod VARCHAR(50) CHECK (paymentMethod IN ('CASH', 'CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('COMPLETED', 'PENDING', 'REFUNDED', 'CANCELLED')) DEFAULT 'COMPLETED'
);
CREATE TABLE saleItems (
saleItemID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
saleID INTEGER REFERENCES sales(saleID),
batchID INTEGER REFERENCES productBatches(batchID),
quantitySold INTEGER NOT NULL CHECK (quantitySold > 0),
pricePerUnit NUMERIC (10,2) NOT NULL CHECK (pricePerUnit >= 0),
status VARCHAR(20) CHECK (status IN ('COMPLETED', 'PENDING', 'REFUNDED', 'CANCELLED')) DEFAULT 'COMPLETED',
totalPrice NUMERIC (10,2) GENERATED ALWAYS AS (quantitySold * pricePerUnit) STORED
);

CREATE TABLE spoilages (
  spoilageID INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  batchID INTEGER REFERENCES productBatches(batchID),
  quantitySpoilt INTEGER NOT NULL CHECK (quantitySpoilt > 0),
  costPerUnit NUMERIC(10, 2),
  totalCost NUMERIC(10, 2),
  imageURL VARCHAR(255),
  spoilageDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW inventories AS
SELECT
    p.productID,
    p.name AS productName,
    COALESCE(SUM(pb.currentQuantity), 0) AS totalQuantity
FROM
    products p
LEFT JOIN
    productBatches pb ON p.productID = pb.productID
GROUP BY
    p.productID, p.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers (email);

CREATE VIEW category_products AS
SELECT
    c.categoryID,
    c.category,
    p.productID,
    p.name,
    p.size,
    p.description,
    p.countryID,
    p.supplierID,
    p.status
FROM
    categories c
LEFT JOIN
    products p ON p.categoryID = c.categoryID;
`;

const SQL_INSERT_DATA = `
-- Insert categories
INSERT INTO categories (category) VALUES
('Apple'), ('Orange'), ('Grape'), ('Peach'), ('Banana'), ('Kiwi');

-- Insert countries
INSERT INTO countries (country) VALUES
('New Zealand'), ('USA'), ('Spain'), ('Italy'), ('Ecuador');

-- Insert suppliers
INSERT INTO suppliers (name, email, number) VALUES
('Enza', 'orders@enza.co.nz', '+64-9-414-6700'),
('Sunkist', 'info@sunkist.com', '+1-661-290-8900'),
('Zespri', 'contact@zespri.com', '+64-7-572-7600'),
('Dole', 'consumer.care@dole.com', '+1-800-356-3111'),
('Del Monte', 'consumer@freshdelmonte.com', '+1-305-520-8400');

-- Insert products
INSERT INTO products (name, description, size, categoryID, countryID, supplierID, status) VALUES
('Envy Red Apple', 'Crunchy, crispy, sweet and tangy apples from New Zealand. The best apple in the world for eating!', '120s', 1, 1, 1, 'IN_STOCK'),
('Navel Orange', 'Juicy and seedless oranges perfect for snacking or juicing.', '88s', 2, 2, 2, 'IN_STOCK'),
('Green Kiwi', 'Fuzzy-skinned, sweet-tart kiwifruit packed with vitamin C.', '36s', 6, 1, 3, 'IN_STOCK'),
('Cavendish Banana', 'Creamy, sweet bananas ideal for snacking or baking.', '40 lbs', 5, 5, 4, 'IN_STOCK'),
('Red Globe Grape', 'Large, seeded red grapes with a sweet flavor.', '18 lbs', 3, 2, 5, 'IN_STOCK'),
('Rockit Mini Red Apple', 'Mini sized crisp apples that originate from NZ. These apples are sweet and fit just right into any bento box.', '24s', 1,1,1, 'IN_STOCK'),
('Sweet Globe Green Grapes', 'Crispy sweet green grapes originating from the US of A. These grapes have a great bite feel whilst retaining its juiciness. It is sweet with a very low tart profile. Delicious!', '20 kg', 3,2,5, 'IN_STOCK');

-- Insert product batches
INSERT INTO productBatches (productID, cost, msrp, quantityIn, currentQuantity, imageURL) VALUES
(1, 45.00, 89.99, 100, 95, ARRAY['http://example.com/envy_apple.jpg']),
(2, 35.00, 69.99, 150, 140, ARRAY['http://example.com/navel_orange.jpg']),
(3, 40.00, 79.99, 200, 190, ARRAY['http://example.com/green_kiwi.jpg']),
(4, 25.00, 49.99, 80, 74, ARRAY['http://example.com/cavendish_banana.jpg']),
(5, 30.00, 59.99, 50, 48, ARRAY['http://example.com/red_globe_grape.jpg']),
(6, 120.00, 148.99, 24, 23, ARRAY['http://example.com/rockit_apple.jpg']);


-- Insert sales with total amounts and payment methods
INSERT INTO sales (totalAmount, paymentMethod) VALUES
(479.95, 'CARD'), -- Sale 1 totalAmount: 2 * 89.99 + 5 * 69.99
(999.90, 'CASH'), -- Sale 2 totalAmount: 10 * 79.99 + 4 * 49.99
(239.96, 'DIGITAL_WALLET'); -- Sale 3 totalAmount: 2 * 59.99 + 2 * 59.99

INSERT INTO saleItems (saleID, batchID, quantitySold, pricePerUnit) VALUES
(1, 1, 2, 89.99),
(1, 2, 5, 69.99),
(2, 3, 10, 79.99),
(2, 4, 4, 49.99),
(3, 5, 2, 59.99),
(3, 5, 2, 59.99);


-- Insert spoilages
INSERT INTO spoilages (batchID, quantitySpoilt, costPerUnit, totalCost, imageURL) VALUES
(4, 2, 25.00, 50.00, 'http://example.com/spoiled_bananas.jpg'),
(6, 1, 5.00, 5.00, 'http://example.com/spoiled_rockit_apples.jpg');

-- Insert inventory transactions
INSERT INTO inventoryTransactions (batchID, transactionType, quantity) VALUES
(1, 'IN', 100), -- Initial stock for Envy Red Apple
(1, 'SOLD', 2), -- Sale of 2 Envy Red Apples
(1, 'SOLD', 3), -- Remaining apples sold

(2, 'IN', 150), -- Initial stock for Navel Orange
(2, 'SOLD', 5), -- Sale of 5 Navel Oranges
(2, 'SOLD', 5), -- Remaining oranges sold

(3, 'IN', 200), -- Initial stock for Green Kiwi
(3, 'SOLD', 10), -- Sale of 10 Green Kiwis

(4, 'IN', 80), -- Initial stock for Cavendish Banana
(4, 'SOLD', 4), -- Sale of 4 Cavendish Bananas
(4, 'SPOILT', 2), -- Spoilage of 2 Cavendish Bananas

(5, 'IN', 50), -- Initial stock for Red Globe Grape
(5, 'SOLD', 4), -- Sale of 4 Red Globe Grapes (split across two sale items)

(6, 'IN', 24), -- Initial stock for Rockit Red Apples
(6, 'SPOILT', 1); -- Spoilage of 1 pack Rockit Red Apples

`;

const SQL_TRIGGER = `
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COALESCE(SUM(currentQuantity), 0) FROM productBatches WHERE productID = NEW.productID) = 0 THEN
    UPDATE products
    SET status = 'SOLD_OUT'
    WHERE productID = NEW.productID;
  ELSE
    UPDATE products
    SET status = 'IN_STOCK'
    WHERE productID = NEW.productID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

const main = async () => {
  console.log("Seeding...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();

    // Split the SQL_TABLE string into individual statements
    const statements = SQL_TABLE.split(";").filter(
      (stmt) => stmt.trim() !== ""
    );

    // Execute each statement separately
    for (let stmt of statements) {
      await client.query(stmt + ";");
    }
    await client.query(SQL_INSERT_DATA);
    await client.query(SQL_TRIGGER);
    console.log("Done");
  } catch (err) {
    console.error("Error: ", err);
  } finally {
    await client.end();
  }
};

main();
