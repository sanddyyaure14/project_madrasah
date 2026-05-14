const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const PresentationModel = require('../../models/content/presentationModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generatePresentation = async (req, res) => {
    const requestId = uuidv4();
    const presentationId = uuidv4();

    try {
        const {
            topik, jumlah_slide, tujuan, audiens, include_catatan, userId
        } = req.body;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        // 1. Log Request ke Database
        await PresentationModel.createRequest(requestId, finalUserId, {
            topik, jumlah_slide, tujuan, audiens, include_catatan
        });

        // 2. Panggil Groq (Menggunakan model llama-3.3-70b-versatile)
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah asisten pembuat materi presentasi yang ahli. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun."
                },
                {
                    role: "user",
                    content: `Buatlah presentasi sebanyak ${jumlah_slide} slide tentang topik: ${topik}.
                    Tujuan presentasi: ${tujuan || 'Edukasi / Penjelasan umum'}.
                    Target Audiens: ${audiens || 'Umum'}.
                    Sertakan catatan presenter: ${include_catatan ? 'Ya' : 'Tidak'}.

                    Struktur JSON yang wajib diikuti:
                    {
                        "slides_json": [
                            {
                                "slide_number": 1,
                                "title": "Judul Slide",
                                "content": ["Poin 1", "Poin 2", "Poin 3"]${include_catatan ? ',\n                                "catatan": "Catatan untuk presenter saat menjelaskan slide ini"' : ''}
                            }
                        ]
                    }`
                }
            ],
            model: "llama-3.3-70b-versatile",
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

        const savedPresentation = await PresentationModel.savePresentation(presentationData);

        // 4. Update Status Request
        await PresentationModel.updateRequestStatus(requestId, 'completed', savedPresentation);

        res.status(201).json({
            success: true,
            message: "Presentasi berhasil dibuat dengan Groq.",
            data: savedPresentation
        });

    } catch (error) {
        console.error("Error Detail:", error);

        try {
            await PresentationModel.updateRequestStatus(requestId, 'failed', { error: error.message });
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

module.exports = { generatePresentation };
