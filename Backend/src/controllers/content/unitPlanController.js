const { v4: uuidv4 } = require('uuid');
const UnitPlanModel = require('../../models/content/unitPlanModel');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { generateUnitPlanDocx } = require('../../utils/docxGenerator');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateUnitPlan = async (req, res) => {
    const requestId = uuidv4();
    const unitPlanId = uuidv4();

    // ⏱️ MULAI HITUNG WAKTU PROSES (Stopwatch Start)
    const startTime = performance.now();
    const selectedModel = "llama-3.3-70b-versatile";

    try {
        const {
            judul_unit, mata_pelajaran, tingkat_kelas, tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp
        } = req.body;

        // userId diambil dari JWT token
        const finalUserId = req.user.id;
        const isKepsek = req.user.role === 'kepala_sekolah';

        const inputDataForLog = {
            judul_unit, mata_pelajaran, tingkat_kelas, tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp
        };

        // LANGKAH A: Tulis Log Request Awal (Pending)
        await UnitPlanModel.createRequest(requestId, finalUserId, inputDataForLog, {
            llm_model_used: selectedModel
        });

        // LANGKAH B: Panggil Cek Kuota — skip untuk kepala_sekolah (unlimited)
        if (!isKepsek) {
            const quota = await UnitPlanModel.getUserQuota(finalUserId);
            if (!quota) {
                return res.status(403).json({ success: false, message: "Akses ditolak. Profil kuota tidak ditemukan.", data: null, meta: {} });
            }
            if (quota.used_this_month >= quota.monthly_limit) {
                const endTime = performance.now();
                await UnitPlanModel.updateRequestStatus(requestId, 'failed', { error_message: `Generate gagal! Kuota bulanan habis.`, processing_time_ms: Math.round(endTime - startTime) });
                return res.status(403).json({ success: false, message: "Generate gagal! Kuota bulanan Anda telah habis.", data: null, meta: {} });
            }
        }

        // LANGKAH C: Naikkan status ke processing
        await UnitPlanModel.updateRequestStatus(requestId, 'processing');

        // 2. Panggil Groq AI Llama 3.3
        const prompt = `Anda adalah seorang ahli penyusun Modul Ajar / RPP Kurikulum Merdeka (Madrasah). Buatlah rancangan Modul Ajar untuk:
Mata Pelajaran: ${mata_pelajaran}
Judul Materi/Unit: ${judul_unit}
Kelas: ${tingkat_kelas}
Tujuan Pembelajaran: ${tujuan_pembelajaran || 'Tentukan tujuan yang sesuai dengan materi'}
Jumlah Pertemuan: ${jumlah_pertemuan || 2}
Durasi per JP: ${durasi_per_jp || 40} menit

Anda WAJIB memberikan respons dalam format JSON murni dengan struktur berikut:
{
    "informasi_umum": {
        "mata_pelajaran": "${mata_pelajaran}",
        "judul_unit": "${judul_unit}",
        "kelas": "${tingkat_kelas}",
        "alokasi_waktu": "${jumlah_pertemuan || 2} Pertemuan",
        "kompetensi_awal": ["..."],
        "profil_pelajar_pancasila": ["..."],
        "sarana_prasarana": ["..."],
        "target_peserta_didik": "..."
    },
    "komponen_inti": {
        "tujuan_pembelajaran": ["..."],
        "pemahaman_bermakna": "...",
        "pertanyaan_pemantik": ["..."],
        "kegiatan_pembelajaran": [
            {
                "pertemuan_ke": 1,
                "pendahuluan": ["..."],
                "kegiatan_inti": ["..."],
                "penutup": ["..."]
            }
        ],
        "asesmen": ["..."],
        "pengayaan_dan_remedial": ["..."]
    }
}`;

        const systemPrompt = "Anda adalah seorang ahli penyusun Modul Ajar / RPP Kurikulum Merdeka (Madrasah). Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun.";

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
        const unitPlanData = {
            id: unitPlanId,
            request_id: requestId,
            judul_unit,
            mata_pelajaran,
            tingkat_kelas,
            tujuan_pembelajaran: tujuan_pembelajaran || null,
            jumlah_pertemuan: jumlah_pertemuan || 2,
            durasi_per_jp: durasi_per_jp || 40,
            unit_plan_json: aiResponseJSON
        };

        const savedUnitPlan = await UnitPlanModel.saveUnitPlanAndDeductQuota(unitPlanData, isKepsek ? null : finalUserId);

        // 4. Update Status Request
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        const tokenUsage = {
            prompt_tokens: chatCompletion.usage?.prompt_tokens || 0,
            completion_tokens: chatCompletion.usage?.completion_tokens || 0,
            total_tokens: chatCompletion.usage?.total_tokens || 0
        };

        await UnitPlanModel.updateRequestStatus(requestId, 'completed', {
            output_data: savedUnitPlan,
            prompt_used: `System: ${systemPrompt}\nUser: ${prompt}`,
            llm_model_used: selectedModel,
            token_usage: tokenUsage,
            processing_time_ms: processingTimeMs
        });

        const updatedQuota = isKepsek ? { plan_type: 'unlimited', monthly_limit: 9999, used_this_month: 0 } : await UnitPlanModel.getUserQuota(finalUserId);

        res.status(201).json({
            success: true,
            message: "Modul Ajar (RPP) berhasil dibuat dengan Groq Llama 3.3.",
            request_id: requestId,
            status: "completed",
            data: savedUnitPlan,
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
            await UnitPlanModel.updateRequestStatus(requestId, 'failed', { 
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

const getUnitPlans = async (req, res) => {
    try {
        const data = await UnitPlanModel.getAllUnitPlans();
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data Modul Ajar (RPP).",
            data: data,
            meta: {}
        });
    } catch (error) {
        console.error("Error fetching unit plans:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dari server.",
            error: error.message
        });
    }
};

const getUnitPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await UnitPlanModel.getUnitPlanById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Modul Ajar tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil detail Modul Ajar.",
            data: data,
            meta: {}
        });
    } catch (error) {
        console.error("Error fetching unit plan by id:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dari server.",
            error: error.message
        });
    }
};

const updateUnitPlan = async (req, res) => {
    try {
        const { id } = req.params;

        // Pastikan data ada
        const existing = await UnitPlanModel.getUnitPlanById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Modul Ajar tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        const updated = await UnitPlanModel.updateUnitPlan(id, req.body);

        res.status(200).json({
            success: true,
            message: "Modul Ajar berhasil diperbarui.",
            data: updated,
            meta: {}
        });
    } catch (error) {
        console.error("Error updating unit plan:", error);
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui Modul Ajar.",
            error: error.message
        });
    }
};

const deleteUnitPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await UnitPlanModel.deleteUnitPlan(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Modul Ajar tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Modul Ajar berhasil dihapus.",
            data: { id: deleted.id },
            meta: {}
        });
    } catch (error) {
        console.error("Error deleting unit plan:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus Modul Ajar.",
            error: error.message
        });
    }
};

const downloadUnitPlanDocx = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const unitPlanData = await UnitPlanModel.getUnitPlanById(id);
        
        if (!unitPlanData) {
            return res.status(404).json({
                success: false,
                message: "Unit Plan tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate DOCX
        const fileName = `unit_plan_${id}.docx`;
        const filePath = path.join(tempDir, fileName);
        
        await generateUnitPlanDocx(unitPlanData, filePath);

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

module.exports = { generateUnitPlan, getUnitPlans, getUnitPlanById, updateUnitPlan, deleteUnitPlan, downloadUnitPlanDocx };
