const { v4: uuidv4 } = require('uuid');
const PresentationModel = require('../../models/content/presentationModel');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { generatePresentationPPT } = require('../../utils/pptGenerator');

// Inisialisasi Groq menggunakan API Key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generatePresentation = async (req, res) => {
    const requestId = uuidv4();
    const presentationId = uuidv4();

    // ⏱️ MULAI HITUNG WAKTU PROSES (Stopwatch Start)
    const startTime = performance.now();
    const selectedModel = "llama-3.3-70b-versatile";

    try {
        const {
            topik, jumlah_slide, tujuan, audiens, include_catatan
        } = req.body;

        // userId diambil dari JWT token
        const finalUserId = req.user.id;

        const inputDataForLog = {
            topik, jumlah_slide, tujuan, audiens, include_catatan
        };

        // LANGKAH A: Tulis Log Request Awal (Pending)
        await PresentationModel.createRequest(requestId, finalUserId, inputDataForLog, {
            llm_model_used: selectedModel
        });

        // LANGKAH B: Panggil Cek Kuota (FOR UPDATE)
        const quota = await PresentationModel.getUserQuota(finalUserId);
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
            await PresentationModel.updateRequestStatus(requestId, 'failed', { 
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
        await PresentationModel.updateRequestStatus(requestId, 'processing');

        // 2. Panggil Groq AI Llama 3.3
        const prompt = `Anda adalah asisten pembuat materi presentasi yang ahli. Buatlah presentasi sebanyak ${jumlah_slide} slide tentang topik: "${topik}".
Tujuan presentasi: ${tujuan || 'Edukasi / Penjelasan umum'}.
Target Audiens: ${audiens || 'Umum'}.
Sertakan catatan presenter: ${include_catatan ? 'Ya' : 'Tidak'}.

Anda wajib memberikan respon dalam format JSON murni dengan struktur berikut:
{
    "slides_json": [
        {
            "slide_number": 1,
            "title": "Judul Slide",
            "content": ["Poin 1", "Poin 2", "Poin 3"]${include_catatan ? ',\n            "catatan": "Catatan untuk presenter saat menjelaskan slide ini"' : ''}
        }
    ]
}`;

        const systemPrompt = "Anda adalah asisten pembuat materi presentasi yang ahli. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun.";

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
        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // 3. Simpan ke Database
        const presentationData = {
            id: presentationId,
            request_id: requestId,
            topik: topik,
            jumlah_slide: aiResponse.slides_json.length,
            tujuan: tujuan || null,
            audiens: audiens || null,
            slides_json: aiResponse.slides_json,
            include_catatan: include_catatan || false
        };

        const savedPresentation = await PresentationModel.savePresentationAndDeductQuota(presentationData, finalUserId);

        // 4. Update Status Request
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        const tokenUsage = {
            prompt_tokens: chatCompletion.usage?.prompt_tokens || 0,
            completion_tokens: chatCompletion.usage?.completion_tokens || 0,
            total_tokens: chatCompletion.usage?.total_tokens || 0
        };

        await PresentationModel.updateRequestStatus(requestId, 'completed', {
            output_data: savedPresentation,
            prompt_used: `System: ${systemPrompt}\nUser: ${prompt}`,
            llm_model_used: selectedModel,
            token_usage: tokenUsage,
            processing_time_ms: processingTimeMs
        });

        const updatedQuota = await PresentationModel.getUserQuota(finalUserId);

        res.status(201).json({
            success: true,
            message: "Presentasi berhasil dibuat dengan Groq Llama 3.3.",
            request_id: requestId,
            status: "completed",
            data: savedPresentation,
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
            await PresentationModel.updateRequestStatus(requestId, 'failed', { 
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

const getPresentations = async (req, res) => {
    try {
        const data = await PresentationModel.getAllPresentations(req.user.id);
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data presentasi.",
            data: data
        });
    } catch (error) {
        console.error("Error fetching presentations:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data presentasi dari server.",
            error: error.message
        });
    }
};

const downloadPresentationPPT = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const presentationData = await PresentationModel.getPresentationById(id, req.user.id);
        
        if (!presentationData) {
            return res.status(404).json({
                success: false,
                message: "Presentasi tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate PPT
        const fileName = `presentation_${id}.pptx`;
        const filePath = path.join(tempDir, fileName);
        
        await generatePresentationPPT(presentationData, filePath);

        // Download file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
            }
            // Hapus file setelah download
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating PPT:", error);
        res.status(500).json({
            success: false,
            message: "Gagal generate PPT",
            error: error.message
        });
    }
};

const getPresentationById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await PresentationModel.getPresentationById(id, req.user.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Presentasi tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil detail presentasi.",
            data: data,
            meta: {}
        });
    } catch (error) {
        console.error("Error fetching presentation by id:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dari server.",
            error: error.message
        });
    }
};

const updatePresentation = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await PresentationModel.getPresentationById(id, req.user.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Presentasi tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        const updated = await PresentationModel.updatePresentation(id, req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: "Presentasi berhasil diperbarui.",
            data: updated,
            meta: {}
        });
    } catch (error) {
        console.error("Error updating presentation:", error);
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui presentasi.",
            error: error.message
        });
    }
};

const deletePresentation = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await PresentationModel.deletePresentation(id, req.user.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Presentasi tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Presentasi berhasil dihapus.",
            data: { id: deleted.id },
            meta: {}
        });
    } catch (error) {
        console.error("Error deleting presentation:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus presentasi.",
            error: error.message
        });
    }
};

module.exports = { generatePresentation, getPresentations, getPresentationById, updatePresentation, deletePresentation, downloadPresentationPPT };
