const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'knust_enterprise_hub',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing database...');
    
    // Create tables
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          index_number VARCHAR(20) UNIQUE NOT NULL,
          hall_of_residence VARCHAR(100) NOT NULL,
          department VARCHAR(100) NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          profile_picture_url TEXT,
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Businesses table
      CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          location VARCHAR(100) NOT NULL,
          contact_number VARCHAR(20) NOT NULL,
          whatsapp_link VARCHAR(255),
          instagram_handle VARCHAR(100),
          logo_url TEXT,
          owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          is_verified BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Products table
      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          image_url TEXT,
          business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          stock_quantity INTEGER DEFAULT 0,
          is_available BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
          total_amount DECIMAL(10,2) NOT NULL,
          delivery_address TEXT NOT NULL,
          delivery_instructions TEXT,
          payment_method VARCHAR(50) DEFAULT 'cash',
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Order items table
      CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Reviews table
      CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          icon_class VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
      CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(location);
      CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_index_number ON users(index_number);
    `);

    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
      CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_products_updated_at ON products;
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert default categories
    await client.query(`
      INSERT INTO categories (name, description, icon_class) VALUES
      ('Food & Drinks', 'Restaurants, cafes, and food delivery services', 'fas fa-utensils'),
      ('Fashion', 'Clothing, accessories, and beauty products', 'fas fa-tshirt'),
      ('Electronics', 'Gadgets, repairs, and tech services', 'fas fa-laptop'),
      ('Services', 'Tutoring, cleaning, and other services', 'fas fa-tools'),
      ('Books & Stationery', 'Academic books and school supplies', 'fas fa-book'),
      ('Health & Wellness', 'Fitness, health products, and wellness services', 'fas fa-heartbeat'),
      ('Transportation', 'Ride sharing and delivery services', 'fas fa-car'),
      ('Other', 'Miscellaneous products and services', 'fas fa-ellipsis-h')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert sample data
    await client.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, index_number, hall_of_residence, department, phone_number) VALUES
      ('kwame123', 'kwame@knust.edu.gh', 'hashed_password', 'Kwame', 'Mensah', '123456789', 'Unity Hall', 'Computer Science', '233257270471'),
      ('ama_serwaa', 'ama@knust.edu.gh', 'hashed_password', 'Ama', 'Serwaa', '987654321', 'Africa Hall', 'Business Administration', '233244556677'),
      ('kwesi_manu', 'kwesi@knust.edu.gh', 'hashed_password', 'Kwesi', 'Manu', '456789123', 'Independence Hall', 'Engineering', '233255667788')
      ON CONFLICT (username) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO businesses (name, description, category, location, contact_number, whatsapp_link, instagram_handle, owner_id) VALUES
      ('Los Barbados', 'Delicious homemade meals delivered to your hostel at affordable prices.', 'Food & Drinks', 'Unity Hall', '233123456789', '233123456789', 'losbarbados_knust', 1),
      ('Ayeduase Tech Solutions', 'Laptop repairs, phone screen replacements, and software installations.', 'Electronics', 'CCB', '233234567890', '233234567890', 'ayeduase_tech', 2),
      ('Kwaku''s Thrift Collections', 'Trendy clothes and accessories for students at student-friendly prices.', 'Fashion', 'Africa Hall', '233345678901', '233345678901', 'kwaku_thrift', 3)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO products (name, description, price, business_id, category, stock_quantity) VALUES
      ('Jollof Rice with Chicken', 'Delicious Ghanaian jollof rice with fried chicken and salad', 25.00, 1, 'Food & Drinks', 50),
      ('Banku with Tilapia', 'Traditional banku with grilled tilapia and pepper sauce', 30.00, 1, 'Food & Drinks', 30),
      ('Laptop Screen Replacement', 'Professional laptop screen replacement service', 150.00, 2, 'Electronics', 10),
      ('Phone Screen Repair', 'Quick and reliable phone screen repair', 80.00, 2, 'Electronics', 15),
      ('Vintage Denim Jacket', 'Stylish vintage denim jacket in excellent condition', 45.00, 3, 'Fashion', 5),
      ('Designer Sneakers', 'Authentic designer sneakers at affordable prices', 120.00, 3, 'Fashion', 8)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO reviews (user_id, business_id, rating, comment) VALUES
      (2, 1, 5, 'The best jollof on campus! Always delivered hot and fresh.'),
      (3, 1, 4, 'Great food, but sometimes delivery takes longer than expected.'),
      (1, 2, 5, 'Excellent service! Fixed my laptop screen in just 2 hours.'),
      (3, 2, 4, 'Good quality repairs, reasonable prices.'),
      (1, 3, 5, 'Amazing collection! Found exactly what I was looking for.'),
      (2, 3, 4, 'Great prices and quality items.')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Database initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
