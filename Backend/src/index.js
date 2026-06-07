require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');

// Assessment Routes 
const mcRoutes = require('./routes/assessment/mcRoutes');
const writingRoutes = require('./routes/assessment/writingRoutes');
const rubicRoutes = require('./routes/assessment/rubicRoutes');
const worksheetRoutes = require('./routes/assessment/worksheetRoutes');

// Content Routes 
const presentationRoutes = require('./routes/content/presentationRoutes');
const syllabusRoutes = require('./routes/content/syllabusRoutes');
const unitPlanRoutes = require('./routes/content/unitPlanRoutes');
const academicContentRoutes = require('./routes/content/academicContentRoutes');

// Dashboard / Kepsek Routes
const kepsekRoutes = require('./routes/dashboard/kepsek/kepsekRoutes');

// Guru Routes (Profile, Dashboard, Dokumen Saya)
const guruRoutes = require('./routes/dashboard/guru/guruRoutes');

// Feedback Routes (Rating + Komentar hasil generate)
const feedbackRoutes = require('./routes/feedbackRoutes');

// Error Handlers
const contentErrorHandler = require('./middlewares/content/contentErrorHandler');

// Scheduler: auto-reset kuota bulanan
require('./scheduler');

// INISIALISASI APP & PORT
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// --- ROUTES ---

// Auth / Registrasi & Login (tidak perlu token)
app.use('/api', authRoutes);

// Kepsek / Dashboard Route (dilindungi verifyToken + authorizeRoles di dalam routenya)
app.use('/api', kepsekRoutes);

// Guru Route (Profile, Dashboard, Dokumen Saya — dilindungi verifyToken + authorizeRoles)
app.use('/api', guruRoutes);

// Feedback Route (Rating + Komentar — dilindungi verifyToken)
app.use('/api', feedbackRoutes);

// Assessment (dilindungi verifyToken + authorizeRoles di dalam routenya)
app.use('/api', mcRoutes);
app.use('/api', writingRoutes);
app.use('/api', rubicRoutes);
app.use('/api/worksheet', worksheetRoutes);

// Content (dilindungi verifyToken + authorizeRoles di dalam routenya)
app.use('/api/presentation', presentationRoutes);
app.use('/api/academic-content', academicContentRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/unit-plan', unitPlanRoutes);

// Error Handling Middlewares (Wajib di bawah semua routes)
app.use(contentErrorHandler);

// Route Health Check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: "OK", serverTime: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: "ERROR", message: error.message });
  }
});

// --- DATABASE CONNECTION & SERVER START ---
pool.query('SELECT NOW()')
  .then((res) => {
    console.log('Database Terhubung! Jam Server DB:', res.rows[0].now);
    app.listen(PORT, () => {
      console.log(`Server berjalan di: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Gagal terhubung ke Database:', err.message);
    process.exit(1);
  });
