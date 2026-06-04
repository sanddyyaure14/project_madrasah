const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const MCModel = require('../../models/assessment/mcModel');
const PDFDocument = require('pdfkit');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateMC = async (req, res) => {
    const requestId = uuidv4();
    const mcId = uuidv4();

    // ⏱️ MULAI HITUNG WAKTU PROSES (Stopwatch Start)
    const startTime = performance.now();

    try {
        // 1. Ambil data dari req.body
        const {
            mata_pelajaran,
            tingkat_kelas: input_kelas,
            topik,
            jumlah_soal,
            tingkat_kesulitan: input_kesulitan,
            include_kunci, 
            kompetensi_dasar
        } = req.body;

        // userId diambil dari JWT token (req.user disuntikkan oleh authMiddleware)
        const finalUserId = req.user.id;
        // 🌟 Normalisasi total tingkat kesulitan menjadi huruf kecil murni (ENUM aman)
        const tingkat_kesulitan = input_kesulitan ? input_kesulitan.trim().toLowerCase() : "sedang";

        // Validasi dan Normalisasi Tingkat Kelas
        let tingkat_kelas = "";
        let angkaKelas = parseInt(input_kelas);
        
        if (isNaN(angkaKelas) && input_kelas) {
            const romawi = input_kelas.toUpperCase();
            if (romawi === "VII") angkaKelas = 7;
            else if (romawi === "VIII") angkaKelas = 8;
            else if (romawi === "IX") angkaKelas = 9;
            else if (romawi === "X") angkaKelas = 10;
            else if (romawi === "XI") angkaKelas = 11;
            else if (romawi === "XII") angkaKelas = 12;
        }

        if (angkaKelas >= 7 && angkaKelas <= 9) {
             tingkat_kelas = `${angkaKelas} SMP`;
        } else if (angkaKelas >= 10 && angkaKelas <= 12) {
             tingkat_kelas = `${angkaKelas} SMA`;
        } else {
            return res.status(400).json({
                success: false,
                message: `Tingkat kelas '${input_kelas}' tidak valid.`,
                data: null,
                meta: {}
            });
        }

        const jumlahOpsi = tingkat_kelas.includes('SMA') ? 5 : 4;

        // 🌟 PENENTUAN BOOELAN SAKELAR SECARA SANGAT KETAT
        const isIncludeKunci = include_kunci === false ? false : true;

        const inputDataForLog = {
            mata_pelajaran,
            tingkat_kelas,
            topik,
            jumlah_soal,
            tingkat_kesulitan,
            include_kunci: isIncludeKunci,
            standards: kompetensi_dasar 
        };

        // LANGKAH A: Tulis Log Request Awal (Pending)
        await MCModel.createRequest(requestId, finalUserId, inputDataForLog);

        // LANGKAH B: Panggil Cek Kuota (FOR UPDATE)
        const quota = await MCModel.getUserQuota(finalUserId);
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
            await MCModel.updateRequestStatus(requestId, 'failed', { 
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
        await MCModel.updateRequestStatus(requestId, 'processing');

        // 2. Definisi Prompt Teks untuk LLM (Kondisional)
        const systemPrompt = "Anda adalah asisten pembuat soal ujian madrasah yang ahli. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun di luar objek JSON.";
        
        const aturanKunciPrompt = isIncludeKunci 
            ? 'Tentukan 1 jawaban benar di dalam array "pilihan_raw" lalu beri tanda " (KUNCI)" tepat di belakang teksnya. Contoh: "Bersih atau suci (KUNCI)".'
            : 'Jangan memberikan tanda " (KUNCI)" pada pilihan jawaban mana pun. Buat seluruh opsi jawaban murni teks jawaban biasa.';

        const userPrompt = `Buatlah ${jumlah_soal} soal pilihan ganda kontekstual berbasis materi madrasah tentang ${topik}.
                    
                    ACUAN KOMPETENSI DASAR (INPUT GURU):
                    ${kompetensi_dasar || 'Gunakan materi standar nasional madrasah'}

                    SPESIFIKASI SOAL:
                    - Tingkat: ${tingkat_kelas} (${mata_pelajaran}).
                    - Kesulitan: ${tingkat_kesulitan}.
                    - Jumlah Opsi Pilihan: ${jumlahOpsi}.

                    Struktur JSON awal yang wajib Anda keluarkan:
                    {
                        "questions": [
                            {
                                "no": 1,
                                "soal": "Teks pertanyaan soal...",
                                "pilihan_raw": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
                                "pembahasan": "${isIncludeKunci ? 'Penjelasan mengapa benar.' : ''}"
                            }
                        ]
                    }

                    ATURAN SANGAT KETAT KONTEN:
                    1. Jika mata pelajaran eksak (Matematika/Fisika): Pastikan hitungan menghasilkan jawaban BILANGAN BULAT.
                    2. ${aturanKunciPrompt}`;

        // Kirim ke Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const promptUsedCombined = `System: ${systemPrompt}\nUser: ${userPrompt}`;
        const modelUsed = chatCompletion.model || "llama-3.3-70b-versatile";
        const tokenUsage = {
            prompt_tokens: chatCompletion.usage?.prompt_tokens || 0,
            completion_tokens: chatCompletion.usage?.completion_tokens || 0,
            total_tokens: chatCompletion.usage?.total_tokens || 0
        };

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
        const indexToLetter = ["A", "B", "C", "D", "E"];

        if (!aiResponse.questions || !Array.isArray(aiResponse.questions)) {
            throw new Error("Format respons JSON dari AI tidak valid.");
        }

        // 3. Transformasi Array ke Object & Filter Sakelar "Include Kunci"
        const formattedQuestions = aiResponse.questions.map((q) => {
            let hurufKunci = isIncludeKunci ? "A" : "";
            let objekPilihan = {};
            const mentahPilihan = q.pilihan_raw || [];

            mentahPilihan.forEach((pil, index) => {
                if (index < jumlahOpsi) {
                    const huruf = indexToLetter[index];
                    
                    if (typeof pil === 'string' && pil.includes("(KUNCI)") && isIncludeKunci) {
                        hurufKunci = huruf;
                        objekPilihan[huruf] = pil.replace(" (KUNCI)", "").trim();
                    } else {
                        objekPilihan[huruf] = String(pil).replace(" (KUNCI)", "").trim();
                    }
                }
            });

            // 🌟 PERBAIKAN UTAMA: Bungkus objek secara dinamis
            const itemSoal = {
                no: q.no,
                soal: q.soal,
                pilihan: objekPilihan
            };

            // JIKA TRUE, BARU KITA ATUR/MASUKKAN KEY KUNCI DAN PEMBAHASAN
            if (isIncludeKunci) {
                itemSoal.kunci = hurufKunci;
                itemSoal.pembahasan = q.pembahasan || "Gunakan prinsip materi untuk menyelesaikan soal ini.";
            }

            return itemSoal;
        });

        // Susun objek data penampung database
        const assessmentData = {
            id: mcId,
            request_id: requestId,        
            mata_pelajaran,      
            tingkat_kelas,        
            topik,                
            jumlah_soal: formattedQuestions.length,
            tingkat_kesulitan, 
            include_kunci: isIncludeKunci, // Mengirimkan boolean asli (false/true)
            questions_json: formattedQuestions, 
            kompetensi_dasar: kompetensi_dasar || "" 
        };

        // Simpan ke DB sekaligus memotong kuota
        const savedAssessment = await MCModel.saveAssessmentAndDeductQuota(assessmentData, finalUserId);

        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);
        const updatedQuota = await MCModel.getUserQuota(finalUserId);

        // Update status log akhir (completed)
        await MCModel.updateRequestStatus(requestId, 'completed', {
            output_data: savedAssessment,
            prompt_used: promptUsedCombined,
            llm_model_used: modelUsed,
            token_usage: tokenUsage,
            processing_time_ms: processingTimeMs
        });

        // 4. Return Response bersih ke Postman
        res.status(201).json({
            success: true,
            message: "Haris Berhasil buat dengan Groq Llama 3.3.",
            request_id: requestId,
            mc_id: mcId,
            status: "completed",
            data: {
                questions: formattedQuestions
            },
            meta: {
                quota_info: {
                    plan_type: updatedQuota.plan_type,
                    monthly_limit: updatedQuota.monthly_limit,
                    used_this_month: updatedQuota.used_this_month,
                    remaining_quota: updatedQuota.monthly_limit - updatedQuota.used_this_month
                }
            }
        });

    } catch (error) {
        console.error("Error Detail:", error);
        const endTime = performance.now();
        const processingTimeMs = Math.round(endTime - startTime);

        try {
            await MCModel.updateRequestStatus(requestId, 'failed', { 
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

// =========================================================================
// FUNGSI DI BAWAH INI SAMA SEKALI TIDAK DIUBAH (100% Sesuai Request Bawaan)
// =========================================================================

const updateMC = async (req, res) => {
    try {
        const { id } = req.params; 
        const { questions, kompetensi_dasar, topik, tingkat_kesulitan } = req.body; 

        if (!id || !questions) {
            return res.status(400).json({
                success: false,
                message: "ID Assessment dan data questions wajib disertakan.",
                data: null,
                meta: {}
            });
        }

        const existingAssessment = await MCModel.getAssessmentById(id, req.user.id);

        if (!existingAssessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan atau bukan milik Anda.`,
                data: null,
                meta: {}
            });
        }

        const updatedData = {
            id,
            request_id: existingAssessment.request_id,
            mata_pelajaran: existingAssessment.mata_pelajaran,
            tingkat_kelas: existingAssessment.tingkat_kelas,
            include_kunci: existingAssessment.include_kunci, 
            jumlah_soal: questions.length, 
            topik: topik || existingAssessment.topik,
            tingkat_kesulitan: tingkat_kesulitan || existingAssessment.tingkat_kesulitan,
            questions_json: questions, 
            kompetensi_dasar: kompetensi_dasar !== undefined ? kompetensi_dasar : existingAssessment.kompetensi_dasar
        };

        const result = await MCModel.saveAssessmentAndDeductQuota(updatedData, null); 

        res.status(200).json({
            success: true,
            message: "Aksi EDIT Sukses! Perubahan soal berhasil disimpan via PUT.",
            data: result,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat PUT Assessment:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengupdate data assessment.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

const getMCById = async (req, res) => {
    try {
        const { id } = req.params; 
        const assessment = await MCModel.getAssessmentById(id, req.user.id); 

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan atau bukan milik Anda.`,
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Haris Berhasil mengambil data assessment untuk preview/edit.",
            data: assessment,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat GET Assessment:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data assessment.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

const deleteMC = async (req, res) => {
    try {
        const { id } = req.params; 

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID Assessment wajib disertakan.",
                data: null,
                meta: {}
            });
        }

        const existingAssessment = await MCModel.getAssessmentById(id, req.user.id);
        if (!existingAssessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan atau bukan milik Anda.`,
                data: null,
                meta: {}
            });
        }

        await MCModel.deleteAssessment(id, req.user.id);

        res.status(200).json({
            success: true,
            message: `Haris Berhasil menghapus data assessment dengan ID ${id}.`,
            data: null,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat DELETE Assessment:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus data assessment.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

const exportToPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await MCModel.getAssessmentById(id, req.user.id);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan atau bukan milik Anda.`,
                data: null,
                meta: {}
            });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Soal_${assessment.topik.replace(/\s+/g, '_')}.pdf`);

        doc.pipe(res);

        doc.fontSize(16).text(`KUMPULAN SOAL UJIAN MADRASAH`, { align: 'center' });
        doc.fontSize(12).text(`Mata Pelajaran: ${assessment.mata_pelajaran} | Kelas: ${assessment.tingkat_kelas}`, { align: 'center' });
        doc.text(`Topik: ${assessment.topik} | Kesulitan: ${assessment.tingkat_kesulitan}`, { align: 'center' });
        doc.moveDown(2);

        const daftarSoal = assessment.questions_json || [];

        daftarSoal.forEach((q) => {
            doc.fontSize(11).text(`${q.no}. ${q.soal}`, { align: 'justify' });
            doc.moveDown(0.5);

            if (q.pilihan) {
                Object.entries(q.pilihan).forEach(([huruf, teksOpsi]) => {
                    doc.text(`   ${huruf}. ${teksOpsi}`);
                });
            }

            if (assessment.include_kunci && q.kunci) {
                doc.moveDown(0.5);
                doc.fillColor('green').text(`   * Kunci Jawaban: ${q.kunci}`, { bold: true });
                doc.fillColor('black').text(`   * Pembahasan: ${q.pembahasan || '-'}`);
            }

            doc.moveDown(1.5);
        });

        doc.end();

    } catch (error) {
        console.error("Error saat Cetak PDF:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat file cetak PDF di backend.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

const getAllMC = async (req, res) => {
    try {
        const userId = req.user.id;
        const assessments = await MCModel.getAllAssessment(userId); 

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil semua data riwayat assessment soal pilihan ganda.",
            data: assessments,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat GET ALL Assessment MC:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil semua data assessment pilihan ganda.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

module.exports = { generateMC, updateMC, getMCById, deleteMC, exportToPDF, getAllMC };
