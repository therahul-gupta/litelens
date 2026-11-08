import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

export function createSampleDatabase(): string {
  const samplePath = path.join(os.tmpdir(), `litelens_sample_${Date.now()}.db`);
  const db = new Database(samplePath);

  db.exec(`
    -- Create Users table
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('admin', 'customer', 'staff')) DEFAULT 'customer',
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create Products table
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      active BOOLEAN DEFAULT 1
    );

    -- Create Orders table
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')) DEFAULT 'pending',
      total_amount REAL NOT NULL,
      shipping_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create Order Items table
    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- Indexes
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_products_category ON products(category);
    CREATE INDEX idx_orders_user_id ON orders(user_id);
    CREATE INDEX idx_order_items_order ON order_items(order_id);

    -- Create View
    CREATE VIEW v_top_selling_products AS
    SELECT 
      p.id as product_id,
      p.title,
      p.category,
      SUM(oi.quantity) as total_units_sold,
      ROUND(SUM(oi.quantity * oi.unit_price), 2) as total_revenue
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
    GROUP BY p.id
    ORDER BY total_units_sold DESC;
  `);

  // Insert Mock Users
  const insertUser = db.prepare('INSERT INTO users (name, email, role, metadata) VALUES (?, ?, ?, ?)');
  insertUser.run('Sarah Connor', 'sarah@skynet-resistance.org', 'admin', JSON.stringify({ preferences: { theme: 'dark' }, phone: '+1-555-0101' }));
  insertUser.run('Bruce Wayne', 'bruce@wayne-enterprises.com', 'customer', JSON.stringify({ vip: true, location: 'Gotham' }));
  insertUser.run('Peter Parker', 'peter.parker@dailybugle.com', 'customer', JSON.stringify({ camera: 'Sony Alpha', freelance: true }));
  insertUser.run('Tony Stark', 'tony@starkindustries.com', 'customer', JSON.stringify({ tier: 'Arc Platinum', armorUnits: 85 }));
  insertUser.run('Diana Prince', 'diana@themyscira.gov', 'staff', JSON.stringify({ department: 'Antiquities' }));
  insertUser.run('Clark Kent', 'clark@dailyplanet.com', 'customer', JSON.stringify({ city: 'Metropolis' }));

  // Insert Mock Products
  const insertProduct = db.prepare('INSERT INTO products (title, category, price, stock_quantity, rating) VALUES (?, ?, ?, ?, ?)');
  insertProduct.run('Mechanical Keyboard (Cherry Brown)', 'Electronics', 149.99, 45, 4.8);
  insertProduct.run('Ultra-Wide 34" Curved Monitor', 'Electronics', 599.00, 18, 4.9);
  insertProduct.run('Ergonomic Mesh Chair', 'Furniture', 329.50, 22, 4.7);
  insertProduct.run('Standing Desk (Electric)', 'Furniture', 499.99, 12, 4.6);
  insertProduct.run('USB-C 10-in-1 Hub', 'Accessories', 59.95, 120, 4.5);
  insertProduct.run('Wireless Noise-Cancelling Headphones', 'Audio', 249.99, 64, 4.8);
  insertProduct.run('Studio Monitor Speakers (Pair)', 'Audio', 199.00, 30, 4.7);
  insertProduct.run('Desk Mat (Microfiber 90x40cm)', 'Accessories', 29.99, 210, 4.4);

  // Insert Mock Orders
  const insertOrder = db.prepare('INSERT INTO orders (user_id, status, total_amount, shipping_address) VALUES (?, ?, ?, ?)');
  insertOrder.run(2, 'completed', 748.99, '1007 Mountain Drive, Gotham City');
  insertOrder.run(3, 'completed', 89.94, '20 Ingram St, Forest Hills, Queens, NY');
  insertOrder.run(4, 'completed', 1098.99, '10880 Wilshire Blvd, Los Angeles, CA');
  insertOrder.run(1, 'processing', 149.99, 'Hidden Bunker 4, Baja California');
  insertOrder.run(5, 'pending', 329.50, 'Themyscira Embassy, Washington DC');

  // Insert Mock Order Items
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
  insertItem.run(1, 2, 1, 599.00);
  insertItem.run(1, 1, 1, 149.99);
  insertItem.run(2, 5, 1, 59.95);
  insertItem.run(2, 8, 1, 29.99);
  insertItem.run(3, 2, 1, 599.00);
  insertItem.run(3, 4, 1, 499.99);
  insertItem.run(4, 1, 1, 149.99);
  insertItem.run(5, 3, 1, 329.50);

  db.close();
  return samplePath;
}

