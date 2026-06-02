// =========================================================================
// API Service Layer — MadrasahAI
// Base URL: http://192.168.0.104:3000/api  (sesuaikan IP jika berubah)
// =========================================================================

const BASE_URL = 'http://10.0.2.2:3000/api';

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
    ...(  _token ? { Authorization: `Bearer ${_token}` } : {}),
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------
async function request(method, path, body = null, isFormData = false) {
  const headers = isFormData
    ? (_token ? { Authorization: `Bearer ${_token}` } : {})
    : authHeaders();

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json();

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
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
