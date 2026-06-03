require('dotenv').config();
const pool = require('../config/db');
const Groq = require('groq-sdk');

async function test() {
  try {
    // 1. Cek users & quotas
    const users = await pool.query('SELECT id, nama_lengkap, email, role FROM users WHERE role = $1', ['guru']);
    console.log('\n👥 GURU di DB:');
    users.rows.forEach(u => console.log(`   ${u.nama_lengkap} | ${u.email} | id: ${u.id}`));

    const quotas = await pool.query('SELECT user_id, plan_type, monthly_limit, used_this_month FROM usage_quotas');
    console.log('\n📊 QUOTAS di DB:');
    quotas.rows.forEach(q => console.log(`   user_id: ${q.user_id} | ${q.plan_type} | ${q.monthly_limit} | used: ${q.used_this_month}`));

    // 2. Cek GROQ_API_KEY
    const apiKey = process.env.GROQ_API_KEY;
    console.log('\n🔑 GROQ_API_KEY:', apiKey ? `ada (${apiKey.substring(0, 10)}...)` : '❌ TIDAK ADA!');

    // 3. Test Groq connection
    if (apiKey) {
      console.log('\n🤖 Testing Groq API...');
      const groq = new Groq({ apiKey });
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'Say "OK" in JSON: {"status":"OK"}' }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        max_tokens: 20,
      });
      console.log('   ✅ Groq OK:', res.choices[0].message.content);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    process.exit(1);
  }
}

test();
