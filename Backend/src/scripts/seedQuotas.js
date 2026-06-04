/**
 * seedQuotas.js
 * Insert usage_quotas untuk semua user guru yang belum punya kuota.
 * Jalankan: node src/scripts/seedQuotas.js
 */

require('dotenv').config();
const pool = require('../config/db');

async function seedQuotas() {
  try {
    console.log('🔄 Menyemai kuota untuk semua guru dan kepala sekolah...');

    // Insert kuota untuk semua user guru & kepala_sekolah yang belum punya entry di usage_quotas
    const result = await pool.query(`
      INSERT INTO usage_quotas (user_id, plan_type, monthly_limit, used_this_month, reset_date)
      SELECT 
        u.id,
        'free',
        100,
        0,
        DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
      FROM users u
      WHERE u.role IN ('guru', 'kepala_sekolah')
        AND NOT EXISTS (
          SELECT 1 FROM usage_quotas q WHERE q.user_id = u.id
        )
      RETURNING user_id, (SELECT role FROM users WHERE id = user_id) as role;
    `);

    if (result.rows.length === 0) {
      console.log('ℹ️  Semua user sudah memiliki kuota.');
    } else {
      console.log(`✅ Berhasil membuat kuota untuk ${result.rows.length} user:`);
      result.rows.forEach(r => console.log(`   - user_id: ${r.user_id}`));
    }

    // Tampilkan ringkasan
    const summary = await pool.query(`
      SELECT u.nama_lengkap, u.email, u.role, q.plan_type, q.monthly_limit, q.used_this_month, q.reset_date
      FROM users u
      JOIN usage_quotas q ON q.user_id = u.id
      WHERE u.role IN ('guru', 'kepala_sekolah')
      ORDER BY u.role, u.nama_lengkap;
    `);

    console.log('\n📊 Kuota User Saat Ini:');
    summary.rows.forEach(r => {
      console.log(`   👤 [${r.role}] ${r.nama_lengkap} (${r.email})`);
      console.log(`      Plan: ${r.plan_type} | Limit: ${r.monthly_limit} | Used: ${r.used_this_month} | Reset: ${r.reset_date}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedQuotas();
