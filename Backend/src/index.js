require('dotenv').config();
const express = require('express');
const pool = require('./config/db');

// Assessment Routes 
const mcRoutes = require('./routes/assessment/mcRoutes');
const writingRoutes = require('./routes/assessment/writingRoutes');

// Content Routes 
const presentationRoutes = require('./routes/content/presentationRoutes');
const syllabusRoutes = require('./routes/content/syllabusRoutes');
const unitPlanRoutes = require('./routes/content/unitPlanRoutes');
const academicContentRoutes = require('./routes/content/academicContentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// --- ROUTES ---

//Assessment
app.use('/api', mcRoutes); // Semua route MC akan diawali dengan /api/generate-mc
app.use('/api', writingRoutes);
//Content
app.use('/api', presentationRoutes); // Route presentasi
app.use('/api/academic-content', academicContentRoutes); // Route academic content
app.use('/api/presentation', presentationRoutes); // Route presentasi
app.use('/api/syllabus', syllabusRoutes); // Route silabus
app.use('/api/unit-plan', unitPlanRoutes); // Route RPP / Modul Ajar


// Route Health Check (Hanya untuk testing awal)
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