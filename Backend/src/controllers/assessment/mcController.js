const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk'); // Import Groq
const MCModel = require('../../models/assessment/mcModel');

// Gunakan API Key Groq kamu
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateMC = async (req, res) => {
    const requestId = uuidv4();
    const mcId = uuidv4();

    try {
        const {
        mata_pelajaran,
        tingkat_kelas: input_kelas,
        topik,
        jumlah_soal,
        tingkat_kesulitan,
        opsi_pilihan, 
        standards,    
        userId
    } = req.body;

    let tingkat_kelas = "";
        const angkaKelas = parseInt(input_kelas); // Konversi ke angka biasa buat jaga-jaga kalau dikirim string

        if (angkaKelas >= 7 && angkaKelas <= 9) {
            tingkat_kelas = `${angkaKelas} SMP`; // Hasilnya: "7 SMP", "8 SMP", "9 SMP"
        } else if (angkaKelas >= 10 && angkaKelas <= 12) {
            tingkat_kelas = `${angkaKelas} SMA`; // Hasilnya: "10 SMA", "11 SMA", "12 SMA"
        } else {
            // Jika teman frontend mengirim angka di luar 7-12 (misal: kelas 1 atau 6)
            return res.status(400).json({
                success: false,
                message: `Tingkat kelas '${input_kelas}' tidak valid. Backend hanya menerima angka kelas 7 sampai 12.`
            });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // 1. Log Request ke Database
        await MCModel.createRequest(requestId, finalUserId, {
        mata_pelajaran,
        tingkat_kelas,
        topik,
        jumlah_soal,
        tingkat_kesulitan,
        opsi_pilihan,
        standards
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
                    content: `Buatlah ${jumlah_soal} soal pilihan ganda tentang ${topik}.
                    Kurikulum: ${standards === 'K13' ? 'K13' : 'Kurikulum Merdeka'} Indonesia.
                    Tingkat: ${tingkat_kelas} (${mata_pelajaran}).
                    Kesulitan: ${tingkat_kesulitan}.
                    Jumlah Opsi: ${opsi_pilihan || 4}.

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
            mata_pelajaran,      // Harus mata_pelajaran
            tingkat_kelas,         // Harus tingkat_kelas
            topik,                 // Harus topik
            jumlah_soal: aiResponse.soal_list.length, // Harus jumlah_soal
            tingkat_kesulitan,
            questions_json: aiResponse.soal_list,
            kompetensi_dasar: aiResponse.kompetensi_dasar
        };

        // Panggil fungsi model yang baru saja kamu ubah
        const savedAssessment = await MCModel.saveAssessment(assessmentData);

        // 4. Update Status Request
        await MCModel.updateRequestStatus(requestId, 'completed', savedAssessment);

        res.status(201).json({
            success: true,
            message: "Haris Berhasil buat dengan Groq Llama 3.3.",
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