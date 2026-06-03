-- Jalankan script ini di pgAdmin jika tabel worksheets belum ada
-- Database: madrasah

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.worksheets (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    judul character varying(200) NOT NULL,
    mata_pelajaran character varying(100) NOT NULL,
    topik text NOT NULL,
    tipe_aktivitas text[] NOT NULL,
    durasi_menit integer,
    worksheet_json jsonb,
    CONSTRAINT worksheets_pkey PRIMARY KEY (id),
    CONSTRAINT worksheets_request_id_fkey FOREIGN KEY (request_id)
        REFERENCES public.generation_requests(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_worksheets_request_id ON public.worksheets(request_id);

-- Verifikasi
SELECT 'Tabel worksheets berhasil dibuat atau sudah ada.' AS status;
