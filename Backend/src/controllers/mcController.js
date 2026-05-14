const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk'); // Import Groq
const MCModel = require('../models/mcModel');

// Gunakan API Key Groq kamu
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateMC = async (req, res) => {
    const requestId = uuidv4();
    const mcId = uuidv4();

    try {
        const {
            topic, grade, count, optionsCount,
            standards, difficulty, subject, userId
        } = req.body;

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // 1. Log Request ke Database
        await MCModel.createRequest(requestId, finalUserId, {
            topic, grade, count, optionsCount, standards
        });

        // 2. Panggil Groq (Menggunakan model pengganti yang didukung)
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah asisten pembuat soal ujian yang ahli. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun."
                },
                {
                    role: "user",
                    content: `Buatlah ${count} soal pilihan ganda tentang ${topic}.
                    Kurikulum: ${standards === 'K13' ? 'K13' : 'Kurikulum Merdeka'} Indonesia.
                    Tingkat: ${grade} (${subject}).
                    Kesulitan: ${difficulty}.
                    Jumlah Opsi: ${optionsCount || 4}.

                    Struktur JSON yang wajib diikuti:
                    {
                        "kompetensi_dasar": "Bunyi KD atau Capaian Pembelajaran yang relevan",
                        "soal_list": [
                            {
                                "no": 1,
                                "pertanyaan": "...",
                                "pilihan": ["...", "...", "...", "..."],
                                "kunci": "A"
                            }
                        ]
                    }`
                }
            ],
            // GANTI KE MODEL INI (llama-3.3-70b-versatile)
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // 3. Simpan ke Database
        const assessmentData = {
            id: mcId,
            request_id: requestId,        // Harus request_id (pakai underscore)
            mata_pelajaran: subject,      // Harus mata_pelajaran
            tingkat_kelas: grade,         // Harus tingkat_kelas
            topik: topic,                 // Harus topik
            jumlah_soal: aiResponse.soal_list.length, // Harus jumlah_soal
            tingkat_kesulitan: difficulty,
            questions_json: aiResponse.soal_list,
            kompetensi_dasar: aiResponse.kompetensi_dasar
        };

        // Panggil fungsi model yang baru saja kamu ubah
        const savedAssessment = await MCModel.saveAssessment(assessmentData);

        // 4. Update Status Request
        await MCModel.updateRequestStatus(requestId, 'completed', savedAssessment);

        res.status(201).json({
            success: true,
            message: "Gaspol! Soal Berhasil dibuat dengan Groq Llama 3.1.",
            data: savedAssessment
        });

    } catch (error) {
        console.error("Error Detail:", error);

        try {
            await MCModel.updateRequestStatus(requestId, 'failed', { error: error.message });
        } catch (dbErr) {
            console.error("Gagal update status fail ke DB");
        }

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada proses AI atau Database",
            error: error.message
        });
    }
};

module.exports = { generateMC };