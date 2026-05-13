CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
--
-- PostgreSQL database dump
--

--\restrict ArWTuAwtJSUeOVfycj8BsuxASwjp3SLsJLJpt9A5M6XdYtxDX0ze0VeDrCf7Tov

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-13 22:55:56

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

--CREATE SCHEMA public;


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 948 (class 1247 OID 16920)
-- Name: academic_content_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.academic_content_type AS ENUM (
    'ringkasan',
    'penjelasan',
    'contoh_soal',
    'kamus',
    'artikel'
);


--
-- TOC entry 951 (class 1247 OID 16932)
-- Name: content_length; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_length AS ENUM (
    'singkat',
    'sedang',
    'panjang'
);


--
-- TOC entry 891 (class 1247 OID 16595)
-- Name: curriculum_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.curriculum_type AS ENUM (
    'Merdeka',
    'K13'
);


--
-- TOC entry 915 (class 1247 OID 16744)
-- Name: difficulty_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.difficulty_level AS ENUM (
    'mudah',
    'sedang',
    'sulit'
);


--
-- TOC entry 900 (class 1247 OID 16642)
-- Name: feature_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feature_type AS ENUM (
    'multiple_choice',
    'rubric',
    'writing_feedback',
    'worksheet',
    'presentation',
    'syllabus',
    'unit_plan',
    'academic_content'
);


--
-- TOC entry 921 (class 1247 OID 16775)
-- Name: rating_scale; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rating_scale AS ENUM (
    '1-4',
    '1-10',
    '1-100'
);


--
-- TOC entry 903 (class 1247 OID 16660)
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


--
-- TOC entry 885 (class 1247 OID 16575)
-- Name: school_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.school_level AS ENUM (
    'MI',
    'MTs',
    'MA'
);


--
-- TOC entry 939 (class 1247 OID 16869)
-- Name: semester_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.semester_type AS ENUM (
    'ganjil',
    'genap'
);


--
-- TOC entry 957 (class 1247 OID 16959)
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_plan AS ENUM (
    'free',
    'basic',
    'premium'
);


--
-- TOC entry 879 (class 1247 OID 16538)
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'guru',
    'admin',
    'kepala_sekolah'
);


--
-- TOC entry 927 (class 1247 OID 16801)
-- Name: writing_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.writing_type AS ENUM (
    'narasi',
    'deskripsi',
    'eksposisi',
    'argumentasi'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 16939)
-- Name: academic_contents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_contents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    jenis_konten public.academic_content_type NOT NULL,
    topik text NOT NULL,
    mata_pelajaran character varying(100),
    tingkat_kelas character varying(20),
    panjang_konten public.content_length,
    content_json jsonb
);


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.id IS 'Content ID';


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.jenis_konten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.jenis_konten IS 'ringkasan | penjelasan | contoh_soal | kamus | dll';


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.topik; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.topik IS 'Topik materi akademik';


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.mata_pelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.mata_pelajaran IS 'Mata Pelajaran';


--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.tingkat_kelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.tingkat_kelas IS 'Target kelas (VII, X, dll)';


--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.panjang_konten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.panjang_konten IS 'singkat | sedang | panjang';


--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 234
-- Name: COLUMN academic_contents.content_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.academic_contents.content_json IS 'Isi konten akademik lengkap (Format JSON)';


--
-- TOC entry 227 (class 1259 OID 16751)
-- Name: assessment_mc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_mc (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    mata_pelajaran character varying(100) NOT NULL,
    tingkat_kelas character varying(20) NOT NULL,
    topik text NOT NULL,
    jumlah_soal integer NOT NULL,
    tingkat_kesulitan public.difficulty_level NOT NULL,
    include_kunci boolean DEFAULT true,
    questions_json jsonb,
    kompetensi_dasar text
);


--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.id IS 'Assessment ID';


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.mata_pelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.mata_pelajaran IS 'Mapel (Matematika, IPA, dll)';


--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.tingkat_kelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.tingkat_kelas IS 'VII / VIII / X / dll';


--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.topik; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.topik IS 'Topik/materi soal';


--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.jumlah_soal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.jumlah_soal IS 'Jumlah soal yang diminta';


--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.tingkat_kesulitan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.tingkat_kesulitan IS 'mudah | sedang | sulit';


--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.include_kunci; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.include_kunci IS 'Sertakan kunci jawaban?';


--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.questions_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.questions_json IS 'Array soal + pilihan + jawaban';


--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN assessment_mc.kompetensi_dasar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_mc.kompetensi_dasar IS 'KD yang diujikan';


--
-- TOC entry 228 (class 1259 OID 16781)
-- Name: assessment_rubric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_rubric (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    jenis_tugas character varying(100) NOT NULL,
    aspek_penilaian text[] NOT NULL,
    skala_nilai public.rating_scale NOT NULL,
    rubric_json jsonb,
    tujuan_pembelajaran text
);


--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.id IS 'Rubric ID';


--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.jenis_tugas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.jenis_tugas IS 'Jenis tugas (Proyek, Makalah, dll)';


--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.aspek_penilaian; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.aspek_penilaian IS 'Array aspek yang dinilai';


--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.skala_nilai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.skala_nilai IS '1-4 | 1-10 | 1-100';


--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.rubric_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.rubric_json IS 'Tabel rubrik lengkap dalam format JSON';


--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN assessment_rubric.tujuan_pembelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_rubric.tujuan_pembelajaran IS 'TP yang dievaluasi';


--
-- TOC entry 225 (class 1259 OID 16690)
-- Name: folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    nama character varying(150) NOT NULL,
    warna character varying(10),
    parent_id uuid
);


--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN folders.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.folders.id IS 'Folder ID';


--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN folders.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.folders.user_id IS 'Pemilik folder';


--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN folders.nama; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.folders.nama IS 'Nama folder';


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN folders.warna; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.folders.warna IS 'Warna folder (hex format)';


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN folders.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.folders.parent_id IS 'ID folder induk (NULL jika folder utama)';


--
-- TOC entry 224 (class 1259 OID 16669)
-- Name: generation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generation_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    feature_type public.feature_type NOT NULL,
    input_data jsonb NOT NULL,
    prompt_used text,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    output_data jsonb,
    error_message text,
    processing_time_ms integer,
    llm_model_used character varying(100),
    token_usage jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN generation_requests.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.generation_requests.id IS 'Request ID';


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN generation_requests.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.generation_requests.user_id IS 'Guru yang melakukan request';


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN generation_requests.feature_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.generation_requests.feature_type IS 'Tipe fitur AI yang digunakan';


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN generation_requests.input_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.generation_requests.input_data IS 'Parameter input (JSON format)';


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN generation_requests.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.generation_requests.status IS 'Status: pending | processing | completed | failed';


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN generation_requests.token_usage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.generation_requests.token_usage IS 'Simpan jumlah token {prompt_tokens, completion_tokens}';


--
-- TOC entry 221 (class 1259 OID 16581)
-- Name: institutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nama character varying(200) NOT NULL,
    npsn character varying(20),
    jenis public.school_level NOT NULL,
    alamat text,
    kota character varying(100),
    provinsi character varying(100),
    logo_url text
);


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.id IS 'Institution ID';


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.nama; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.nama IS 'Nama madrasah';


--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.npsn; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.npsn IS 'Nomor Pokok Sekolah Nasional';


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.jenis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.jenis IS 'MI | MTs | MA';


--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.alamat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.alamat IS 'Alamat lengkap';


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.kota; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.kota IS 'Kota/Kabupaten';


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.provinsi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.provinsi IS 'Provinsi';


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN institutions.logo_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.institutions.logo_url IS 'Logo madrasah';


--
-- TOC entry 231 (class 1259 OID 16849)
-- Name: presentations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presentations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    topik text NOT NULL,
    jumlah_slide integer NOT NULL,
    tujuan text,
    audiens character varying(100),
    slides_json jsonb,
    include_catatan boolean DEFAULT false
);


--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.id IS 'Presentation ID';


--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.topik; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.topik IS 'Topik utama presentasi';


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.jumlah_slide; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.jumlah_slide IS 'Target jumlah slide yang diinginkan';


--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.tujuan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.tujuan IS 'Tujuan presentasi (misal: pengenalan materi)';


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.audiens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.audiens IS 'Target audiens (misal: Siswa Kelas X)';


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.slides_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.slides_json IS 'Konten tiap slide dalam format JSON';


--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 231
-- Name: COLUMN presentations.include_catatan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.presentations.include_catatan IS 'Apakah menyertakan catatan presenter?';


--
-- TOC entry 226 (class 1259 OID 16710)
-- Name: saved_outputs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_outputs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(300) NOT NULL,
    content jsonb NOT NULL,
    is_favorite boolean DEFAULT false,
    folder_id uuid,
    tags text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.id IS 'Output ID';


--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.user_id IS 'Pemilik (FK → users)';


--
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.title IS 'Judul simpan';


--
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.content IS 'Konten final (JSONB)';


--
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.is_favorite; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.is_favorite IS 'Ditandai favorit';


--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.folder_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.folder_id IS 'Folder penyimpanan (FK → folders)';


--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN saved_outputs.tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.saved_outputs.tags IS 'Tag untuk filter/search';


--
-- TOC entry 232 (class 1259 OID 16873)
-- Name: syllabi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.syllabi (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    mata_pelajaran character varying(100) NOT NULL,
    jenjang public.school_level NOT NULL,
    tingkat_kelas character varying(10) NOT NULL,
    kurikulum public.curriculum_type NOT NULL,
    semester public.semester_type NOT NULL,
    tahun_ajaran character varying(20) NOT NULL,
    silabus_json jsonb
);


--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.id IS 'Silabus ID';


--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.mata_pelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.mata_pelajaran IS 'Mata Pelajaran';


--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.jenjang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.jenjang IS 'MI | MTs | MA';


--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.tingkat_kelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.tingkat_kelas IS 'Kelas (contoh: VII, X, dll)';


--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.kurikulum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.kurikulum IS 'Merdeka | K13';


--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.semester; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.semester IS 'ganjil | genap';


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.tahun_ajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.tahun_ajaran IS 'Format: 2024/2025';


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN syllabi.silabus_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.syllabi.silabus_json IS 'Isi silabus lengkap per pertemuan dalam format JSON';


--
-- TOC entry 233 (class 1259 OID 16897)
-- Name: unit_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unit_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    judul_unit character varying(200) NOT NULL,
    mata_pelajaran character varying(100) NOT NULL,
    tingkat_kelas character varying(20) NOT NULL,
    jumlah_pertemuan integer NOT NULL,
    durasi_per_jp integer DEFAULT 40,
    tujuan_pembelajaran text,
    unit_plan_json jsonb
);


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.id IS 'Unit Plan ID';


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.judul_unit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.judul_unit IS 'Judul unit atau tema pembelajaran';


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.mata_pelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.mata_pelajaran IS 'Mata Pelajaran';


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.tingkat_kelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.tingkat_kelas IS 'Kelas (VII, X, dll)';


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.jumlah_pertemuan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.jumlah_pertemuan IS 'Total Jam Pelajaran (JP) yang direncanakan';


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.durasi_per_jp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.durasi_per_jp IS 'Durasi dalam menit per satu jam pelajaran';


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.tujuan_pembelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.tujuan_pembelajaran IS 'Tujuan Pembelajaran (TP) yang ingin dicapai';


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 233
-- Name: COLUMN unit_plans.unit_plan_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_plans.unit_plan_json IS 'Konten RPP/Modul ajar lengkap (Langkah pembelajaran, asesmen, dll)';


--
-- TOC entry 235 (class 1259 OID 16965)
-- Name: usage_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_quotas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    plan_type public.subscription_plan DEFAULT 'free'::public.subscription_plan NOT NULL,
    monthly_limit integer NOT NULL,
    used_this_month integer DEFAULT 0 NOT NULL,
    reset_date date NOT NULL
);


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN usage_quotas.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_quotas.id IS 'Quota ID';


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN usage_quotas.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_quotas.user_id IS 'Pemilik kuota (FK → users)';


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN usage_quotas.plan_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_quotas.plan_type IS 'free | basic | premium';


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN usage_quotas.monthly_limit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_quotas.monthly_limit IS 'Batas request per bulan';


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN usage_quotas.used_this_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_quotas.used_this_month IS 'Jumlah request yang sudah digunakan bulan ini';


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN usage_quotas.reset_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_quotas.reset_date IS 'Tanggal otomatis reset kuota ke nol';


--
-- TOC entry 236 (class 1259 OID 16987)
-- Name: user_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_feedback (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating smallint NOT NULL,
    komentar text,
    is_helpful boolean,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN user_feedback.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_feedback.id IS 'Feedback ID';


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN user_feedback.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_feedback.request_id IS 'Request yang dinilai (Konteks AI)';


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN user_feedback.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_feedback.user_id IS 'Pemberi feedback (Guru)';


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN user_feedback.rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_feedback.rating IS 'Rating bintang (1-5)';


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN user_feedback.komentar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_feedback.komentar IS 'Komentar bebas guru';


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN user_feedback.is_helpful; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_feedback.is_helpful IS 'Apakah output membantu tugas guru?';


--
-- TOC entry 222 (class 1259 OID 16599)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    nip character varying(30),
    mata_pelajaran text[],
    jenjang public.school_level,
    kurikulum public.curriculum_type,
    no_hp character varying(20),
    instansi_id uuid
);


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.id IS 'Profile ID';


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.user_id IS 'Relasi ke tabel users';


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.nip; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.nip IS 'Nomor Induk Pegawai';


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.mata_pelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.mata_pelajaran IS 'Array mapel yang diajar (e.g., {"Matematika", "Fisika"})';


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.jenjang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.jenjang IS 'MI | MTs | MA';


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.kurikulum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.kurikulum IS 'Merdeka | K13';


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.no_hp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.no_hp IS 'Nomor HP guru';


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN user_profiles.instansi_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.instansi_id IS 'Madrasah tempat mengajar';


--
-- TOC entry 223 (class 1259 OID 16621)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token text NOT NULL,
    ip_address inet,
    user_agent text,
    expires_at timestamp without time zone NOT NULL,
    is_revoked boolean DEFAULT false
);


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.id IS 'Session ID';


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.user_id IS 'Pemilik sesi (FK → users)';


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.refresh_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.refresh_token IS 'JWT refresh token';


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.ip_address IS 'IP login (INET support)';


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.user_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.user_agent IS 'Browser/device info';


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.expires_at IS 'Token kadaluarsa';


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN user_sessions.is_revoked; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_sessions.is_revoked IS 'Token dicabut? (Blacklist)';


--
-- TOC entry 220 (class 1259 OID 16556)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nama_lengkap character varying(150) NOT NULL,
    email character varying(200) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role NOT NULL,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_login_at timestamp without time zone
);


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.id IS 'Unique user identifier';


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.nama_lengkap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.nama_lengkap IS 'Nama lengkap guru';


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.email IS 'Email login';


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hashed password';


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.role IS 'guru | admin | kepala_sekolah';


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.avatar_url IS 'URL foto profil';


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.is_active IS 'Status akun aktif';


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.created_at IS 'Waktu registrasi';


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.last_login_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.last_login_at IS 'Login terakhir';


--
-- TOC entry 230 (class 1259 OID 16828)
-- Name: worksheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worksheets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    judul character varying(200) NOT NULL,
    mata_pelajaran character varying(100) NOT NULL,
    topik text NOT NULL,
    tipe_aktivitas text[] NOT NULL,
    durasi_menit integer,
    worksheet_json jsonb
);


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.id IS 'Worksheet ID';


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.judul; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.judul IS 'Judul LKS';


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.mata_pelajaran; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.mata_pelajaran IS 'Mata Pelajaran';


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.topik; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.topik IS 'Topik LKS';


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.tipe_aktivitas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.tipe_aktivitas IS 'isian | esai | praktik | observasi (Array)';


--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.durasi_menit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.durasi_menit IS 'Estimasi waktu pengerjaan (menit)';


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN worksheets.worksheet_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.worksheets.worksheet_json IS 'Konten LKS terstruktur dalam format JSON';


--
-- TOC entry 229 (class 1259 OID 16809)
-- Name: writing_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.writing_feedback (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    request_id uuid NOT NULL,
    tulisan_siswa text NOT NULL,
    jenis_tulisan public.writing_type NOT NULL,
    tingkat_kelas character varying(20) NOT NULL,
    fokus_feedback text[],
    feedback_json jsonb,
    skor_keseluruhan numeric(5,2)
);


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.id IS 'Feedback ID';


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.request_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.request_id IS 'Request asal (FK → generation_requests)';


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.tulisan_siswa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.tulisan_siswa IS 'Isi tulisan/karangan siswa yang dinilai';


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.jenis_tulisan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.jenis_tulisan IS 'narasi | deskripsi | eksposisi | argumentasi';


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.tingkat_kelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.tingkat_kelas IS 'Kelas siswa';


--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.fokus_feedback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.fokus_feedback IS 'Aspek fokus penilaian (array)';


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.feedback_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.feedback_json IS 'Hasil analisis detail dari AI';


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN writing_feedback.skor_keseluruhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.writing_feedback.skor_keseluruhan IS 'Nilai akhir siswa (presisi desimal)';


--
-- TOC entry 5240 (class 0 OID 16939)
-- Dependencies: 234
-- Data for Name: academic_contents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5233 (class 0 OID 16751)
-- Dependencies: 227
-- Data for Name: assessment_mc; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5234 (class 0 OID 16781)
-- Dependencies: 228
-- Data for Name: assessment_rubric; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5231 (class 0 OID 16690)
-- Dependencies: 225
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5230 (class 0 OID 16669)
-- Dependencies: 224
-- Data for Name: generation_requests; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5227 (class 0 OID 16581)
-- Dependencies: 221
-- Data for Name: institutions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5237 (class 0 OID 16849)
-- Dependencies: 231
-- Data for Name: presentations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5232 (class 0 OID 16710)
-- Dependencies: 226
-- Data for Name: saved_outputs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5238 (class 0 OID 16873)
-- Dependencies: 232
-- Data for Name: syllabi; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5239 (class 0 OID 16897)
-- Dependencies: 233
-- Data for Name: unit_plans; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5241 (class 0 OID 16965)
-- Dependencies: 235
-- Data for Name: usage_quotas; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5242 (class 0 OID 16987)
-- Dependencies: 236
-- Data for Name: user_feedback; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5228 (class 0 OID 16599)
-- Dependencies: 222
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5229 (class 0 OID 16621)
-- Dependencies: 223
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5226 (class 0 OID 16556)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5236 (class 0 OID 16828)
-- Dependencies: 230
-- Data for Name: worksheets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5235 (class 0 OID 16809)
-- Dependencies: 229
-- Data for Name: writing_feedback; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5048 (class 2606 OID 16950)
-- Name: academic_contents academic_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_contents
    ADD CONSTRAINT academic_contents_pkey PRIMARY KEY (id);


--
-- TOC entry 5023 (class 2606 OID 16766)
-- Name: assessment_mc assessment_mc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_mc
    ADD CONSTRAINT assessment_mc_pkey PRIMARY KEY (id);


--
-- TOC entry 5027 (class 2606 OID 16793)
-- Name: assessment_rubric assessment_rubric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_rubric
    ADD CONSTRAINT assessment_rubric_pkey PRIMARY KEY (id);


--
-- TOC entry 5016 (class 2606 OID 16698)
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 2606 OID 16684)
-- Name: generation_requests generation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_requests
    ADD CONSTRAINT generation_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 16593)
-- Name: institutions institutions_npsn_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_npsn_key UNIQUE (npsn);


--
-- TOC entry 5004 (class 2606 OID 16591)
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 16861)
-- Name: presentations presentations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT presentations_pkey PRIMARY KEY (id);


--
-- TOC entry 5021 (class 2606 OID 16725)
-- Name: saved_outputs saved_outputs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outputs
    ADD CONSTRAINT saved_outputs_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 16888)
-- Name: syllabi syllabi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.syllabi
    ADD CONSTRAINT syllabi_pkey PRIMARY KEY (id);


--
-- TOC entry 5046 (class 2606 OID 16911)
-- Name: unit_plans unit_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_plans
    ADD CONSTRAINT unit_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 5053 (class 2606 OID 16978)
-- Name: usage_quotas usage_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_quotas
    ADD CONSTRAINT usage_quotas_pkey PRIMARY KEY (id);


--
-- TOC entry 5055 (class 2606 OID 16980)
-- Name: usage_quotas usage_quotas_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_quotas
    ADD CONSTRAINT usage_quotas_user_id_key UNIQUE (user_id);


--
-- TOC entry 5058 (class 2606 OID 17001)
-- Name: user_feedback user_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 5006 (class 2606 OID 16610)
-- Name: user_profiles user_profiles_nip_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_nip_key UNIQUE (nip);


--
-- TOC entry 5008 (class 2606 OID 16608)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5010 (class 2606 OID 16633)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5012 (class 2606 OID 16635)
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 4998 (class 2606 OID 16573)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5000 (class 2606 OID 16571)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 16841)
-- Name: worksheets worksheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worksheets
    ADD CONSTRAINT worksheets_pkey PRIMARY KEY (id);


--
-- TOC entry 5031 (class 2606 OID 16821)
-- Name: writing_feedback writing_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writing_feedback
    ADD CONSTRAINT writing_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 5049 (class 1259 OID 16956)
-- Name: idx_academic_topik; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_topik ON public.academic_contents USING btree (topik);


--
-- TOC entry 5050 (class 1259 OID 16957)
-- Name: idx_academic_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_academic_type ON public.academic_contents USING btree (jenis_konten);


--
-- TOC entry 5056 (class 1259 OID 17012)
-- Name: idx_feedback_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_rating ON public.user_feedback USING btree (rating);


--
-- TOC entry 5029 (class 1259 OID 16827)
-- Name: idx_feedback_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_request_id ON public.writing_feedback USING btree (request_id);


--
-- TOC entry 5017 (class 1259 OID 16709)
-- Name: idx_folders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_folders_user ON public.folders USING btree (user_id);


--
-- TOC entry 5024 (class 1259 OID 16772)
-- Name: idx_mc_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mc_mapel ON public.assessment_mc USING btree (mata_pelajaran);


--
-- TOC entry 5025 (class 1259 OID 16773)
-- Name: idx_mc_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mc_request_id ON public.assessment_mc USING btree (request_id);


--
-- TOC entry 5036 (class 1259 OID 16867)
-- Name: idx_presentation_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presentation_request_id ON public.presentations USING btree (request_id);


--
-- TOC entry 5051 (class 1259 OID 16986)
-- Name: idx_quota_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quota_user_id ON public.usage_quotas USING btree (user_id);


--
-- TOC entry 5028 (class 1259 OID 16799)
-- Name: idx_rubric_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rubric_request_id ON public.assessment_rubric USING btree (request_id);


--
-- TOC entry 5018 (class 1259 OID 16742)
-- Name: idx_saved_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_folder_id ON public.saved_outputs USING btree (folder_id);


--
-- TOC entry 5019 (class 1259 OID 16741)
-- Name: idx_saved_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_user_id ON public.saved_outputs USING btree (user_id);


--
-- TOC entry 5039 (class 1259 OID 16894)
-- Name: idx_syllabi_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_syllabi_mapel ON public.syllabi USING btree (mata_pelajaran);


--
-- TOC entry 5040 (class 1259 OID 16895)
-- Name: idx_syllabi_tahun; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_syllabi_tahun ON public.syllabi USING btree (tahun_ajaran);


--
-- TOC entry 5043 (class 1259 OID 16917)
-- Name: idx_unit_plans_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unit_plans_mapel ON public.unit_plans USING btree (mata_pelajaran);


--
-- TOC entry 5044 (class 1259 OID 16918)
-- Name: idx_unit_plans_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unit_plans_request_id ON public.unit_plans USING btree (request_id);


--
-- TOC entry 5032 (class 1259 OID 16847)
-- Name: idx_worksheet_judul; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worksheet_judul ON public.worksheets USING btree (judul);


--
-- TOC entry 5033 (class 1259 OID 16848)
-- Name: idx_worksheet_mapel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worksheet_mapel ON public.worksheets USING btree (mata_pelajaran);


--
-- TOC entry 5075 (class 2606 OID 16951)
-- Name: academic_contents fk_academic_content_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_contents
    ADD CONSTRAINT fk_academic_content_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5077 (class 2606 OID 17002)
-- Name: user_feedback fk_feedback_gen_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT fk_feedback_gen_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5070 (class 2606 OID 16822)
-- Name: writing_feedback fk_feedback_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.writing_feedback
    ADD CONSTRAINT fk_feedback_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5078 (class 2606 OID 17007)
-- Name: user_feedback fk_feedback_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5063 (class 2606 OID 16704)
-- Name: folders fk_folder_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- TOC entry 5064 (class 2606 OID 16699)
-- Name: folders fk_folder_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT fk_folder_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5062 (class 2606 OID 16685)
-- Name: generation_requests fk_gen_request_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generation_requests
    ADD CONSTRAINT fk_gen_request_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5068 (class 2606 OID 16767)
-- Name: assessment_mc fk_mc_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_mc
    ADD CONSTRAINT fk_mc_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5072 (class 2606 OID 16862)
-- Name: presentations fk_presentation_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presentations
    ADD CONSTRAINT fk_presentation_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5076 (class 2606 OID 16981)
-- Name: usage_quotas fk_quota_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_quotas
    ADD CONSTRAINT fk_quota_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5069 (class 2606 OID 16794)
-- Name: assessment_rubric fk_rubric_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_rubric
    ADD CONSTRAINT fk_rubric_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5065 (class 2606 OID 16736)
-- Name: saved_outputs fk_saved_folder; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outputs
    ADD CONSTRAINT fk_saved_folder FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- TOC entry 5066 (class 2606 OID 16726)
-- Name: saved_outputs fk_saved_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outputs
    ADD CONSTRAINT fk_saved_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5067 (class 2606 OID 16731)
-- Name: saved_outputs fk_saved_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_outputs
    ADD CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5061 (class 2606 OID 16636)
-- Name: user_sessions fk_session_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5073 (class 2606 OID 16889)
-- Name: syllabi fk_syllabus_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.syllabi
    ADD CONSTRAINT fk_syllabus_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5074 (class 2606 OID 16912)
-- Name: unit_plans fk_unit_plan_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_plans
    ADD CONSTRAINT fk_unit_plan_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5059 (class 2606 OID 16616)
-- Name: user_profiles fk_user_profile_institution; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fk_user_profile_institution FOREIGN KEY (instansi_id) REFERENCES public.institutions(id) ON DELETE SET NULL;


--
-- TOC entry 5060 (class 2606 OID 16611)
-- Name: user_profiles fk_user_profile_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5071 (class 2606 OID 16842)
-- Name: worksheets fk_worksheet_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worksheets
    ADD CONSTRAINT fk_worksheet_request FOREIGN KEY (request_id) REFERENCES public.generation_requests(id) ON DELETE CASCADE;


-- Completed on 2026-05-13 22:55:56

--
-- PostgreSQL database dump complete
--

--\unrestrict ArWTuAwtJSUeOVfycj8BsuxASwjp3SLsJLJpt9A5M6XdYtxDX0ze0VeDrCf7Tov

