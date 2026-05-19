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
            tingkat_kelas: input_kelas,     // Menerima angka murni (7-12) atau Romawi (VII-XII)
            jenis_tulisan,                 // narasi | deskripsi | eksposisi | argumentasi
            fokus_feedback,                
            tulisan_siswa: input_teks_langsung, 
            nama_siswa,                    // Antisipasi input dari form frontend
            bahasa_output,                 // Antisipasi input bahasa dari form frontend
            userId
        } = req.body;

        // 1. --- VALIDASI ENUM JENIS TULISAN ---
        const allowedJenisTulisan = ['narasi', 'deskripsi', 'eksposisi', 'argumentasi'];
        const jenisTulisanFormatted = jenis_tulisan ? jenis_tulisan.toLowerCase().trim() : '';

        if (!allowedJenisTulisan.includes(jenisTulisanFormatted)) {
            return res.status(400).json({
                success: false,
                message: `Jenis tulisan '${jenis_tulisan}' tidak valid. Backend hanya menerima: narasi, deskripsi, eksposisi, atau argumentasi.`,
                data: null,
                meta: {}
            });
        }

        // 2. --- MAPPING AUTOMATIS TINGKAT KELAS (Mendukung Angka Murni & Romawi) ---
        let tingkat_kelas = "";
        const kelasRaw = input_kelas ? input_kelas.toString().toUpperCase().trim() : "";

        if (kelasRaw === "7" || kelasRaw === "VII") {
            tingkat_kelas = "7 SMP";
        } else if (kelasRaw === "8" || kelasRaw === "VIII") {
            tingkat_kelas = "8 SMP";
        } else if (kelasRaw === "9" || kelasRaw === "IX") {
            tingkat_kelas = "9 SMP";
        } else if (kelasRaw === "10" || kelasRaw === "X") {
            tingkat_kelas = "10 SMA";
        } else if (kelasRaw === "11" || kelasRaw === "XI") {
            tingkat_kelas = "11 SMA";
        } else if (kelasRaw === "12" || kelasRaw === "XII") {
            tingkat_kelas = "12 SMA";
        } else {
            return res.status(400).json({
                success: false,
                message: `Tingkat kelas '${input_kelas}' tidak valid. Backend menerima angka (7-12) atau Romawi (VII-XII).`,
                data: null,
                meta: {}
            });
        }

        // 3. --- DETEKSI LOGIKA INPUT (PDF ATAU TEKS LANGSUNG) ---
        let tulisan_siswa = "";

        if (req.file) {
            try {
                console.log("=== FILE DITERIMA BACKEND ===");
                console.log("Nama File:", req.file.originalname);

                let parseFunction;
                if (typeof pdfParse === 'function') {
                    parseFunction = pdfParse;
                } else if (pdfParse && typeof pdfParse.default === 'function') {
                    parseFunction = pdfParse.default;
                } else {
                    parseFunction = require('pdf-parse');
                }

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
                console.error("=== GAGAL EKSTRAKSI PDF DETAIL ===");
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

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // 4. --- LOG REQUEST AWAL KE DATABASE ---
        const inputData = {
            nama_siswa: nama_siswa || "Siswa Anonim",
            tingkat_kelas,
            jenis_tulisan: jenisTulisanFormatted,
            fokus_feedback,
            input_method: req.file ? "pdf_upload" : "text_input"
        };
        await WritingModel.createRequest(requestId, finalUserId, inputData);

        // 5. --- PROMPT STRUKTUR GROQ AI (MENDUKUNG MULTI-FOKUS) ---
        const fokusUtama = fokus_feedback || 'Gunakan standar penulisan bahasa Indonesia yang baik (EYD, efektivitas kalimat, kekayaan kosakata)';

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Anda adalah seorang guru bahasa yang ahli, objektif, dan sangat patuh pada instruksi. 
                    Tugas Anda adalah memeriksa tulisan siswa bernama ${nama_siswa || 'Siswa Anonim'}.
                    Anda WAJIB mengembalikan respon dalam bentuk JSON murni menggunakan Bahasa ${bahasa_output || 'Indonesia'}.`
                },
                {
                    role: "user",
                    content: `Berikan umpan balik otomatis untuk karangan siswa berikut.
                    
                    Konteks Pembelajaran:
                    - Jenis Teks: Teks ${jenisTulisanFormatted}
                    - Tingkat Kelas Siswa: ${tingkat_kelas}
                    - FOKUS PENILAIAN UTAMA: ${fokusUtama}
                    
                    ----------------------------------------
                    Teks Karangan Siswa yang Harus Dinilai:
                    """
                    ${tulisan_siswa}
                    """
                    ----------------------------------------

                    ATURAN KETAT ARRAY ASPEK:
                    Perhatikan fokus penilaian utama di atas. Jika user meminta beberapa fokus (misal: "isi, struktur, ejaan"), maka di dalam array "aspek" Anda WAJIB mengeluarkan jumlah objek yang sama persis sesuai fokus yang diminta (1 objek untuk 'isi', 1 objek untuk 'struktur', dst). Jangan kurangi dan jangan tambahkan aspek di luar itu!

                    Evaluasilah karangan di atas dan WAJIB kembalikan respon dalam format JSON murni dengan struktur PERSIS seperti berikut:
                    {
                        "skor_total": 85,
                        "aspek": [
                            {
                                "nama": "Nama Aspek (Isi sesuai aspek yang sedang dinilai, misal: Isi / Struktur / Ejaan)",
                                "skor": 80,
                                "komentar": "Ulasan detail bagian teks siswa yang berkaitan dengan aspek ini",
                                "saran": "Langkah konkret perbaikan khusus untuk aspek ini"
                            }
                        ],
                        "ringkasan": "Kesimpulan umum performa tulisan siswa dan kalimat motivasi penutup."
                    }`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // 6. --- STRUKTUR DATA UNTUK DATABASE & RESPONS ---
        // Kita bersihkan array aspek: hapus nama_siswa, lalu paksa skor menjadi format desimal (ex: 80.00)
        const aspekClean = aiResponse.aspek.map(item => ({
            nama_aspek: item.nama, 
            skor: Number(item.skor).toFixed(2), // <-- Ubah skor aspek jadi format desimal (ex: "80.00")
            komentar: item.komentar,                  
            saran: item.saran                         
        }));

        // Susun objek feedback_json yang super bersih dan urut sesuai keinginanmu
        const feedbackJsonSesuaiSchema = {
            skor_total: Number(aiResponse.skor_total).toFixed(2), // <-- Ubah skor total jadi format desimal (ex: "78.00")
            aspek: aspekClean,
            ringkasan: aiResponse.ringkasan
        };

        // Memecah string "isi, struktur, ejaan" menjadi array untuk kolom TEXT[] PostgreSQL
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
            skor_keseluruhan: Number(aiResponse.skor_total).toFixed(2) 
        };

        // Simpan ke PostgreSQL via Model
        const savedFeedback = await WritingModel.saveFeedback(feedbackData);

        // Racik ulang data akhir bersih yang dipotong pas sampai feedback_json
        const responseDataClean = {
            id: savedFeedback.id,
            request_id: savedFeedback.request_id,
            tulisan_siswa: savedFeedback.tulisan_siswa,
            jenis_tulisan: savedFeedback.jenis_tulisan,
            tingkat_kelas: savedFeedback.tingkat_kelas,
            fokus_feedback: savedFeedback.fokus_feedback,
            feedback_json: feedbackJsonSesuaiSchema // Berhenti pas sampai sini
        };

        // 7. --- UPDATE STATUS LOG REQUEST ---
        await WritingModel.updateRequestStatus(requestId, 'completed', responseDataClean);

        // 8. --- RETURN RESPONSE FINAL ---
        return res.status(201).json({
            success: true,
            message: "Umpan balik karangan siswa sukses dibuat menggunakan Llama 3.3.",
            data: responseDataClean,
            meta: {}
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
            data: null, // Sesuai aturan penanganan error kaku dosen
            meta: {}    // Sesuai aturan penanganan error kaku dosen
        });
    }
};

module.exports = { generateWritingFeedback };