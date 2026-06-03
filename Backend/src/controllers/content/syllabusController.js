const { v4: uuidv4 } = require('uuid');
const SyllabusModel = require('../../models/content/syllabusModel');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { generateSyllabusPDF } = require('../../utils/pdfGenerator');
const { generateSyllabusDocx } = require('../../utils/docxGenerator');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to map semester to valid semester_type enum in DB ('ganjil', 'genap')
const mapSemester = (semester) => {
    if (!semester) return 'ganjil';
    const normalized = semester.toLowerCase().trim();
    if (normalized.includes('ganjil') || normalized === '1' || normalized === 'satu') {
        return 'ganjil';
    }
    if (normalized.includes('genap') || normalized === '2' || normalized === 'dua') {
        return 'genap';
    }
    return 'ganjil'; // fallback
};

// Helper to map kurikulum to valid curriculum_type enum in DB ('Merdeka', 'K13')
const mapKurikulum = (kurikulum) => {
    if (!kurikulum) return 'Merdeka';
    const normalized = kurikulum.toLowerCase().trim();
    if (normalized.includes('k13') || normalized.includes('k-13') || normalized.includes('2013') || normalized.includes('13')) {
        return 'K13';
    }
    if (normalized.includes('merdeka') || normalized.includes('mandiri')) {
        return 'Merdeka';
    }
    if (normalized === 'k13') return 'K13';
    if (normalized === 'merdeka') return 'Merdeka';
    return 'Merdeka'; // fallback
};

// Helper to map jenjang to valid school_level enum in DB ('MI', 'MTs', 'MA')
const mapJenjang = (jenjang) => {
    if (!jenjang) return 'MI';
    const normalized = jenjang.toLowerCase().trim();
    if (normalized.includes('mi') || normalized.includes('sd') || normalized.includes('ibtidaiyah')) {
        return 'MI';
    }
    if (normalized.includes('mts') || normalized.includes('smp') || normalized.includes('tsanawiyah')) {
        return 'MTs';
    }
    if (normalized.includes('ma') || normalized.includes('sma') || normalized.includes('smk') || normalized.includes('aliyah')) {
        return 'MA';
    }
    if (normalized === 'mi') return 'MI';
    if (normalized === 'mts') return 'MTs';
    if (normalized === 'ma') return 'MA';
    return 'MI'; // fallback
};

const generateSyllabus = async (req, res) => {
    const requestId = uuidv4();
    const syllabusId = uuidv4();

    // ⏱️ MULAI HITUNG WAKTU PROSES (Stopwatch Start)
    const startTime = performance.now();
    const selectedModel = "llama-3.3-70b-versatile";

    try {
        const {
            mata_pelajaran, kurikulum, jenjang, tingkat_kelas, semester, tahun_ajaran
        } = req.body;

        // userId diambil dari JWT token
        const finalUserId = req.user.id;
        const mappedSemester = mapSemester(semester);
        const mappedKurikulum = mapKurikulum(kurikulum);
        const mappedJenjang = mapJenjang(jenjang);

        const inputDataForLog = {
            mata_pelajaran,
            kurikulum: mappedKurikulum,
            jenjang: mappedJenjang,
            tingkat_kelas,
            semester: mappedSemester,
            tahun_ajaran
        };

        // LANGKAH A: Tulis Log Request Awal (Pending)
        await SyllabusModel.createRequest(requestId, finalUserId, inputDataForLog, {
            llm_model_used: selectedModel
        });

        // LANGKAH B: Panggil Cek Kuota (FOR UPDATE)
        const quota = await SyllabusModel.getUserQuota(finalUserId);
        if (!quota) {
            return res.status(403).json({
                success: false,
                message: "Akses ditolak. Profil kuota tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        if (quota.used_this_month >= quota.monthly_limit) {
            const endTime = performance.now();
            await SyllabusModel.updateRequestStatus(requestId, 'failed', { 
                error_message: `Generate gagal! Kuota bulanan habis.`,
                processing_time_ms: Math.round(endTime - startTime)
            });
            return res.status(403).json({
                success: false,
                message: "Generate gagal! Kuota bulanan Anda telah habis.",
                data: null,
                meta: {}
            });
        }

        // LANGKAH C: Naikkan status ke processing
        await SyllabusModel.updateRequestStatus(requestId, 'processing');

        // 2. Panggil Groq AI Llama 3.3
        const prompt = `Anda adalah seorang ahli penyusun kurikulum sekolah (Madrasah). Buatlah rancangan silabus terstruktur untuk:
Mata Pelajaran: ${mata_pelajaran}
Jenjang: ${mappedJenjang}
Kelas: ${tingkat_kelas}
Semester: ${mappedSemester}
Kurikulum: ${mappedKurikulum}

Anda WAJIB memberikan respons dalam format JSON murni dengan struktur berikut:
{
    "judul_silabus": "Silabus ${mata_pelajaran} Kelas ${tingkat_kelas} Semester ${mappedSemester}",
    "kompetensi_inti": ["Daftar kompetensi inti..."],
    "tabel_silabus": [
        {
            "minggu_ke": 1,
            "kompetensi_dasar": "...",
            "materi_pokok": "...",
            "kegiatan_pembelajaran": "...",
            "penilaian": "...",
            "alokasi_waktu": "...",
            "sumber_belajar": "..."
        }
    ]
}
Sertakan minimal 4 minggu kegiatan pembelajaran.`;

        const systemPrompt = "Anda adalah seorang ahli penyusun kurikulum sekolah (Madrasah). Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun.";

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: selectedModel,
            response_format: { "type": "json_object" }
        });
        const aiResponseJSON = JSON.parse(chatCompletion.choices[0].message.content);

        // 3. Simpan ke Database
        const syllabusData = {
            id: syllabusId,
            request_id: requestId,
            mata_pelajaran,
            kurikulum: mappedKurikulum,
            jenjang: mappedJenjang,
            tingkat_kelas,
            semester: mappedSemester,
            tahun_ajaran,
            silabus_json: aiResponseJSON
        };

        const savedSyllabus = await SyllabusModel.saveSyllabusAndDeductQuota(syllabusData, finalUserId);

        // 4. Update Status Request
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        const tokenUsage = {
            prompt_tokens: chatCompletion.usage?.prompt_tokens || 0,
            completion_tokens: chatCompletion.usage?.completion_tokens || 0,
            total_tokens: chatCompletion.usage?.total_tokens || 0
        };

        await SyllabusModel.updateRequestStatus(requestId, 'completed', {
            output_data: savedSyllabus,
            prompt_used: `System: ${systemPrompt}\nUser: ${prompt}`,
            llm_model_used: selectedModel,
            token_usage: tokenUsage,
            processing_time_ms: processingTimeMs
        });

        const updatedQuota = await SyllabusModel.getUserQuota(finalUserId);

        res.status(201).json({
            success: true,
            message: "Silabus berhasil dibuat dengan Groq Llama 3.3.",
            request_id: requestId,
            status: "completed",
            data: savedSyllabus,
            meta: {
                quota_info: updatedQuota ? {
                    plan_type: updatedQuota.plan_type,
                    monthly_limit: updatedQuota.monthly_limit,
                    used_this_month: updatedQuota.used_this_month,
                    remaining_quota: updatedQuota.monthly_limit - updatedQuota.used_this_month
                } : {}
            }
        });

    } catch (error) {
        console.error("Error Detail:", error);
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        try {
            await SyllabusModel.updateRequestStatus(requestId, 'failed', { 
                error_message: error.message,
                processing_time_ms: processingTimeMs
            });
        } catch (dbErr) {
            console.error("Gagal update status fail ke DB");
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada proses AI atau Database",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

const getSyllabi = async (req, res) => {
    try {
        const data = await SyllabusModel.getAllSyllabi();
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data silabus.",
            data: data
        });
    } catch (error) {
        console.error("Error fetching syllabi:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data silabus dari server.",
            error: error.message
        });
    }
};

const downloadSyllabusPDF = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const syllabusData = await SyllabusModel.getSyllabusById(id);
        
        if (!syllabusData) {
            return res.status(404).json({
                success: false,
                message: "Silabus tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate PDF
        const fileName = `syllabus_${id}.pdf`;
        const filePath = path.join(tempDir, fileName);
        
        await generateSyllabusPDF(syllabusData, filePath);

        // Download file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
            }
            // Hapus file setelah download
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({
            success: false,
            message: "Gagal generate PDF",
            error: error.message
        });
    }
};

const downloadSyllabusDocx = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const syllabusData = await SyllabusModel.getSyllabusById(id);
        
        if (!syllabusData) {
            return res.status(404).json({
                success: false,
                message: "Silabus tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate DOCX
        const fileName = `syllabus_${id}.docx`;
        const filePath = path.join(tempDir, fileName);
        
        await generateSyllabusDocx(syllabusData, filePath);

        // Download file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
            }
            // Hapus file setelah download
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating DOCX:", error);
        res.status(500).json({
            success: false,
            message: "Gagal generate DOCX",
            error: error.message
        });
    }
};

const getSyllabusById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await SyllabusModel.getSyllabusById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Silabus tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil detail silabus.",
            data: data,
            meta: {}
        });
    } catch (error) {
        console.error("Error fetching syllabus by id:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dari server.",
            error: error.message
        });
    }
};

const updateSyllabus = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await SyllabusModel.getSyllabusById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Silabus tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        const updated = await SyllabusModel.updateSyllabus(id, req.body);

        res.status(200).json({
            success: true,
            message: "Silabus berhasil diperbarui.",
            data: updated,
            meta: {}
        });
    } catch (error) {
        console.error("Error updating syllabus:", error);
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui silabus.",
            error: error.message
        });
    }
};

const deleteSyllabus = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await SyllabusModel.deleteSyllabus(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Silabus tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Silabus berhasil dihapus.",
            data: { id: deleted.id },
            meta: {}
        });
    } catch (error) {
        console.error("Error deleting syllabus:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus silabus.",
            error: error.message
        });
    }
};

module.exports = { generateSyllabus, getSyllabi, getSyllabusById, updateSyllabus, deleteSyllabus, downloadSyllabusPDF, downloadSyllabusDocx };
