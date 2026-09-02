const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');
const initDb = require('./config/initDb');

const aicsRoutes = require('./routes/aics');
const chatRoutes = require('./routes/chat');
const activityLogRoutes = require('./routes/activityLog');
const soloParentRoutes = require('./routes/soloParentRoutes');
const childWelfareRoutes = require('./routes/childWelfareRoutes');
const financialAidRoutes = require('./routes/financialAid');
const appointmentRoutes = require('./routes/appointments');
const notificationRoutes = require('./routes/notifications');
const livelihoodRoutes = require('./routes/livelihood');
const emailRoutes = require('./routes/email');
const pwdSeniorRoutes = require('./routes/pwdSeniorRoutes');
const { autoReleaseScheduledDisbursements } = require('./controllers/financialAidController');

const app = express();

// Configure CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.replace(/\/+$/, ''), 'http://localhost:5173', 'http://localhost:3000']
  : '*';

app.use(cors({
  origin: allowedOrigins === '*' ? '*' : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const soloParentDir = path.join(uploadsDir, 'solo-parent');
const childWelfareDir = path.join(uploadsDir, 'child-welfare');
const aicsDir = path.join(uploadsDir, 'aics');
const livelihoodDir = path.join(uploadsDir, 'livelihood');

[uploadsDir, soloParentDir, childWelfareDir, aicsDir, livelihoodDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static uploads uniformly
app.use('/uploads', express.static(uploadsDir));

// Health check endpoints
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'Database connected!', time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection test failed:', err);
    res.status(500).json({ error: 'Database Error', details: err.message });
  }
});

// API Routes
app.use('/api/aics', aicsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/solo-parent', soloParentRoutes);
app.use('/api/child-welfare', childWelfareRoutes);
app.use('/api/financial-aid', financialAidRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/livelihood', livelihoodRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/pwd-senior', pwdSeniorRoutes);

// Optional: Serve frontend static build if running fullstack single-service mode
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
  // Run schema migration / table check on startup
  await initDb();

  // Run auto-release worker every 10 seconds in backend
  setInterval(async () => {
    await autoReleaseScheduledDisbursements();
  }, 10000);
});