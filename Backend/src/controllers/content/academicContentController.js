const { v4: uuidv4 } = require('uuid');
const AcademicContentModel = require('../../models/content/academicContentModel');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { generateAcademicContentPDF } = require('../../utils/pdfGenerator');

// Inisialisasi Groq menggunakan API Key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to map jenis_konten to valid academic_content_type enum in DB
const mapJenisKonten = (jenis) => {
    if (!jenis) return 'penjelasan';
    const normalized = jenis.toLowerCase().trim();
    if (normalized === 'materi pembelajaran' || normalized === 'materi_pembelajaran' || normalized === 'penjelasan' || normalized === 'materi') {
        return 'penjelasan';
    }
    if (normalized === 'ringkasan' || normalized === 'ringkasan materi') {
        return 'ringkasan';
    }
    if (normalized === 'contoh soal' || normalized === 'contoh_soal' || normalized === 'soal') {
        return 'contoh_soal';
    }
    if (normalized === 'kamus' || normalized === 'kamus istilah') {
        return 'kamus';
    }
    if (normalized === 'artikel') {
        return 'artikel';
    }
    
    const validTypes = ['ringkasan', 'penjelasan', 'contoh_soal', 'kamus', 'artikel'];
    if (validTypes.includes(normalized)) {
        return normalized;
    }
    return 'penjelasan';
};

// Helper to map panjang to valid content_length enum in DB
const mapPanjangKonten = (panjang) => {
    if (!panjang) return 'sedang';
    const normalized = panjang.toLowerCase().trim();
    if (normalized === 'singkat' || normalized === 'short') {
        return 'singkat';
    }
    if (normalized === 'sedang' || normalized === 'medium') {
        return 'sedang';
    }
    if (normalized === 'panjang' || normalized === 'long') {
        return 'panjang';
    }
    
    const validLengths = ['singkat', 'sedang', 'panjang'];
    if (validLengths.includes(normalized)) {
        return normalized;
    }
    return 'sedang';
};

const generateAcademicContent = async (req, res) => {
    const requestId = uuidv4();
    const contentId = uuidv4();

    // ⏱️ MULAI HITUNG WAKTU PROSES (Stopwatch Start)
    const startTime = performance.now();
    const selectedModel = "llama-3.3-70b-versatile";

    try {
        const {
            jenis_konten, topik, mapel, kelas, panjang, bahasa, gaya_bahasa
        } = req.body;

        // userId diambil dari JWT token
        const finalUserId = req.user.id;
        const mappedJenis = mapJenisKonten(jenis_konten);
        const mappedPanjang = mapPanjangKonten(panjang);

        const inputDataForLog = {
            jenis_konten: mappedJenis, topik, mapel, kelas, panjang: mappedPanjang, bahasa, gaya_bahasa
        };

        // LANGKAH A: Tulis Log Request Awal (Pending)
        await AcademicContentModel.createRequest(requestId, finalUserId, inputDataForLog, {
            llm_model_used: selectedModel
        });

        // LANGKAH B: Panggil Cek Kuota (FOR UPDATE)
        const quota = await AcademicContentModel.getUserQuota(finalUserId);
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
            await AcademicContentModel.updateRequestStatus(requestId, 'failed', { 
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
        await AcademicContentModel.updateRequestStatus(requestId, 'processing');

        // 2. Bangun prompt spesifik per jenis_konten
        const baseInfo = `Mata Pelajaran: ${mapel || 'Umum'}\nTarget Kelas: ${kelas || 'Umum'}\nPanjang Konten: ${mappedPanjang}\nBahasa: ${bahasa || 'Indonesia'}`;

        let prompt = '';
        if (mappedJenis === 'contoh_soal') {
            const jumlahSoal = mappedPanjang === 'singkat' ? 5 : mappedPanjang === 'panjang' ? 15 : 10;
            prompt = `Anda adalah guru madrasah ahli pembuat soal. Buatlah kumpulan ${jumlahSoal} CONTOH SOAL beserta JAWABAN dan PEMBAHASAN untuk:\nTopik: "${topik}"\n${baseInfo}\n\nBerikan respons dalam format JSON murni:\n{\n    "judul": "Contoh Soal: ${topik}",\n    "ringkasan": "Deskripsi singkat set soal ini",\n    "soal": [\n        {\n            "nomor": 1,\n            "pertanyaan": "Teks pertanyaan soal",\n            "pilihan": {"A": "...", "B": "...", "C": "...", "D": "..."},\n            "jawaban": "A",\n            "pembahasan": "Penjelasan mengapa jawaban ini benar"\n        }\n    ],\n    "kata_kunci": ["kata1", "kata2"],\n    "referensi": ["referensi 1"]\n}`;
        } else if (mappedJenis === 'kamus') {
            const jumlahIstilah = mappedPanjang === 'singkat' ? 8 : mappedPanjang === 'panjang' ? 25 : 15;
            prompt = `Anda adalah guru madrasah ahli membuat glosarium. Buatlah GLOSARIUM berisi ${jumlahIstilah} ISTILAH PENTING dari:\nTopik: "${topik}"\n${baseInfo}\n\nUrutkan istilah secara alfabetis.\n\nBerikan respons dalam format JSON murni:\n{\n    "judul": "Glosarium: ${topik}",\n    "ringkasan": "Deskripsi singkat glosarium ini",\n    "istilah": [\n        {\n            "kata": "Nama istilah",\n            "definisi": "Pengertian atau definisi lengkap istilah tersebut",\n            "contoh": "Contoh penggunaan dalam kalimat (kosongkan jika tidak relevan)"\n        }\n    ],\n    "kata_kunci": ["kata1", "kata2"],\n    "referensi": ["referensi 1"]\n}`;
        } else if (mappedJenis === 'ringkasan') {
            const jumlahPoin = mappedPanjang === 'singkat' ? 3 : mappedPanjang === 'panjang' ? 8 : 5;
            prompt = `Anda adalah guru madrasah ahli membuat rangkuman. Buatlah RANGKUMAN MATERI terstruktur dengan ${jumlahPoin} poin utama untuk:\nTopik: "${topik}"\n${baseInfo}\n\nBerikan respons dalam format JSON murni:\n{\n    "judul": "Rangkuman: ${topik}",\n    "ringkasan": "Ringkasan keseluruhan dalam 2-3 kalimat",\n    "poin_penting": [\n        {\n            "subjudul": "Nama sub-topik atau poin utama",\n            "isi": "Penjelasan detail poin ini dalam 2-4 kalimat"\n        }\n    ],\n    "kesimpulan": "Kesimpulan akhir dari materi",\n    "kata_kunci": ["kata1", "kata2", "kata3"],\n    "referensi": ["referensi 1"]\n}`;
        } else {
            // penjelasan (default)
            prompt = `Anda adalah guru madrasah ahli membuat penjelasan konsep. Buatlah PENJELASAN KONSEP yang mendalam untuk:\nTopik: "${topik}"\n${baseInfo}\n\nBerikan respons dalam format JSON murni:\n{\n    "judul": "Penjelasan: ${topik}",\n    "ringkasan": "Ringkasan singkat konsep dalam 1-2 kalimat",\n    "pendahuluan": "Paragraf pembuka yang memperkenalkan konsep",\n    "konten": "Penjelasan konsep secara lengkap dan mendalam. Gunakan \\\\n\\\\n untuk memisahkan antar paragraf.",\n    "contoh_penerapan": "Contoh nyata atau ilustrasi konkret dari konsep ini",\n    "kata_kunci": ["kata1", "kata2", "kata3"],\n    "referensi": ["referensi 1"]\n}`;
        }

        const systemPrompt = "Anda adalah asisten pembuat materi akademik madrasah yang ahli. Anda WAJIB memberikan respon dalam format JSON murni tanpa teks apa pun di luar JSON.";

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
        const contentData = {
            id: contentId,
            request_id: requestId,
            jenis_konten: mappedJenis,
            topik: topik,
            mata_pelajaran: mapel,
            tingkat_kelas: kelas,
            panjang_konten: mappedPanjang,
            content_json: aiResponse
        };

        const savedContent = await AcademicContentModel.saveAcademicContentAndDeductQuota(contentData, finalUserId);

        // 4. Update Status Request
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        const tokenUsage = {
            prompt_tokens: chatCompletion.usage?.prompt_tokens || 0,
            completion_tokens: chatCompletion.usage?.completion_tokens || 0,
            total_tokens: chatCompletion.usage?.total_tokens || 0
        };

        await AcademicContentModel.updateRequestStatus(requestId, 'completed', {
            output_data: savedContent,
            prompt_used: `System: ${systemPrompt}\nUser: ${prompt}`,
            llm_model_used: selectedModel,
            token_usage: tokenUsage,
            processing_time_ms: processingTimeMs
        });

        const updatedQuota = await AcademicContentModel.getUserQuota(finalUserId);

        res.status(201).json({
            success: true,
            message: "Konten akademik berhasil dibuat dengan Groq Llama 3.3.",
            request_id: requestId,
            status: "completed",
            data: savedContent,
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
            await AcademicContentModel.updateRequestStatus(requestId, 'failed', { 
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

const getAcademicContents = async (req, res) => {
    try {
        const data = await AcademicContentModel.getAllAcademicContents(req.user.id);
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data konten akademik.",
            data: data
        });
    } catch (error) {
        console.error("Error fetching academic contents:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data konten akademik dari server.",
            error: error.message
        });
    }
};

const downloadAcademicContentPDF = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const contentData = await AcademicContentModel.getAcademicContentById(id, req.user.id);
        
        if (!contentData) {
            return res.status(404).json({
                success: false,
                message: "Konten akademik tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate PDF
        const fileName = `academic_content_${id}.pdf`;
        const filePath = path.join(tempDir, fileName);
        
        await generateAcademicContentPDF(contentData, filePath);

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

const getAcademicContentById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await AcademicContentModel.getAcademicContentById(id, req.user.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Konten akademik tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil detail konten akademik.",
            data: data,
            meta: {}
        });
    } catch (error) {
        console.error("Error fetching academic content by id:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dari server.",
            error: error.message
        });
    }
};

const updateAcademicContent = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await AcademicContentModel.getAcademicContentById(id, req.user.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Konten akademik tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        const updated = await AcademicContentModel.updateAcademicContent(id, req.user.id, req.body);

        res.status(200).json({
            success: true,
            message: "Konten akademik berhasil diperbarui.",
            data: updated,
            meta: {}
        });
    } catch (error) {
        console.error("Error updating academic content:", error);
        res.status(500).json({
            success: false,
            message: "Gagal memperbarui konten akademik.",
            error: error.message
        });
    }
};

const deleteAcademicContent = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await AcademicContentModel.deleteAcademicContent(id, req.user.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Konten akademik tidak ditemukan.",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Konten akademik berhasil dihapus.",
            data: { id: deleted.id },
            meta: {}
        });
    } catch (error) {
        console.error("Error deleting academic content:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus konten akademik.",
            error: error.message
        });
    }
};

module.exports = { generateAcademicContent, getAcademicContents, getAcademicContentById, updateAcademicContent, deleteAcademicContent, downloadAcademicContentPDF };
