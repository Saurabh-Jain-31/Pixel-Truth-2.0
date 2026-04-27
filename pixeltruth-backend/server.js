require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes    = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const aiRoutes      = require('./routes/aiRoutes');
const youtubeRoutes    = require('./routes/youtubeRoutes');
const instagramRoutes  = require('./routes/instagramRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: true, // allow all localhost origins during development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check (public, no auth) ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PixelTruth API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api',        contentRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/ai',     aiRoutes);
app.use('/api/youtube',   youtubeRoutes);
app.use('/api/instagram', instagramRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 PixelTruth API  →  http://localhost:${PORT}`);
  console.log(`📦 MongoDB URI     →  ${process.env.MONGO_URI}`);
  console.log(`🌐 CORS origin     →  ${process.env.CLIENT_URL}\n`);
});
