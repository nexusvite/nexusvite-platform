-- Create test_products table
CREATE TABLE IF NOT EXISTS test_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  in_stock BOOLEAN,
  created_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_test_products_updated_at ON test_products;
CREATE TRIGGER update_test_products_updated_at
BEFORE UPDATE ON test_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO test_products (name, description, price, in_stock, created_date)
VALUES
  ('Laptop Pro', 'High-performance laptop for developers', 1299.99, true, NOW()),
  ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, true, NOW()),
  ('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 149.99, false, NOW()),
  ('USB-C Hub', '7-in-1 USB-C hub with HDMI', 49.99, true, NOW()),
  ('Monitor Stand', 'Adjustable monitor stand with drawer', 89.99, true, NOW());