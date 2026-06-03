require('dotenv').config();
const pool = require('../config/db');

async function seedQuota() {
  try {
    console.log('Membuat kuota untuk semua user...');

    // Ambil semua user guru
    const { rows: users } = await pool.query(
      `SELECT id, email, role FROM users WHERE role = 'guru'`
    );

    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1); // tanggal 1 bulan depan

    for (const user of users) {
      await pool.query(`
        INSERT INTO usage_quotas (id, user_id, plan_type, monthly_limit, used_this_month, reset_date)
        VALUES (gen_random_uuid(), $1, 'free', 100, 0, $2)
        ON CONFLICT (user_id) DO NOTHING
      `, [user.id, resetDate.toISOString().split('T')[0]]);

      console.log(`   ✅ Kuota dibuat untuk ${user.email}`);
    }

    console.log('\n✅ Selesai! Semua guru sudah punya kuota 100/bulan.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedQuota();