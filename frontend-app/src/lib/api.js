// =========================================================================
// API Service Layer — MadrasahAI
// Base URL otomatis terdeteksi via expo-constants (ganti WiFi = otomatis).
// TIDAK ada hardcoded IP — IP diambil langsung dari hostUri Expo bundler.
// =========================================================================
import Constants from 'expo-constants';
import { NativeModules, Linking } from 'react-native';

const BACKEND_PORT = '3000';

function getApiBaseUrl() {
  // 1. Sumber paling andal: hostUri yang diisi Expo bundler saat `expo start`.
  //    Berisi IP LAN aktif laptop, berubah otomatis setiap ganti WiFi.
  let host = Constants.expoConfig?.hostUri?.split(':')[0];

  // 2. Fallback: experienceUrl (format exp://IP:PORT)
  if (!host && Constants.experienceUrl) {
    host = Constants.experienceUrl.replace('exp://', '').split(':')[0];
  }

  // 3. Fallback: scriptURL dari Metro bundler (tersedia di beberapa versi RN)
  if (!host && NativeModules.SourceCode?.scriptURL) {
    host = NativeModules.SourceCode.scriptURL.split('://')[1]?.split(':')[0];
  }

  if (host && host !== '127.0.0.1' && host !== 'localhost') {
    const url = `http://${host}:${BACKEND_PORT}/api`;
    console.log('[API] Base URL (auto-detected):', url);
    return url;
  }

  // 4. Tidak bisa mendeteksi host — log peringatan, kembalikan string kosong
  //    agar error fetch terlihat jelas di console daripada crash diam-diam.
  console.warn(
    '[API] PERINGATAN: Tidak dapat mendeteksi IP host dari Expo bundler.\n' +
    'Pastikan Expo dijalankan dalam mode LAN (bukan Tunnel) dan HP berada\n' +
    'di jaringan WiFi yang sama dengan laptop. Jalankan: expo start -c'
  );
  return `http://localhost:${BACKEND_PORT}/api`; // fallback aman, tidak akan berhasil di HP
}

export const API_URL = getApiBaseUrl();

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

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const json = await res.json();

    if (!res.ok) {
      const msg = json?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  } catch (err) {
    console.error(`[API] ${method} ${BASE_URL}${path} — FAILED:`, err.message);
    throw new Error(`Server tidak dapat dijangkau. Pastikan backend berjalan dan HP terhubung ke WiFi yang sama dengan laptop.`);
  }
}

// ---------------------------------------------------------------------------
// Download helper — untuk file binary (PDF / DOCX)
// Membuka URL di browser sistem karena React Native tidak bisa
// simpan file binary langsung tanpa expo-file-system.
// ---------------------------------------------------------------------------
export function openDownloadUrl(path) {
  const url = `${BASE_URL}${path}`;
  // Buka di browser bawaan HP — user bisa download dari sana
  return Linking.openURL(
    // Tambahkan token sebagai query param karena header tidak bisa dikirim dari Linking
    `${url}?token=${encodeURIComponent(_token || '')}`
  );
}

// =========================================================================
// AUTH
// =========================================================================
export async function loginAPI(email, password) {
  return request('POST', '/login', { email, password });
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

/**
 * Generate presentasi baru menggunakan AI.
 * @param {object} params
 * @param {string} params.topik
 * @param {number} params.jumlah_slide
 * @param {string} [params.tujuan]
 * @param {string} [params.audiens]
 * @param {boolean} [params.include_catatan]
 */
export async function generatePresentation(params) {
  return request('POST', '/presentation/generate', params);
}

/**
 * Ambil semua riwayat presentasi.
 */
export async function getAllPresentations() {
  return request('GET', '/presentation');
}

/**
 * Ambil presentasi berdasarkan ID.
 * @param {string} id
 */
export async function getPresentationById(id) {
  return request('GET', `/presentation/${id}`);
}

/**
 * Download presentasi sebagai PPT.
 * @param {string} id
 */
export function downloadPresentationPPT(id) {
  return openDownloadUrl(`/presentation/download/${id}/ppt`);
}
