const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, BorderStyle } = require('docx');
const fs = require('fs');

/**
 * Generate DOCX untuk Syllabus
 */
const generateSyllabusDocx = async (syllabusData, outputPath) => {
    try {
        const sections = [];

        // Header Section
        const headerParagraphs = [
            new Paragraph({
                text: 'SILABUS',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: syllabusData.silabus_json.judul_silabus || 'Silabus Pembelajaran',
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Mata Pelajaran: ', bold: true }),
                    new TextRun(syllabusData.mata_pelajaran)
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Kurikulum: ', bold: true }),
                    new TextRun(syllabusData.kurikulum)
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Jenjang: ', bold: true }),
                    new TextRun(syllabusData.jenjang)
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Kelas: ', bold: true }),
                    new TextRun(syllabusData.tingkat_kelas)
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Semester: ', bold: true }),
                    new TextRun(syllabusData.semester)
                ],
                spacing: { after: 100 }
            })
        ];

        if (syllabusData.tahun_ajaran) {
            headerParagraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Tahun Ajaran: ', bold: true }),
                        new TextRun(syllabusData.tahun_ajaran)
                    ],
                    spacing: { after: 300 }
                })
            );
        }

        sections.push(...headerParagraphs);

        // Kompetensi Inti
        if (syllabusData.silabus_json.kompetensi_inti && syllabusData.silabus_json.kompetensi_inti.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'Kompetensi Inti',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 200 }
                })
            );

            syllabusData.silabus_json.kompetensi_inti.forEach((ki, index) => {
                sections.push(
                    new Paragraph({
                        text: `${index + 1}. ${ki}`,
                        spacing: { after: 100 }
                    })
                );
            });
        }

        // Tabel Silabus
        if (syllabusData.silabus_json.tabel_silabus && syllabusData.silabus_json.tabel_silabus.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'Rencana Pembelajaran',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 }
                })
            );

            const tableRows = [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: 'Minggu', bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'Kompetensi Dasar', bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'Materi Pokok', bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'Kegiatan', bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'Penilaian', bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'Waktu', bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'Sumber', bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } })
                    ]
                })
            ];

            syllabusData.silabus_json.tabel_silabus.forEach((item) => {
                tableRows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(String(item.minggu_ke || '-'))] }),
                            new TableCell({ children: [new Paragraph(item.kompetensi_dasar || '-')] }),
                            new TableCell({ children: [new Paragraph(item.materi_pokok || '-')] }),
                            new TableCell({ children: [new Paragraph(item.kegiatan_pembelajaran || '-')] }),
                            new TableCell({ children: [new Paragraph(item.penilaian || '-')] }),
                            new TableCell({ children: [new Paragraph(item.alokasi_waktu || '-')] }),
                            new TableCell({ children: [new Paragraph(item.sumber_belajar || '-')] })
                        ]
                    })
                );
            });

            const table = new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE }
            });

            sections.push(table);
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: sections
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    } catch (error) {
        throw error;
    }
};

/**
 * Generate DOCX untuk Unit Plan
 */
const generateUnitPlanDocx = async (unitPlanData, outputPath) => {
    try {
        const sections = [];

        // Header
        sections.push(
            new Paragraph({
                text: 'MODUL AJAR / RPP',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: unitPlanData.judul_unit || 'Rencana Pembelajaran',
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );

        // Informasi Umum
        const infoUmum = unitPlanData.unit_plan_json.informasi_umum || {};
        
        sections.push(
            new Paragraph({
                text: 'INFORMASI UMUM',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Mata Pelajaran: ', bold: true }),
                    new TextRun(infoUmum.mata_pelajaran || unitPlanData.mata_pelajaran || '-')
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Kelas: ', bold: true }),
                    new TextRun(infoUmum.kelas || unitPlanData.tingkat_kelas || '-')
                ],
                spacing: { after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Alokasi Waktu: ', bold: true }),
                    new TextRun(infoUmum.alokasi_waktu || `${unitPlanData.jumlah_pertemuan} Pertemuan`)
                ],
                spacing: { after: 100 }
            })
        );

        if (infoUmum.kompetensi_awal && infoUmum.kompetensi_awal.length > 0) {
            sections.push(
                new Paragraph({
                    children: [new TextRun({ text: 'Kompetensi Awal:', bold: true })],
                    spacing: { before: 200, after: 100 }
                })
            );
            infoUmum.kompetensi_awal.forEach(item => {
                sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 50 } }));
            });
        }

        if (infoUmum.profil_pelajar_pancasila && infoUmum.profil_pelajar_pancasila.length > 0) {
            sections.push(
                new Paragraph({
                    children: [new TextRun({ text: 'Profil Pelajar Pancasila:', bold: true })],
                    spacing: { before: 200, after: 100 }
                })
            );
            infoUmum.profil_pelajar_pancasila.forEach(item => {
                sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 50 } }));
            });
        }

        // Komponen Inti
        const komponenInti = unitPlanData.unit_plan_json.komponen_inti || {};

        sections.push(
            new Paragraph({
                text: 'KOMPONEN INTI',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );

        // Tujuan Pembelajaran
        if (komponenInti.tujuan_pembelajaran && komponenInti.tujuan_pembelajaran.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'Tujuan Pembelajaran',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                })
            );
            komponenInti.tujuan_pembelajaran.forEach((item, index) => {
                sections.push(new Paragraph({ text: `${index + 1}. ${item}`, spacing: { after: 50 } }));
            });
        }

        // Pemahaman Bermakna
        if (komponenInti.pemahaman_bermakna) {
            sections.push(
                new Paragraph({
                    text: 'Pemahaman Bermakna',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    text: komponenInti.pemahaman_bermakna,
                    spacing: { after: 200 }
                })
            );
        }

        // Pertanyaan Pemantik
        if (komponenInti.pertanyaan_pemantik && komponenInti.pertanyaan_pemantik.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'Pertanyaan Pemantik',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                })
            );
            komponenInti.pertanyaan_pemantik.forEach(item => {
                sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 50 } }));
            });
        }

        // Kegiatan Pembelajaran
        if (komponenInti.kegiatan_pembelajaran && komponenInti.kegiatan_pembelajaran.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'Kegiatan Pembelajaran',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 300, after: 200 }
                })
            );

            komponenInti.kegiatan_pembelajaran.forEach((pertemuan) => {
                sections.push(
                    new Paragraph({
                        text: `Pertemuan ${pertemuan.pertemuan_ke}`,
                        bold: true,
                        spacing: { before: 200, after: 100 }
                    })
                );

                if (pertemuan.pendahuluan && pertemuan.pendahuluan.length > 0) {
                    sections.push(new Paragraph({ text: 'Pendahuluan:', bold: true, spacing: { after: 50 } }));
                    pertemuan.pendahuluan.forEach(item => {
                        sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 30 } }));
                    });
                }

                if (pertemuan.kegiatan_inti && pertemuan.kegiatan_inti.length > 0) {
                    sections.push(new Paragraph({ text: 'Kegiatan Inti:', bold: true, spacing: { before: 100, after: 50 } }));
                    pertemuan.kegiatan_inti.forEach(item => {
                        sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 30 } }));
                    });
                }

                if (pertemuan.penutup && pertemuan.penutup.length > 0) {
                    sections.push(new Paragraph({ text: 'Penutup:', bold: true, spacing: { before: 100, after: 50 } }));
                    pertemuan.penutup.forEach(item => {
                        sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 30 } }));
                    });
                }
            });
        }

        // Asesmen
        if (komponenInti.asesmen && komponenInti.asesmen.length > 0) {
            sections.push(
                new Paragraph({
                    text: 'Asesmen',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 300, after: 100 }
                })
            );
            komponenInti.asesmen.forEach(item => {
                sections.push(new Paragraph({ text: `• ${item}`, spacing: { after: 50 } }));
            });
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: sections
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    } catch (error) {
        throw error;
    }
};

/**
 * Generate DOCX untuk Academic Content
 */
const generateAcademicContentDocx = async (contentData, outputPath) => {
    try {
        const sections = [];
        const json = contentData.content_json || {};

        sections.push(
            new Paragraph({
                text: 'KONTEN AKADEMIK',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: json.judul || contentData.topik || 'Konten Akademik',
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Mata Pelajaran: ', bold: true }),
                    new TextRun(contentData.mata_pelajaran || 'Umum')
                ], spacing: { after: 80 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Kelas: ', bold: true }),
                    new TextRun(contentData.tingkat_kelas || '-')
                ], spacing: { after: 80 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Jenis Konten: ', bold: true }),
                    new TextRun(contentData.jenis_konten || '-')
                ], spacing: { after: 200 }
            })
        );

        // Ringkasan
        if (json.ringkasan) {
            sections.push(
                new Paragraph({ text: 'Ringkasan', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
                new Paragraph({ text: json.ringkasan, spacing: { after: 200 } })
            );
        }

        // Pendahuluan / Konten (penjelasan)
        if (json.pendahuluan) {
            sections.push(
                new Paragraph({ text: 'Pendahuluan', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                new Paragraph({ text: json.pendahuluan, spacing: { after: 150 } })
            );
        }
        if (json.konten) {
            sections.push(
                new Paragraph({ text: 'Penjelasan Lengkap', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                ...json.konten.split(/\n\n|\n/).filter(p => p.trim()).map(p =>
                    new Paragraph({ text: p.trim(), spacing: { after: 100 } })
                )
            );
        }
        if (json.contoh_penerapan) {
            sections.push(
                new Paragraph({ text: 'Contoh Penerapan', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                new Paragraph({ text: json.contoh_penerapan, spacing: { after: 150 } })
            );
        }

        // Poin Penting (ringkasan)
        if (json.poin_penting && json.poin_penting.length > 0) {
            sections.push(new Paragraph({ text: 'Poin-Poin Penting', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
            json.poin_penting.forEach((poin, i) => {
                sections.push(
                    new Paragraph({ children: [new TextRun({ text: `${i+1}. ${poin.subjudul}`, bold: true })], spacing: { before: 100, after: 50 } }),
                    new Paragraph({ text: poin.isi, spacing: { after: 100 } })
                );
            });
        }
        if (json.kesimpulan) {
            sections.push(
                new Paragraph({ text: 'Kesimpulan', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                new Paragraph({ text: json.kesimpulan, spacing: { after: 150 } })
            );
        }

        // Soal (contoh_soal)
        if (json.soal && json.soal.length > 0) {
            sections.push(new Paragraph({ text: 'Contoh Soal', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }));
            json.soal.forEach((soal, i) => {
                sections.push(new Paragraph({ children: [new TextRun({ text: `${soal.nomor || i+1}. ${soal.pertanyaan}`, bold: true })], spacing: { before: 150, after: 80 } }));
                if (soal.pilihan) {
                    Object.entries(soal.pilihan).forEach(([k, v]) => {
                        sections.push(new Paragraph({ text: `   ${k}. ${v}`, spacing: { after: 40 } }));
                    });
                }
                if (soal.jawaban) {
                    sections.push(new Paragraph({ children: [new TextRun({ text: `Jawaban: ${soal.jawaban}`, bold: true, color: '006747' })], spacing: { after: 40 } }));
                }
                if (soal.pembahasan) {
                    sections.push(new Paragraph({ text: `Pembahasan: ${soal.pembahasan}`, spacing: { after: 100 } }));
                }
            });
        }

        // Glosarium (kamus)
        if (json.istilah && json.istilah.length > 0) {
            sections.push(new Paragraph({ text: 'Glosarium', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }));
            json.istilah.forEach(item => {
                sections.push(
                    new Paragraph({ children: [new TextRun({ text: item.kata, bold: true })], spacing: { before: 100, after: 40 } }),
                    new Paragraph({ text: item.definisi, spacing: { after: 40 } }),
                    ...(item.contoh ? [new Paragraph({ children: [new TextRun({ text: `Contoh: ${item.contoh}`, italics: true, color: '6b7280' })], spacing: { after: 80 } })] : [])
                );
            });
        }

        // Kata Kunci
        if (json.kata_kunci && json.kata_kunci.length > 0) {
            sections.push(
                new Paragraph({ text: 'Kata Kunci', heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 100 } }),
                new Paragraph({ text: json.kata_kunci.join(' · '), spacing: { after: 100 } })
            );
        }

        const doc = new Document({ sections: [{ properties: {}, children: sections }] });
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateSyllabusDocx,
    generateUnitPlanDocx,
    generateAcademicContentDocx
};
