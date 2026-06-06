// =========================================================================
// API Service Layer — MadrasahAI
// Base URL: http://192.168.137.80:3000/api  (sesuaikan IP jika berubah)
// =========================================================================

export const API_URL = 'http://192.168.100.38:3000/api';

const BASE_URL = API_URL;

// ---------------------------------------------------------------------------
// Auth helper — untuk sekarang token disimpan di-memory via AuthContext.
// Jika nanti pakai AsyncStorage, ganti getToken() di sini.
// ---------------------------------------------------------------------------
let _token = null;

export function setAuthToken(token) {
    _token = token;
}

export function clearAuthToken() {
    _token = null;
}

function authHeaders(extra = {}) {
    return {
        'Content-Type': 'application/json',
        ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
        ...extra,
    };
}

// ---------------------------------------------------------------------------
// Generic request helper — untuk JSON response
// ---------------------------------------------------------------------------
async function request(method, path, body = null, isFormData = false) {
    const headers = isFormData
        ? (_token ? { Authorization: `Bearer ${_token}` } : {})
        : authHeaders();

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    console.log('URL:', `${BASE_URL}${path}`);
    console.log('STATUS:', res.status);
    const text = await res.text();

    console.log('RESPONSE:', text);

    const json = JSON.parse(text);


    if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return json;
}

// ---------------------------------------------------------------------------
// Download helper — untuk file binary (PDF / DOCX)
// Membuka URL di browser sistem karena React Native tidak bisa
// simpan file binary langsung tanpa expo-file-system.
// ---------------------------------------------------------------------------
export function openDownloadUrl(path) {
    const url = `${BASE_URL}${path}`;
    // Buka di browser bawaan HP — user bisa download dari sana
    const { Linking } = require('react-native');
    return Linking.openURL(
        // Tambahkan token sebagai query param karena header tidak bisa dikirim dari Linking
        `${url}?token=${encodeURIComponent(_token || '')}`
    );
}

// =========================================================================
// AUTH
// =========================================================================
export async function loginAPI(email, password) {
    return request('POST', '/auth/login', {
        email,
        password,
    });
}

// =========================================================================
// WRITING FEEDBACK
// =========================================================================

/**
 * Generate AI writing feedback.
 * @param {object} params
 * @param {string} params.tulisan_siswa  — teks karangan (wajib jika tidak ada PDF)
 * @param {string} params.jenis_tulisan  — e.g. "narasi", "deskripsi"
 * @param {string} params.tingkat_kelas  — "VII" … "XII" atau "7" … "12"
 * @param {string} [params.fokus_feedback] — aspek yang difokuskan (opsional)
 * @param {string} [params.nama_siswa]   — nama siswa (opsional)
 * @param {string} [params.bahasa_output] — default "Indonesia"
 * @param {string} [params.userId]       — UUID user
 */
export async function generateWritingFeedback(params) {
    return request('POST', '/generate/writing-feedback', params);
}

/**
 * Get all writing feedback history.
 */
export async function getAllWritingFeedback() {
    return request('GET', '/feedback');
}

/**
 * Get writing feedback by ID.
 * @param {string} id
 */
export async function getWritingFeedbackById(id) {
    return request('GET', `/feedback/${id}`);
}

/**
 * Update writing feedback.
 * @param {string} id
 * @param {{ skor_total: number, aspek: array, ringkasan: string }} payload
 */
export async function updateWritingFeedback(id, payload) {
    return request('PUT', `/feedback/edit/${id}`, payload);
}

/**
 * Delete writing feedback by ID.
 * @param {string} id
 */
export async function deleteWritingFeedback(id) {
    return request('DELETE', `/feedback/delete/${id}`);
}

/**
 * Get WhatsApp-ready share text for a feedback entry.
 * @param {string} id
 */
export async function getWritingShareText(id) {
    return request('GET', `/feedback/share/${id}`);
}

// =========================================================================
// SYLLABUS
// =========================================================================

/**
 * Generate silabus baru menggunakan AI.
 * @param {object} params
 * @param {string} params.mata_pelajaran   — nama mata pelajaran (wajib)
 * @param {string} params.kurikulum        — "Merdeka Belajar" | "Kurikulum 2013"
 * @param {string} params.jenjang          — "MI" | "MTs" | "MA"
 * @param {string} params.tingkat_kelas    — misal "VII", "X"
 * @param {string} params.semester         — "Ganjil" | "Genap"
 * @param {string} params.tahun_ajaran     — misal "2024/2025"
 * @param {string} [params.userId]         — UUID user
 */
export async function generateSyllabus(params) {
    return request('POST', '/syllabus/generate', params);
}

/**
 * Ambil semua riwayat silabus.
 */
export async function getAllSyllabi() {
    return request('GET', '/syllabus');
}

/**
 * Download silabus sebagai PDF — membuka browser untuk download.
 * @param {string} id — UUID silabus
 */
export function downloadSyllabusPDF(id) {
    return openDownloadUrl(`/syllabus/download/${id}/pdf`);
}

/**
 * Download silabus sebagai DOCX — membuka browser untuk download.
 * @param {string} id — UUID silabus
 */
export function downloadSyllabusDocx(id) {
    return openDownloadUrl(`/syllabus/download/${id}/docx`);
}

// =========================================================================
// ACADEMIC CONTENT
// =========================================================================

/**
 * Generate konten akademik menggunakan AI.
 * @param {object} params
 * @param {string} params.jenis_konten   — "Materi Pembelajaran" | "Ringkasan" | "Contoh Soal" | "Kamus Istilah" | "Artikel"
 * @param {string} params.topik          — topik konten (wajib)
 * @param {string} [params.mapel]        — mata pelajaran (opsional)
 * @param {string} [params.kelas]        — tingkat kelas (opsional)
 * @param {string} [params.panjang]      — "singkat" | "sedang" | "panjang"
 */
export async function generateAcademicContent(params) {
    return request('POST', '/academic-content/generate', params);
}

/**
 * Ambil semua riwayat konten akademik.
 */
export async function getAllAcademicContents() {
    return request('GET', '/academic-content');
}

export function downloadPresentationPPT(id) {
  return openDownloadUrl(`/presentation/download/${id}/ppt`);
}

export function downloadUnitPlanDocx(id) {
  return openDownloadUrl(`/unit-plan/download/${id}/docx`);
}

/**
 * Ambil konten akademik berdasarkan ID.
 * @param {string} id
 */
export async function getAcademicContentById(id) {
    return request('GET', `/academic-content/${id}`);
}

/**
 * Download konten akademik sebagai PDF — membuka browser untuk download.
 * @param {string} id
 */
export function downloadAcademicContentPDF(id) {
    return openDownloadUrl(`/academic-content/download/${id}/pdf`);
}

// =========================================================================
// PRESENTATION
// =========================================================================

export async function generatePresentation(params) {
    return request('POST', '/presentation/generate', params);
}

export async function getAllPresentations() {
    return request('GET', '/presentation');
}

// =========================================================================
// UNIT PLAN / RPP
// =========================================================================

export async function generateUnitPlan(params) {
    return request('POST', '/unit-plan/generate', params);
}

export async function getAllUnitPlans() {
    return request('GET', '/unit-plan');
}