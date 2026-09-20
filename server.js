// server.js
// Simple Node.js + Express + MySQL backend with CRUD operations for "products" table

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool (values come from environment variables set in docker-compose.yml)
// A pool is used instead of a single connection because a single connection can silently
// close (idle timeout, network blip, etc.) and every query after that would then fail with
// "Can't add new command when connection is in closed state". A pool opens new connections
// as needed and recovers automatically.
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'testdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Wait for MySQL to be ready (container may take a few seconds to start), then create the table
function waitForDbAndInit() {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Waiting for MySQL to be ready...', err.message);
      setTimeout(waitForDbAndInit, 5000);
      return;
    }
    console.log('Connected to MySQL database.');
    createProductsTable();
  });
}

waitForDbAndInit();

// Create products table if it doesn't exist
function createProductsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      price DECIMAL(10, 2),
      stock_quantity INT
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) {
      // On first boot MySQL restarts once (temp init server -> real server), so the
      // connection can drop right after SELECT 1 succeeded. Retry instead of giving up.
      console.error('Error creating table, retrying...', err.code, err.sqlMessage || err.message);
      setTimeout(waitForDbAndInit, 5000);
      return;
    }
    console.log('Products table ready.');
  });
}

// ---------- CRUD ROUTES ----------

// CREATE - Add a new product
app.post('/products', (req, res) => {
  const { product_name, category, price, stock_quantity } = req.body;

  if (!product_name) {
    return res.status(400).json({ error: 'product_name is required' });
  }

  const query = 'INSERT INTO products (product_name, category, price, stock_quantity) VALUES (?, ?, ?, ?)';
  db.query(query, [product_name, category, price, stock_quantity], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Product created', product_id: result.insertId });
  });
});

// READ - Get all products
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// READ - Get a single product by ID
app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM products WHERE product_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(results[0]);
  });
});

// UPDATE - Update a product by ID
app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, category, price, stock_quantity } = req.body;

  const query = `
    UPDATE products
    SET product_name = ?, category = ?, price = ?, stock_quantity = ?
    WHERE product_id = ?
  `;

  db.query(query, [product_name, category, price, stock_quantity, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  });
});

// DELETE - Delete a product by ID
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE product_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
