CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2),
    stock_quantity INT
);

INSERT INTO products (product_name, category, price, stock_quantity) VALUES
('Wireless Mouse', 'Electronics', 15.99, 120),
('Bluetooth Headphones', 'Electronics', 49.99, 75),
('Ceramic Coffee Mug', 'Kitchenware', 8.50, 200),
('Yoga Mat', 'Fitness', 22.00, 60),
('Notebook Set (3-Pack)', 'Stationery', 6.75, 150);
