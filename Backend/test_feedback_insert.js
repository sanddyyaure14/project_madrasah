/**
 * Test script untuk insert feedback
 * Jalankan dengan: node test_feedback_insert.js
 */

require('dotenv').config();
const db = require('./src/config/db');

async function testInsert() {
    try {
        console.log('\n========================================');
        console.log('TEST INSERT FEEDBACK');
        console.log('========================================\n');

        // Test data
        const requestId = 'cc309578-2cc8-407d-97aa-ea865b48049d'; // dari sample data yang sudah ada
        const userId = 'ac3b7e08-8c3c-4407-9e2d-15890b39c164'; // dari sample data yang sudah ada
        const rating = 4;
        const komentar = 'Test insert dari script';
        const isHelpful = true;

        console.log('Test data:', { requestId, userId, rating, komentar, isHelpful });

        // 1. Test dengan uuid_generate_v4() (sesuai default column)
        console.log('\n1. Testing dengan DEFAULT uuid...');
        const query1 = `
            INSERT INTO user_feedback (request_id, user_id, rating, komentar, is_helpful)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        try {
            const result1 = await db.query(query1, [
                'aaaaaaaa-bbbb-cccc-dddd-111111111111', // request_id baru
                userId, 
                rating, 
                komentar, 
                isHelpful
            ]);
            console.log('✓ INSERT dengan DEFAULT berhasil!');
            console.log('Result:', result1.rows[0]);

            // Cleanup
            await db.query('DELETE FROM user_feedback WHERE id = $1', [result1.rows[0].id]);
            console.log('✓ Cleanup berhasil');
        } catch (err) {
            console.log('❌ INSERT dengan DEFAULT gagal:', err.message);
        }

        // 2. Test dengan gen_random_uuid()
        console.log('\n2. Testing dengan gen_random_uuid()...');
        const query2 = `
            INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        try {
            const result2 = await db.query(query2, [
                'bbbbbbbb-cccc-dddd-eeee-222222222222', // request_id baru
                userId, 
                rating, 
                komentar, 
                isHelpful
            ]);
            console.log('✓ INSERT dengan gen_random_uuid() berhasil!');
            console.log('Result:', result2.rows[0]);

            // Cleanup
            await db.query('DELETE FROM user_feedback WHERE id = $1', [result2.rows[0].id]);
            console.log('✓ Cleanup berhasil');
        } catch (err) {
            console.log('❌ INSERT dengan gen_random_uuid() gagal:', err.message);
        }

        // 3. Test dengan uuid_generate_v4()
        console.log('\n3. Testing dengan uuid_generate_v4()...');
        const query3 = `
            INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        try {
            const result3 = await db.query(query3, [
                'cccccccc-dddd-eeee-ffff-333333333333', // request_id baru
                userId, 
                rating, 
                komentar, 
                isHelpful
            ]);
            console.log('✓ INSERT dengan uuid_generate_v4() berhasil!');
            console.log('Result:', result3.rows[0]);

            // Cleanup
            await db.query('DELETE FROM user_feedback WHERE id = $1', [result3.rows[0].id]);
            console.log('✓ Cleanup berhasil');
        } catch (err) {
            console.log('❌ INSERT dengan uuid_generate_v4() gagal:', err.message);
        }

        console.log('\n========================================');
        console.log('TEST COMPLETED!');
        console.log('========================================\n');

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        console.error('Detail:', err);
    } finally {
        process.exit(0);
    }
}

testInsert();
