/**
 * createQuotaTrigger.js
 * Buat trigger PostgreSQL supaya setiap user guru baru otomatis dapat usage_quotas.
 * Jalankan SEKALI: node src/scripts/createQuotaTrigger.js
 */

require('dotenv').config();
const pool = require('../config/db');

async function createTrigger() {
  try {
    console.log('🔧 Membuat trigger auto-kuota...');

    // Buat function trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION auto_create_quota()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.role IN ('guru', 'kepala_sekolah') THEN
          INSERT INTO usage_quotas (user_id, plan_type, monthly_limit, used_this_month, reset_date)
          VALUES (
            NEW.id,
            'free',
            100,
            0,
            DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
          )
          ON CONFLICT (user_id) DO NOTHING;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop trigger lama kalau ada
    await pool.query(`
      DROP TRIGGER IF EXISTS trg_auto_quota ON users;
    `);

    // Buat trigger baru
    await pool.query(`
      CREATE TRIGGER trg_auto_quota
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION auto_create_quota();
    `);

    console.log('✅ Trigger berhasil dibuat!');
    console.log('   Setiap guru baru akan otomatis mendapat 50 kuota/bulan (plan: free).');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTrigger();
