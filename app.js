const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const { validateEnvironment, config } = require('./backend/config/env');

// Validate environment variables before starting
validateEnvironment();

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database connection with better error handling
const pool = new Pool(config.database);

// Test database connection with better error handling
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('💡 App will continue without database - showing demo data');
    console.error('📄 To fix: Install PostgreSQL and update .env with correct credentials');
  } else {
    console.log('✅ Database connected successfully');
    console.log(`🕒 Server time: ${res.rows[0].now}`);
  }
});

// Business monitoring middleware
app.use((req, res, next) => {
  // Log business registration attempts
  if (req.path === '/api/businesses' && req.method === 'POST') {
    console.log(`🆕 New business registration attempt: ${new Date().toISOString()}`);
    console.log(`📝 Business data:`, req.body);
  }
  
  // Log general API activity
  if (req.path.startsWith('/api/')) {
    console.log(`🌐 API Request: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  }
  
  next();
});

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/businesses', require('./backend/routes/businesses'));
app.use('/api/products', require('./backend/routes/products'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/orders', require('./backend/routes/orders'));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Image test route
app.get('/image-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'image-test.html'));
});

// Checkout route
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Admin API routes for monitoring
app.get('/api/admin/stats', (req, res) => {
  // Mock statistics - in production, this would query the database
  const stats = {
    totalBusinesses: 4,
    activeBusinesses: 2,
    pendingBusinesses: 1,
    inactiveBusinesses: 1,
    totalUsers: 25,
    todayRegistrations: Math.floor(Math.random() * 5),
    todayUsers: Math.floor(Math.random() * 10),
    todayViews: Math.floor(Math.random() * 100),
    serverUptime: process.uptime(),
    databaseStatus: 'Connected',
    serverStatus: 'Running'
  };
  
  res.json(stats);
});

app.get('/api/admin/businesses', (req, res) => {
  // Mock business data - in production, this would query the database
  const businesses = [
    {
      id: 1,
      name: "Los Barbados",
      category: "Food & Drinks",
      location: "Unity Hall",
      owner: "Chris Elliot",
      status: "active",
      created_at: "2024-01-15",
      contact: "+233 25 727 0471"
    },
    {
      id: 2,
      name: "TechFix Pro",
      category: "Electronics",
      location: "Africa Hall",
      owner: "Sarah Johnson",
      status: "active",
      created_at: "2024-02-01",
      contact: "+233 24 123 4567"
    },
    {
      id: 3,
      name: "Style Studio",
      category: "Fashion",
      location: "Queen's Hall",
      owner: "Emma Davis",
      status: "pending",
      created_at: "2024-01-20",
      contact: "+233 26 987 6543"
    },
    {
      id: 4,
      name: "Campus Cleaning",
      category: "Services",
      location: "Kotei",
      owner: "John Smith",
      status: "inactive",
      created_at: "2024-01-10",
      contact: "+233 20 555 1234"
    }
  ];
  
  res.json(businesses);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
