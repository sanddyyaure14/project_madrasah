/**
 * Script untuk mengecek struktur tabel user_feedback yang sudah ada
 * Jalankan dengan: node check_feedback_table.js
 */

require('dotenv').config();
const db = require('./src/config/db');

async function checkFeedbackTable() {
    console.log('\n========================================');
    console.log('CHECKING user_feedback TABLE');
    console.log('========================================\n');

    try {
        // 1. Cek apakah tabel exists
        const tableExistsQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_feedback'
            );
        `;
        const tableExists = await db.query(tableExistsQuery);
        console.log('✓ Tabel user_feedback exists:', tableExists.rows[0].exists);

        if (!tableExists.rows[0].exists) {
            console.log('\n❌ Tabel user_feedback TIDAK DITEMUKAN!');
            console.log('   Mungkin nama tabelnya berbeda. Cek tabel yang ada:');
            
            const allTablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%feedback%'
                ORDER BY table_name;
            `;
            const allTables = await db.query(allTablesQuery);
            console.log('   Tabel dengan kata "feedback":', allTables.rows);
            process.exit(0);
        }

        // 2. Cek struktur kolom
        const columnsQuery = `
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'user_feedback'
            ORDER BY ordinal_position;
        `;
        const columns = await db.query(columnsQuery);
        console.log('\n✓ Struktur Kolom:');
        console.table(columns.rows);

        // 3. Cek constraints (UNIQUE, PRIMARY KEY, FOREIGN KEY)
        const constraintsQuery = `
            SELECT
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'user_feedback'
            ORDER BY tc.constraint_type, tc.constraint_name;
        `;
        const constraints = await db.query(constraintsQuery);
        console.log('\n✓ Constraints:');
        console.table(constraints.rows);

        // 4. Cek indexes
        const indexesQuery = `
            SELECT
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'user_feedback';
        `;
        const indexes = await db.query(indexesQuery);
        console.log('\n✓ Indexes:');
        console.table(indexes.rows);

        // 5. Cek jumlah data yang sudah ada
        const countQuery = `SELECT COUNT(*) as total FROM user_feedback`;
        const count = await db.query(countQuery);
        console.log('\n✓ Jumlah data feedback yang sudah ada:', count.rows[0].total);

        // 6. Sample data (jika ada)
        if (parseInt(count.rows[0].total) > 0) {
            const sampleQuery = `SELECT * FROM user_feedback LIMIT 3`;
            const sample = await db.query(sampleQuery);
            console.log('\n✓ Sample Data (3 baris pertama):');
            console.table(sample.rows);
        }

        console.log('\n========================================');
        console.log('CHECK COMPLETED!');
        console.log('========================================\n');

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        console.error('Detail:', err);
    } finally {
        process.exit(0);
    }
}

checkFeedbackTable();
