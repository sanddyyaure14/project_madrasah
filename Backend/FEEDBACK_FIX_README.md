# Fix Feedback Feature - TANPA UBAH DATABASE

## Masalah yang Ditemukan

1. ❌ Query menggunakan `ON CONFLICT (request_id)` tapi tabel tidak punya UNIQUE constraint pada `request_id`
2. ❌ Query menggunakan `gen_random_uuid()` padahal tabel default-nya `uuid_generate_v4()`
3. ❌ Tidak ada validasi apakah `request_id` valid (ada foreign key constraint)

## Solusi (TANPA mengubah database)

### ✅ Yang Sudah Diperbaiki

1. **Ganti `ON CONFLICT` dengan check manual**
   - Check dulu apakah feedback sudah ada
   - Jika ada: UPDATE
   - Jika belum: INSERT

2. **Hapus explicit UUID generation**
   - Biarkan database yang generate ID pakai default `uuid_generate_v4()`
   - Tidak perlu specify `id` saat INSERT

3. **Tambah validasi request_id**
   - Validasi `request_id` ada di `generation_requests`
   - Validasi request milik user yang login
   - Validasi status request = 'completed'

4. **Tambah logging detail**
   - Log semua operation (validate, check, insert, update)
   - Log error dengan detail (message, code, constraint)

### 📁 File yang Diubah

- `Backend/src/routes/feedbackRoutes.js`
  - Route: `POST /api/feedback/unit-plan/:requestId`
  - Route: `POST /api/feedback/presentation/:requestId`

### 🔧 Helper Scripts (untuk debugging)

- `check_feedback_table.js` - Check struktur tabel dan sample data
- `test_feedback_insert.js` - Test insert feedback ke database

## Cara Test

### 1. Restart Backend

```bash
cd Backend
# Stop backend yang sedang running (Ctrl+C)
npm start
```

### 2. Test di Aplikasi

1. Generate RPP atau Presentasi baru
2. Buka dokumen dari halaman "Dokumen"
3. Scroll ke bawah untuk menemukan "Nilai Hasil Generate"
4. Pilih rating bintang (1-5)
5. Pilih "Ya/Tidak" untuk "Apakah hasil ini berguna?"
6. Klik "Kirim Penilaian"

### 3. Lihat Log Backend

**Log yang diharapkan jika berhasil:**

```
[FeedbackRoute] POST unit-plan feedback: { requestId: '...', userId: '...', rating: 5, ... }
[FeedbackRoute] Inserting new feedback
[FeedbackRoute] Feedback saved successfully: { id: '...', rating: 5, ... }
```

**Log jika update feedback yang sudah ada:**

```
[FeedbackRoute] POST unit-plan feedback: { requestId: '...', userId: '...', rating: 4, ... }
[FeedbackRoute] Updating existing feedback
[FeedbackRoute] Feedback saved successfully: { id: '...', rating: 4, ... }
```

**Log jika request_id tidak valid:**

```
[FeedbackRoute] POST unit-plan feedback: { requestId: '...', userId: '...', rating: 5, ... }
[FeedbackRoute] Request not found or not completed
```

## Troubleshooting

### Frontend: "Tidak dapat terhubung ke server"

**Kemungkinan:**
1. Backend belum running
2. URL API salah di frontend

**Solusi:**
1. Pastikan backend running di `http://localhost:3000`
2. Check terminal backend, tidak ada error saat startup

### Backend: "Dokumen tidak ditemukan atau belum selesai diproses"

**Kemungkinan:**
1. `request_id` yang dikirim tidak ada di `generation_requests`
2. Status request bukan 'completed'
3. Request bukan milik user yang login

**Solusi:**
1. Check data dokumen, pastikan ada `request_id`
2. Check status di database: 
   ```sql
   SELECT id, status FROM generation_requests WHERE id = 'xxx';
   ```

### Backend: Foreign key constraint error

**Kemungkinan:**
`request_id` tidak ada di tabel `generation_requests`

**Solusi:**
Pastikan setiap dokumen (RPP/Presentation) yang di-generate memiliki record di `generation_requests` dengan status 'completed'

## Struktur Tabel (Reference)

```sql
-- Tabel user_feedback yang sudah ada (JANGAN DIUBAH)
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    komentar TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_feedback_gen_request 
        FOREIGN KEY (request_id) REFERENCES generation_requests(id),
    CONSTRAINT fk_feedback_user 
        FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Testing dengan Helper Scripts

### Check struktur tabel:

```bash
node check_feedback_table.js
```

### Test insert manual:

```bash
node test_feedback_insert.js
```

## Kesimpulan

✅ **TIDAK ADA perubahan database yang diperlukan**  
✅ Semua fix dilakukan di kode backend saja  
✅ Tabel `user_feedback` tetap sama seperti yang dibuat teman-temanmu  
✅ Tinggal restart backend dan test
