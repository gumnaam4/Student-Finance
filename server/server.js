// server/server.js
// Main Express application entry point

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const studentRoutes     = require('./routes/studentRoutes');
const depositRoutes     = require('./routes/depositRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const goalRoutes        = require('./routes/goalRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/students',     studentRoutes);
app.use('/api/deposits',     depositRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals',        goalRoutes);

// ── Root route — redirect to index ────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Student Finance Management System          ║');
  console.log('║   DBMS Academic Project                      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║   Server running at http://localhost:${PORT}    ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});