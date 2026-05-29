const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse'); 
const WritingModel = require('../../models/assessment/writingModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. CREATE / GENERATE
const generateWritingFeedback = async (req, res) => {
    const requestId = uuidv4();
    const feedbackId = uuidv4();

    try {
        const {
            tingkat_kelas: input_kelas,     
            jenis_tulisan,                 
            fokus_feedback,                
            tulisan_siswa: input_teks_langsung, 
            nama_siswa,                    
            bahasa_output,                 
            userId
        } = req.body;

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';
        const targetBahasa = bahasa_output || 'Indonesia';

        // =========================================================================
        // 🌟 SEIRAMA MCASSESSMENT: INTEGRASI VALIDASI KUOTA USER
        // =========================================================================
        const quotaCheck = await WritingModel.checkUserQuota(finalUserId);
        if (quotaCheck && !quotaCheck.hasQuota) {
            return res.status(403).json({
                success: false,
                message: "Haris Maaf, Kuota pembuatan bulanan Anda telah habis. Silakan hubungi admin untuk peningkatan akun.",
                data: null,
                meta: { remaining: 0 }
            });
        }

        // --- FORMATTING JENIS TULISAN ---
        const jenisTulisanFormatted = jenis_tulisan ? jenis_tulisan.toLowerCase().trim() : 'umum';

        // --- MAPPING OTOMATIS TINGKAT KELAS ---
        let tingkat_kelas = "";
        const kelasRaw = input_kelas ? input_kelas.toString().toUpperCase().trim() : "";

        if (["7", "VII"].includes(kelasRaw)) tingkat_kelas = "7 SMP";
        else if (["8", "VIII"].includes(kelasRaw)) tingkat_kelas = "8 SMP";
        else if (["9", "IX"].includes(kelasRaw)) tingkat_kelas = "9 SMP";
        else if (["10", "X"].includes(kelasRaw)) tingkat_kelas = "10 SMA";
        else if (["11", "XI"].includes(kelasRaw)) tingkat_kelas = "11 SMA";
        else if (["12", "XII"].includes(kelasRaw)) tingkat_kelas = "12 SMA";
        else {
            return res.status(400).json({
                success: false,
                message: `Tingkat kelas '${input_kelas}' tidak valid. Backend menerima angka (7-12) atau Romawi (VII-XII).`,
                data: null,
                meta: {}
            });
        }

        // --- DETEKSI LOGIKA INPUT (PDF ATAU TEKS LANGSUNG) ---
        let tulisan_siswa = "";

        if (req.file) {
            try {
                let parseFunction = typeof pdfParse === 'function' ? pdfParse : (pdfParse && pdfParse.default === 'function' ? pdfParse.default : require('pdf-parse'));
                const pdfData = await parseFunction(req.file.buffer);
                tulisan_siswa = pdfData && pdfData.text ? pdfData.text.trim() : "";
                
                if (!tulisan_siswa || tulisan_siswa.length < 10) {
                    return res.status(400).json({ 
                        success: false, 
                        message: "File PDF kosong, tidak terbaca, atau hanya berisi gambar (scan).",
                        data: null,
                        meta: {}
                    });
                }
            } catch (pdfErr) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Gagal membaca file PDF: ${pdfErr.message}`,
                    data: null,
                    meta: {}
                });
            }
        } else if (input_teks_langsung && input_teks_langsung.trim() !== "") {  
            tulisan_siswa = input_teks_langsung;
        } else {
            return res.status(400).json({
                success: false,
                message: "Tulisan siswa wajib diisi (teks langsung atau file PDF).",
                data: null,
                meta: {}
            });
        }

        const inputData = {
            nama_siswa: nama_siswa || "Siswa Anonim",
            tingkat_kelas,
            jenis_tulisan: jenisTulisanFormatted,
            fokus_feedback,
            input_method: req.file ? "pdf_upload" : "text_input"
        };
        
        // Simpan request awal dengan status default 'processing'
        await WritingModel.createRequest(requestId, finalUserId, inputData);

        const fokusUtama = fokus_feedback || 'Gunakan standar penulisan bahasa Indonesia yang baik (EYD, efektivitas kalimat, kekayaan kosakata)';
        const targetModel = "llama-3.3-70b-versatile";

        // --- DEKLARASI PROMPT DIOPTIMALKAN UNTUK MULTI-BAHASA AKADEMIK ---
        const systemPrompt = `Anda adalah seorang dosen dan guru bahasa ahli, objektif, dan patuh pada instruksi. Tugas Anda memeriksa tulisan siswa bernama ${nama_siswa || 'Siswa Anonim'}. Anda WAJIB memberikan narasi ulasan (komentar, saran, ringkasan) dalam Bahasa ${targetBahasa}, namun struktur/kunci objek JSON harus tetap menggunakan penamaan bahasa Indonesia yang diinstruksikan user.`;

        const userPrompt = `Berikan umpan balik otomatis untuk karangan siswa berikut.\n\nKonteks Pembelajaran:\n- Jenis Teks: Teks ${jenisTulisanFormatted}\n- Tingkat Kelas Siswa: ${tingkat_kelas}\n- FOKUS PENILAIAN UTAMA: ${fokusUtama}\n\n----------------------------------------\nTeks Karangan Siswa yang Harus Dinilai:\n"""\n${tulisan_siswa}\n"""\n----------------------------------------\n\nEvaluasilah karangan di atas. Anda WAJIB mengembalikan respon dalam format JSON murni dengan struktur kunci (key) PERSIS seperti di bawah ini, tetapi untuk nilai teks di dalamnya wajib ditulis menggunakan Bahasa ${targetBahasa}:\n{\n  "skor_total": 85,\n  "aspek": [\n    {\n      "nama": "Nama Aspek Penulisan",\n      "skor": 80,\n      "komentar": "Ulasan detail analisis karangan siswa pada aspek ini",\n      "saran": "Langkah konkret perbaikan akademis bagi siswa"\n    }\n  ],\n  "ringkasan": "Kesimpulan umum performa esai dan kalimat motivasi akademis."\n}`;

        // 🌟 START TIMER
        const startTime = performance.now();

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: targetModel,
            response_format: { "type": "json_object" }
        });

        // 🌟 END TIMER
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);

        const rawContent = chatCompletion.choices[0].message.content;
        const aiResponse = JSON.parse(rawContent);

        // 🌟 AMBIL DATA METADATA TOKEN
        const usage = chatCompletion.usage || {};

        // 🌟 DEFENSIVE PARSING (Antisipasi jika LLM mengubah nama key di luar kendali)
        const rawAspek = aiResponse.aspek || aiResponse.aspects || [];
        const rawSkorTotal = aiResponse.skor_total !== undefined ? aiResponse.skor_total : (aiResponse.total_score || 0);
        const rawRingkasan = aiResponse.ringkasan || aiResponse.summary || "";

        const aspekClean = Array.isArray(rawAspek) ? rawAspek.map(item => ({
            nama_aspek: item.nama || item.nama_aspek || item.aspect_name || "Umum",
            skor: Number(item.skor || item.skor_aspek || item.score || 0).toFixed(2),
            saran: item.saran || item.suggestion || "",
            komentar: item.komentar || item.comment || ""
        })) : [];

        const feedbackJsonSesuaiSchema = {
            skor_total: Number(rawSkorTotal), 
            aspek: aspekClean,
            ringkasan: rawRingkasan
        };

        let arrayFokus = null;
        if (fokus_feedback) {
            arrayFokus = fokus_feedback.split(',').map(f => f.trim().toLowerCase());
        }

        const feedbackData = {
            id: feedbackId,
            request_id: requestId,
            tulisan_siswa,
            jenis_tulisan: jenisTulisanFormatted, 
            tingkat_kelas,
            fokus_feedback: arrayFokus, 
            feedback_json: feedbackJsonSesuaiSchema, 
            skor_keseluruhan: Number(rawSkorTotal).toFixed(2) 
        };

        // =========================================================================
        // 🌟 URUTAN ALUR PROSES DOSEN: SIMPAN DATA DULU -> JIKA SUKSES BARU POTONG KUOTA
        // =========================================================================
        const savedFeedback = await WritingModel.saveFeedback(feedbackData);
        await WritingModel.incrementQuotaUsage(finalUserId);

        const responseDataClean = {
            id: savedFeedback.id,
            request_id: savedFeedback.request_id,
            nama_siswa: nama_siswa || "Siswa Anonim",
            tulisan_siswa: savedFeedback.tulisan_siswa,
            jenis_tulisan: savedFeedback.jenis_tulisan,
            tingkat_kelas: savedFeedback.tingkat_kelas,
            fokus_feedback: savedFeedback.fokus_feedback,
            skor_total: Number(feedbackJsonSesuaiSchema.skor_total).toFixed(2),
            aspek: feedbackJsonSesuaiSchema.aspek,
            ringkasan: feedbackJsonSesuaiSchema.ringkasan
        };

        const outputLogData = {
            result: responseDataClean,
            model_used: targetModel,
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            total_tokens: usage.total_tokens || 0,
            prompt_used: `[SYSTEM PROMPT]\n${systemPrompt}\n\n[USER PROMPT]\n${userPrompt}`,
            processing_time_ms: processingTimeMs
        };

        await WritingModel.updateRequestStatus(requestId, 'completed', outputLogData);

        return res.status(201).json({
            success: true,
            message: "Haris Berhasil! Umpan balik karangan siswa sukses dibuat menggunakan Llama 3.3.",
            data: responseDataClean,
            meta: {
                model_used: targetModel,
                tokens: usage,
                processing_time_ms: processingTimeMs
            }
        }); 

    } catch (error) {
        console.error("Error Detail Writing Feedback:", error);
        try {
            await WritingModel.updateRequestStatus(requestId, 'failed', { error: error.message });
        } catch (dbErr) {
            console.error("Gagal update status fail ke DB");
        }
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada proses AI atau Database",
            error: error.message,
            data: null, 
            meta: {}    
        });
    }
};

// 2. READ ALL
const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await WritingModel.getAllFeedback();
        
        const formattedFeedbacks = feedbacks.map(item => {
            const fJson = typeof item.feedback_json === 'string' ? JSON.parse(item.feedback_json) : item.feedback_json;
            
            const aspekNormalized = fJson && Array.isArray(fJson.aspek) 
                ? fJson.aspek.map(asp => ({
                    nama_aspek: asp.nama_aspek || asp.nama,
                    skor: isNaN(asp.skor) ? asp.skor : Number(asp.skor).toFixed(2),
                    saran: asp.saran,
                    komentar: asp.komentar
                  }))
                : [];

            const rawSkor = fJson ? fJson.skor_total : (item.skor_keseluruhan || 0);

            return {
                id: item.id,
                request_id: item.request_id,
                nama_siswa: item.nama_siswa || "Siswa Anonim",
                tulisan_siswa: item.tulisan_siswa,
                jenis_tulisan: item.jenis_tulisan,
                tingkat_kelas: item.tingkat_kelas,
                fokus_feedback: item.fokus_feedback,
                skor_total: Number(rawSkor).toFixed(2),
                aspek: aspekNormalized,
                ringkasan: fJson ? fJson.ringkasan : ""
            };
        });

        return res.status(200).json({
            success: true,
            message: "Haris Berhasil mengambil semua data riwayat umpan balik tulisan.",
            data: formattedFeedbacks,
            meta: {}
        });
    } catch (error) {
        console.error("Error di writingController (getAllFeedback):", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil semua data riwayat umpan balik.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// 3. READ BY ID
const getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await WritingModel.getFeedbackById(id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: `Data riwayat umpan balik dengan ID ${id} tidak ditemukan.`,
                data: null,
                meta: {}
            });
        }

        const fJson = typeof feedback.feedback_json === 'string' ? JSON.parse(feedback.feedback_json) : feedback.feedback_json;

        const aspekNormalized = fJson && Array.isArray(fJson.aspek) 
            ? fJson.aspek.map(asp => ({
                nama_aspek: asp.nama_aspek || asp.nama,
                skor: isNaN(asp.skor) ? asp.skor : Number(asp.skor).toFixed(2),
                saran: asp.saran,
                komentar: asp.komentar
              }))
            : [];

        const rawSkor = fJson ? fJson.skor_total : (feedback.skor_keseluruhan || 0);

        const formattedFeedback = {
            id: feedback.id,
            request_id: feedback.request_id,
            nama_siswa: feedback.nama_siswa || "Siswa Anonim",
            tulisan_siswa: feedback.tulisan_siswa,
            jenis_tulisan: feedback.jenis_tulisan,
            tingkat_kelas: feedback.tingkat_kelas,
            fokus_feedback: feedback.fokus_feedback,
            skor_total: Number(rawSkor).toFixed(2),
            aspek: aspekNormalized,
            ringkasan: fJson ? fJson.ringkasan : ""
        };

        return res.status(200).json({
            success: true,
            message: "Haris Berhasil mengambil detail data umpan balik.",
            data: formattedFeedback,
            meta: {}
        });
    } catch (error) {
        console.error("Error di writingController (getFeedbackById):", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil detail data umpan balik.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// 4. UPDATE
const updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { skor_total, aspek, ringkasan } = req.body; 

        if (!id || skor_total === undefined || !aspek || !ringkasan) {
            return res.status(400).json({
                success: false,
                message: "ID parameter dan body dengan property 'skor_total', 'aspek', serta 'ringkasan' wajib disertakan.",
                data: null,
                meta: {}
            });
        }

        const aspekPayload = aspek.map(asp => ({
            nama_aspek: asp.nama_aspek || asp.nama,
            skor: isNaN(asp.skor) ? asp.skor : Number(asp.skor).toFixed(2),
            saran: asp.saran,
            komentar: asp.komentar
        }));

        const payloadJson = {
            skor_total: Number(skor_total),
            aspek: aspekPayload,
            ringkasan
        };

        const skorKeseluruhanBaru = Number(skor_total).toFixed(2);
        const updatedData = await WritingModel.updateFeedback(id, payloadJson, skorKeseluruhanBaru);
        const fJson = typeof updatedData.feedback_json === 'string' ? JSON.parse(updatedData.feedback_json) : updatedData.feedback_json;

        const aspekResponseNormalized = fJson && Array.isArray(fJson.aspek)
            ? fJson.aspek.map(asp => ({
                nama_aspek: asp.nama_aspek || asp.nama,
                skor: asp.skor,
                saran: asp.saran,
                komentar: asp.komentar
              }))
            : [];

        const rawSkor = fJson ? fJson.skor_total : (updatedData.skor_keseluruhan || 0);

        const formattedResponse = {
            id: updatedData.id,
            request_id: updatedData.request_id,
            nama_siswa: updatedData.nama_siswa || "Siswa Anonim",
            tulisan_siswa: updatedData.tulisan_siswa,
            jenis_tulisan: updatedData.jenis_tulisan,
            tingkat_kelas: updatedData.tingkat_kelas,
            fokus_feedback: updatedData.fokus_feedback,
            skor_total: Number(rawSkor).toFixed(2),
            aspek: aspekResponseNormalized,
            ringkasan: fJson ? fJson.ringkasan : ""
        };

        return res.status(200).json({
            success: true,
            message: "Perubahan penilaian dan ulasan esai berhasil disimpan.",
            data: formattedResponse,
            meta: {}
        });
    } catch (error) {
        console.error("Error di writingController (updateFeedback):", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui data umpan balik.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// 5. DELETE
const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await WritingModel.deleteFeedback(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: `Data umpan balik dengan ID ${id} tidak ditemukan atau sudah dihapus sebelumnya.`,
                data: null,
                meta: {}
            });
        }

        return res.status(200).json({
            success: true,
            message: `Data riwayat umpan balik esai dengan ID ${id} berhasil dihapus dari sistem.`,
            data: null,
            meta: {}
        });
    } catch (error) {
        console.error("Error di writingController (deleteFeedback):", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menghapus data umpan balik.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// 6. SHARE TEXT WA
const getFeedbackShareText = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await WritingModel.getFeedbackById(id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: `Data ulasan dengan ID ${id} tidak ditemukan.`,
                data: null,
                meta: {}
            });
        }

        const fJson = typeof feedback.feedback_json === 'string' ? JSON.parse(feedback.feedback_json) : feedback.feedback_json;
        const aspekList = fJson && fJson.aspek ? fJson.aspek : [];
        const rawSkor = fJson ? fJson.skor_total : (feedback.skor_keseluruhan || 0);
        const skorTotal = Number(rawSkor).toFixed(2);
        const ringkasanText = fJson ? fJson.ringkasan : "";

        let shareText = `*LAPORAN HASIL EVALUASI TULISAN SISWA*\n`;
        shareText += `=========================================\n`;
        shareText += `Nama Siswa: ${feedback.nama_siswa || 'Siswa Anonim'}\n`;
        shareText += `Tingkat/Kelas: ${feedback.tingkat_kelas}\n`;
        shareText += `Jenis Teks: Teks ${feedback.jenis_tulisan}\n`;
        shareText += `Skor Keseluruhan: ${skorTotal}\n`;
        shareText += `=========================================\n\n`;
        shareText += `*DETAIL PENILAIAN PER ASPEK:*\n\n`;

        aspekList.forEach((asp, index) => {
            shareText += `${index + 1}. *Aspek ${String(asp.nama_aspek || asp.nama || '').toUpperCase()}* (Skor: ${asp.skor})\n`;
            shareText += `   Catatan Guru: ${asp.komentar}\n`;
            shareText += `   Rekomendasi: ${asp.saran}\n\n`;
        });

        shareText += `*KESIMPULAN DAN SARAN PERBAIKAN:*\n`;
        shareText += `"${ringkasanText}"\n\n`;
        shareText += `Selamat atas kerja kerasnya dalam menyelesaikan tugas ini. Teruslah berlatih menulis untuk mengasah kemampuanmu ke depan.`;

        return res.status(200).json({
            success: true,
            message: "Haris Berhasil meracik teks ulasan yang siap dishare ke siswa.",
            data: {
                id: feedback.id,
                nama_siswa: feedback.nama_siswa,
                text_to_copy: shareText 
            },
            meta: {}
        });
    } catch (error) {
        console.error("Error di writingController (getFeedbackShareText):", error);
        return res.status(500).json({
            success: false,
            message: "Gagal meracik teks share ulasan.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

module.exports = { 
    generateWritingFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    getFeedbackShareText
};
