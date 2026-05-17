const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse'); 
const WritingModel = require('../../models/assessment/writingModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateWritingFeedback = async (req, res) => {
    const requestId = uuidv4();
    const feedbackId = uuidv4();

    try {
        const {
            tingkat_kelas: input_kelas,     // Menerima angka murni (7 - 12)
            jenis_tulisan,                 // narasi | deskripsi | eksposisi | argumentasi
            fokus_feedback,                
            tulisan_siswa: input_teks_langsung, 
            userId
        } = req.body;

        // 1. --- VALIDASI ENUM JENIS TULISAN ---
        const allowedJenisTulisan = ['narasi', 'deskripsi', 'eksposisi', 'argumentasi'];
        const jenisTulisanFormatted = jenis_tulisan ? jenis_tulisan.toLowerCase().trim() : '';

        if (!allowedJenisTulisan.includes(jenisTulisanFormatted)) {
            return res.status(400).json({
                success: false,
                message: `Jenis tulisan '${jenis_tulisan}' tidak valid. Backend hanya menerima: narasi, deskripsi, eksposisi, atau argumentasi.`
            });
        }

        // 2. --- MAPPING OTOMATIS TINGKAT KELAS ---
        let tingkat_kelas = "";
        const angkaKelas = parseInt(input_kelas); 

        if (angkaKelas >= 7 && angkaKelas <= 9) {
            tingkat_kelas = `${angkaKelas} SMP`; 
        } else if (angkaKelas >= 10 && angkaKelas <= 12) {
            tingkat_kelas = `${angkaKelas} SMA`; 
        } else {
            return res.status(400).json({
                success: false,
                message: `Tingkat kelas '${input_kelas}' tidak valid. Backend hanya menerima angka kelas 7 sampai 12.`
            });
        }

        // 3. --- DETEKSI LOGIKA INPUT (PDF ATAU TEKS LANGSUNG) ---
        let tulisan_siswa = "";

        if (req.file) {
            try {
                console.log("=== FILE DITERIMA BACKEND ===");
                console.log("Nama File:", req.file.originalname);
                console.log("Ukuran (Bytes):", req.file.size);

                // Mengatasi variasi export pdf-parse pada Node.js modern secara aman
                let parseFunction;
                if (typeof pdfParse === 'function') {
                    parseFunction = pdfParse;
                } else if (pdfParse && typeof pdfParse.default === 'function') {
                    parseFunction = pdfParse.default;
                } else {
                    parseFunction = require('pdf-parse');
                }

                // WAJIB AWAI: pdf-parse mengembalikan Promise
                const pdfData = await parseFunction(req.file.buffer);
                tulisan_siswa = pdfData && pdfData.text ? pdfData.text.trim() : "";
                
                console.log("=== HASIL EKSTRAKSI TEXT PDF ===");
                console.log("Panjang teks:", tulisan_siswa.length);
                console.log("Preview:", tulisan_siswa.substring(0, 200) + (tulisan_siswa.length > 200 ? "..." : ""));
                
                if (!tulisan_siswa || tulisan_siswa.length < 10) {
                    return res.status(400).json({ 
                        success: false, 
                        message: "File PDF kosong, tidak terbaca, atau hanya berisi gambar (scan)." 
                    });
                }
            } catch (pdfErr) {
                console.error("=== GAGAL EKSTRAKSI PDF DETAIL ===");
                console.error(pdfErr);
                return res.status(400).json({ 
                    success: false, 
                    message: `Gagal membaca file PDF: ${pdfErr.message}` 
                });
            }
        } else if (input_teks_langsung && input_teks_langsung.trim() !== "") {  
            tulisan_siswa = input_teks_langsung;
        } else {
            return res.status(400).json({
                success: false,
                message: "Tulisan siswa wajib diisi (teks langsung atau file PDF)."
            });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // 4. --- LOG REQUEST AWAL KE DATABASE ---
        const inputData = {
            tingkat_kelas,
            jenis_tulisan: jenisTulisanFormatted,
            fokus_feedback,
            input_method: req.file ? "pdf_upload" : "text_input"
        };
        await WritingModel.createRequest(requestId, finalUserId, inputData);

        // 5. --- PROMPT STRUKTUR GROQ AI (LLAMA 3.3) ---
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah seorang guru bahasa yang ahli, objektif, dan konstruktif. Tugas Anda adalah memeriksa tulisan siswa dan memberikan feedback mendalam dalam format JSON murni."
                },
                {
                    role: "user",
                    content: `Berikan umpan balik (feedback) otomatis untuk karangan siswa berikut.
                    
                    Konteks Pembelajaran:
                    - Jenis Teks: Teks ${jenisTulisanFormatted}
                    - Tingkat Kelas Siswa: ${tingkat_kelas}
                    - Fokus Penilaian Utama: ${fokus_feedback || 'Gunakan standar penulisan bahasa Indonesia yang baik (EYD, efektivitas kalimat)'}
                    
                    ----------------------------------------
                    Teks Karangan Siswa yang Harus Dinilai:
                    """
                    ${tulisan_siswa}
                    """
                    ----------------------------------------

                    Evaluasilah karangan di atas dan wajib kembalikan respon dalam format JSON murni dengan struktur persis seperti ini:
                    {
                        "skor_keseluruhan": 82.5, 
                        "analisis_rubrik": "Tulis ulasan mendalam mengenai performa tulisan siswa dikaitkan dengan fokus penilaian.",
                        "detail_perbaikan_kalimat": [
                            {
                                "salah": "Kutipan teks siswa yang keliru atau tidak efektif",
                                "perbaikan": "Saran perbaikan teks yang benar",
                                "alasan": "Penjelasan logis mengapa bagian itu salah dan bagaimana memperbaikinya"
                            }
                        ],
                        "saran_motivasi": "Berikan pesan penutup yang menyemangati siswa untuk terus menulis."
                    }`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // 6. --- STRUKTUR DATA SINKRON DENGAN FOTO TABEL DATABASE KAMU ---
        const feedbackData = {
            id: feedbackId,
            request_id: requestId,
            tulisan_siswa,
            jenis_tulisan: jenisTulisanFormatted, 
            tingkat_kelas,
            fokus_feedback: fokus_feedback ? [fokus_feedback] : null, // Dimasukkan ke format TEXT[]
            feedback_json: aiResponse, 
            skor_keseluruhan: aiResponse.skor_keseluruhan
        };

        // Simpan ke PostgreSQL via Model
        const savedFeedback = await WritingModel.saveFeedback(feedbackData);

        // 7. --- UPDATE STATUS LOG REQUEST ---
        await WritingModel.updateRequestStatus(requestId, 'completed', savedFeedback);

        // Kembalikan response sukses
        return res.status(201).json({
            success: true,
            message: "Umpan balik karangan siswa sukses dibuat menggunakan Llama 3.3.",
            data: savedFeedback
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
            error: error.message
        });
    }
};

module.exports = { generateWritingFeedback };