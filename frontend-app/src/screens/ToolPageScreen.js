import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Switch, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { findTool } from '../lib/tools';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

// ─── Download file dengan token (untuk PDF/Excel) ──────────────────────────
async function downloadWithToken(url, token, filename) {
  try {
    const localUri = FileSystem.documentDirectory + filename;
    const result = await FileSystem.downloadAsync(url, localUri, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.status !== 200) {
      Alert.alert('Gagal', 'Server menolak permintaan download.');
      return;
    }
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType: filename.endsWith('.pdf')
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Buka ${filename}`,
      });
    } else {
      Alert.alert('Selesai', `File tersimpan di: ${result.uri}`);
    }
  } catch (e) {
    Alert.alert('Error', 'Gagal download file: ' + e.message);
  }
}

const ICON_MAP = {
  'clipboard-list': 'clipboard',
  'layers': 'layers',
  'file-edit': 'create',
  'file-text': 'document-text',
  'presentation': 'easel',
  'book-marked': 'bookmark',
  'book-open': 'book',
  'graduation-cap': 'school',
};

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TextF({ value, onChangeText, placeholder, multiline }) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.mutedLight}
      multiline={multiline}
    />
  );
}

function SelectF({ options, value, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }} contentContainerStyle={{ gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.selectOpt, value === opt && styles.selectOptActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.selectOptText, value === opt && styles.selectOptTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function GenerateBtn({ loading, onPress }) {
  return (
    <TouchableOpacity style={styles.generateBtn} onPress={onPress} disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.generateBtnText}>Generate</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function ResultBox({ text, onCopy }) {
  if (!text) return null;
  return (
    <View style={styles.result}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultLabel}>Hasil</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={onCopy}>
          <Ionicons name="copy" size={14} color={C.primary} />
          <Text style={styles.copyBtnText}>Salin</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.resultText}>{text}</Text>
    </View>
  );
}

const KELAS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const MAPEL = ['Fiqih', 'Akidah Akhlak', 'Al-Qur\'an Hadis', 'Bahasa Arab', 'SKI', 'Matematika', 'IPA Terpadu', 'Bahasa Indonesia'];
const KURIKULUM = ['Merdeka Belajar', 'Kurikulum 2013'];

function useTool(slug) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  async function generate(prompt) {
    setLoading(true);
    setResult('');
    // Simulate AI response with realistic mock data
    await new Promise(r => setTimeout(r, 1500));
    setResult(getMockResult(slug, prompt));
    setLoading(false);
  }

  return { loading, result, generate };
}

function getMockResult(slug, prompt) {
  const map = {
    'multiple-choice': `Soal Pilihan Ganda — ${prompt.mapel || 'Fiqih'} Kelas ${prompt.kelas || 'VII'}

1. Pengertian thaharah menurut istilah syar'i adalah...
   A. Bersih dari kotoran dan najis secara zahir
   B. Bersih secara lahir dan batin dari hadas dan najis ✓
   C. Mencuci tangan sebelum makan
   D. Mandi dengan air bersih

2. Berikut yang termasuk air yang suci dan menyucikan adalah...
   A. Air kopi        B. Air sungai ✓
   C. Air teh         D. Air bekas wudhu

3. Wudhu menjadi wajib ketika seseorang hendak...
   A. Tidur siang    B. Membaca Al-Qur'an
   C. Shalat ✓       D. Berpuasa

(dan seterusnya hingga ${prompt.jumlah || 10} soal...)`,

    'rubric': `Rubrik Penilaian — ${prompt.tugas || 'Presentasi Kelompok'}

Kriteria Penilaian:

1. KONTEN (40 poin)
   Sangat Baik (36-40): Materi akurat, lengkap, mendalam
   Baik (28-35): Materi akurat dan cukup lengkap
   Cukup (20-27): Materi sebagian besar akurat
   Perlu Perbaikan (<20): Banyak kesalahan faktual

2. PENYAMPAIAN (30 poin)
   Sangat Baik (27-30): Jelas, percaya diri, interaktif
   Baik (21-26): Jelas dan terstruktur
   Cukup (15-20): Dapat dipahami meski kurang lancar
   Perlu Perbaikan (<15): Sulit dipahami

3. KERJA SAMA TIM (30 poin)
   Sangat Baik (27-30): Semua anggota berkontribusi merata
   Baik (21-26): Sebagian besar anggota aktif
   Cukup (15-20): Ada beberapa anggota yang pasif
   Perlu Perbaikan (<15): Hanya 1-2 anggota yang bekerja`,

    'writing-feedback': `Umpan Balik Karangan Siswa

Kelebihan:
✅ Gagasan pokok jelas dan terarah
✅ Penggunaan kosakata beragam
✅ Paragraf pembuka menarik perhatian

Area Pengembangan:
📝 Koherensi antar paragraf perlu ditingkatkan — tambahkan kata transisi seperti "selain itu", "lebih lanjut"
📝 Kesimpulan terlalu singkat — kembangkan dengan 2-3 kalimat yang merangkum argumen utama
📝 Beberapa kalimat terlalu panjang — pecah menjadi kalimat yang lebih pendek untuk keterbacaan

Saran Spesifik:
• Paragraf 2: "...hal ini penting..." → jelaskan mengapa ini penting
• Paragraf 3: tambahkan contoh konkret untuk mendukung klaim

Nilai Sementara: 78/100 — Potensi bagus, perlu revisi minor.`,

    'worksheet': `LEMBAR KERJA SISWA (LKS)
Mata Pelajaran: ${prompt.mapel || 'Fiqih'}  |  Kelas: ${prompt.kelas || 'VII'}
Topik: ${prompt.topik || 'Thaharah'}  |  Alokasi Waktu: 40 menit

TUJUAN PEMBELAJARAN:
Setelah mengerjakan LKS ini, siswa dapat menjelaskan pengertian dan macam-macam thaharah.

BAGIAN A — PILIHAN GANDA (30 poin)
Pilihlah jawaban yang paling tepat!
1. Thaharah berasal dari bahasa Arab yang berarti...
   (a) Suci  (b) Bersih  (c) Indah  (d) Rapi

BAGIAN B — ISIAN SINGKAT (20 poin)
Isilah titik-titik berikut dengan jawaban yang tepat!
1. Air yang dapat digunakan untuk bersuci disebut ____
2. Wudhu menjadi batal karena ____

BAGIAN C — URAIAN (50 poin)
Jawablah pertanyaan berikut dengan lengkap!
1. Jelaskan perbedaan hadas kecil dan hadas besar! (20 poin)
2. Sebutkan 4 syarat sah wudhu beserta dalilnya! (30 poin)`,

    'syllabus': `SILABUS PEMBELAJARAN
Mata Pelajaran: ${prompt.mapel || 'Fiqih'}
Kelas/Semester: ${prompt.kelas || 'VII'} / Ganjil
Kurikulum: ${prompt.kurikulum || 'Merdeka Belajar'}

KD 3.1 Memahami ketentuan thaharah dalam Islam
KD 4.1 Mempraktikkan tata cara thaharah

PETA MATERI:
• Pertemuan 1-2: Pengertian dan urgensi thaharah
• Pertemuan 3-4: Macam-macam air dan hukumnya
• Pertemuan 5-6: Wudhu — syarat, rukun, sunnah
• Pertemuan 7-8: Tayamum — tata cara dan kondisi
• Pertemuan 9-10: Mandi wajib
• Pertemuan 11: Istinja dan adab buang hajat
• Pertemuan 12: Review dan penilaian akhir

PENILAIAN:
• Formatif: observasi praktik wudhu, kuis lisan
• Sumatif: ujian tertulis (40%) + praktik (60%)`,

    'unit-plan': `RENCANA PELAKSANAAN PEMBELAJARAN (RPP)
Kurikulum: ${prompt.kurikulum || 'Merdeka Belajar'}

Identitas:
• Mata Pelajaran : ${prompt.mapel || 'Fiqih'}
• Kelas/Semester : ${prompt.kelas || 'VII'} / Ganjil
• Alokasi Waktu  : 2 × 40 menit

Capaian Pembelajaran:
Peserta didik memahami dan dapat mempraktikkan thaharah dengan benar.

Tujuan Pembelajaran:
1. Menjelaskan pengertian thaharah
2. Membedakan hadas dan najis
3. Mempraktikkan wudhu sesuai sunnah

Kegiatan Pembelajaran:

PENDAHULUAN (10 menit)
• Salam dan doa pembuka
• Apersepsi: "Apa yang kalian lakukan sebelum shalat?"
• Menyampaikan tujuan pembelajaran

INTI (60 menit)
• Eksplorasi: video pendek tentang thaharah
• Diskusi kelompok: macam-macam air
• Demonstrasi: tata cara wudhu yang benar
• Latihan: siswa mempraktikkan wudhu bergantian

PENUTUP (10 menit)
• Refleksi dan kesimpulan
• Tugas: hafal niat wudhu
• Doa penutup`,

    'academic-content': `KONTEN AKADEMIK
Topik: ${prompt.topik || 'Thaharah dalam Islam'}
Jenis: ${prompt.jenis || 'Rangkuman Materi'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
THAHARAH: BERSUCI DALAM ISLAM
━━━━━━━━━━━━━━━━━━━━━━━━━━

Thaharah secara bahasa berarti bersih/suci. Menurut istilah syar'i, thaharah adalah mengangkat hadas dan menghilangkan najis dengan cara yang telah ditentukan syariat.

PEMBAGIAN THAHARAH:
1. Thaharah dari Hadas
   • Hadas Kecil → diatasi dengan wudhu atau tayamum
   • Hadas Besar → diatasi dengan mandi wajib atau tayamum

2. Thaharah dari Najis
   • Najis Mughallazhah (berat): air liur anjing — dicuci 7x + tanah
   • Najis Mutawassithah (sedang): darah, kotoran — dicuci sampai bersih
   • Najis Mukhaffafah (ringan): air seni bayi laki-laki — dipercikkan air`,
  };

  return map[slug] || 'Konten berhasil digenerate. Silakan salin dan gunakan sesuai kebutuhan Anda.';
}

// --- Tool Forms ---

function MultipleChoiceForm({ navigation }) {
  const { token } = useAuth();
  const [mapel, setMapel] = useState(MAPEL[0]);
  const [kelas, setKelas] = useState(KELAS[0]);
  const [topik, setTopik] = useState('');
  const [jumlah, setJumlah] = useState('10');
  const [kesulitan, setKesulitan] = useState('sedang');
  const [kd, setKd] = useState('');
  const [includeKunci, setIncludeKunci] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const KESULITAN = ['mudah', 'sedang', 'sulit'];

  async function handleGenerate() {
    if (!topik.trim()) { Alert.alert('Input Kurang', 'Topik/Materi wajib diisi.'); return; }
    const jml = parseInt(jumlah);
    if (isNaN(jml) || jml < 1 || jml > 50) { Alert.alert('Input Tidak Valid', 'Jumlah soal antara 1–50.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/generate-mc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          mata_pelajaran: mapel, tingkat_kelas: kelas, topik: topik.trim(),
          jumlah_soal: jml, tingkat_kesulitan: kesulitan,
          include_kunci: includeKunci, kompetensi_dasar: kd.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message ?? 'Gagal generate soal.'); return; }

      // ── Navigasi ke halaman detail setelah generate berhasil ──
      navigation.navigate('MCDetail', {
        id: data.mc_id,
        data: {
          id: data.mc_id,
          mata_pelajaran: mapel,
          tingkat_kelas: kelas,
          topik: topik.trim(),
          jumlah_soal: jml,
          tingkat_kesulitan: kesulitan,
          include_kunci: includeKunci,
          questions_json: data.data?.questions ?? [],
        },
      });
    } catch (e) {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* Field inputs */}
      <Field label="Mata Pelajaran *">
        <SelectF options={MAPEL} value={mapel} onSelect={setMapel} />
      </Field>
      <Field label="Kelas *">
        <SelectF options={KELAS} value={kelas} onSelect={setKelas} />
      </Field>
      <Field label="Topik / Materi *">
        <TextF value={topik} onChangeText={setTopik} placeholder="cth. Thaharah, Wudhu, Shalat..." />
      </Field>
      <View style={mcS.row}>
        <View style={{ flex: 1 }}>
          <Field label="Jumlah Soal *">
            <TextInput
              style={styles.input}
              value={jumlah}
              onChangeText={setJumlah}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={C.mutedLight}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Kesulitan *">
            <SelectF options={KESULITAN} value={kesulitan} onSelect={setKesulitan} />
          </Field>
        </View>
      </View>
      <Field label="Kompetensi Dasar (KD)">
        <TextF value={kd} onChangeText={setKd} placeholder="cth. 3.1 Memahami ketentuan thaharah" multiline />
      </Field>
      <View style={mcS.switchRow}>
        <View>
          <Text style={styles.fieldLabel}>Sertakan Kunci Jawaban</Text>
          <Text style={mcS.switchSub}>Include kunci & pembahasan di output</Text>
        </View>
        <Switch value={includeKunci} onValueChange={setIncludeKunci}
          trackColor={{ false: C.border, true: C.primary }} thumbColor="#fff" />
      </View>

      {/* Generate button */}
      <TouchableOpacity style={[styles.generateBtn, loading && { opacity: 0.7 }]} onPress={handleGenerate} disabled={loading}>
        {loading
          ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.generateBtnText}>Sedang generate soal...</Text></>
          : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate Soal</Text></>
        }
      </TouchableOpacity>

      {/* Error */}
      {error ? (
        <View style={mcS.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={mcS.errorText}>{error}</Text>
        </View>
      ) : null}
    </>
  );
}

function RubricForm({ navigation }) {
  const { token } = useAuth();
  const [tugas, setTugas] = useState('');
  const [aspek, setAspek] = useState('');
  const [skala, setSkala] = useState('1-4');
  const [tpKd, setTpKd] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SKALA = ['1-4', '1-10', '1-100'];

  async function handleGenerate() {
    if (!tugas.trim()) { Alert.alert('Input Kurang', 'Jenis Tugas wajib diisi.'); return; }
    if (!aspek.trim()) { Alert.alert('Input Kurang', 'Aspek Penilaian wajib diisi.'); return; }
    const aspekArray = aspek.split(',').map(a => a.trim()).filter(Boolean);
    if (aspekArray.length === 0) { Alert.alert('Input Tidak Valid', 'Pisahkan aspek dengan koma.'); return; }

    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_tugas: tugas.trim(),
          aspek_penilaian: aspekArray,
          skala_nilai: skala,
          tujuan_pembelajaran: tpKd.trim() || null,
          deskripsi_tugas: deskripsi.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message ?? 'Gagal generate rubrik.'); return; }

      // ── Navigasi ke halaman detail setelah generate berhasil ──
      navigation.navigate('RubricDetail', {
        id: data.data?.rubic_id,
        data: {
          id: data.data?.rubic_id,
          request_id: data.data?.request_id,
          jenis_tugas: tugas.trim(),
          aspek_penilaian: aspekArray,
          skala_nilai: skala,
          tujuan_pembelajaran: data.data?.tujuan_pembelajaran || tpKd.trim() || null,
          rubric_json: data.data?.rubric ?? {},
        },
      });
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally { setLoading(false); }
  }

  return (
    <>
      <Field label="Jenis Tugas / Aktivitas *">
        <TextF value={tugas} onChangeText={setTugas} placeholder="cth. Presentasi kelompok, Proyek, Esai" />
      </Field>
      <Field label="Aspek Penilaian * (pisahkan dengan koma)">
        <TextF value={aspek} onChangeText={setAspek} placeholder="cth. Isi, Penyampaian, Kerja Sama" multiline />
      </Field>
      <Field label="Skala Nilai *">
        <SelectF options={SKALA} value={skala} onSelect={setSkala} />
      </Field>
      <Field label="TP/KD (opsional)">
        <TextF value={tpKd} onChangeText={setTpKd} placeholder="cth. 3.1 Memahami ketentuan thaharah" />
      </Field>
      <Field label="Deskripsi Tugas (opsional)">
        <TextF value={deskripsi} onChangeText={setDeskripsi} placeholder="cth. Siswa mempresentasikan hasil diskusi kelompok" multiline />
      </Field>

      <TouchableOpacity style={[styles.generateBtn, loading && { opacity: 0.7 }]} onPress={handleGenerate} disabled={loading}>
        {loading
          ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.generateBtnText}>Sedang generate rubrik...</Text></>
          : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate Rubrik</Text></>
        }
      </TouchableOpacity>

      {error ? (
        <View style={mcS.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={mcS.errorText}>{error}</Text>
        </View>
      ) : null}
    </>
  );
}

function FeedbackForm() {
  const [karangan, setKarangan] = useState('');
  const { loading, result, generate } = useTool('writing-feedback');
  return (
    <>
      <Field label="Tempel Karangan Siswa di Sini">
        <TextInput
          style={[styles.input, { height: 160, textAlignVertical: 'top' }]}
          value={karangan}
          onChangeText={setKarangan}
          placeholder="Tempel teks karangan siswa..."
          placeholderTextColor={C.mutedLight}
          multiline
        />
      </Field>
      <GenerateBtn loading={loading} onPress={() => generate({ karangan })} />
      <ResultBox text={result} onCopy={() => Alert.alert('Tersalin!')} />
    </>
  );
}

function WorksheetForm() {
  const [mapel, setMapel] = useState(MAPEL[0]);
  const [kelas, setKelas] = useState(KELAS[0]);
  const [topik, setTopik] = useState('');
  const { loading, result, generate } = useTool('worksheet');
  return (
    <>
      <Field label="Mata Pelajaran"><SelectF options={MAPEL} value={mapel} onSelect={setMapel} /></Field>
      <Field label="Kelas"><SelectF options={KELAS} value={kelas} onSelect={setKelas} /></Field>
      <Field label="Topik"><TextF value={topik} onChangeText={setTopik} placeholder="cth. Thaharah" /></Field>
      <GenerateBtn loading={loading} onPress={() => generate({ mapel, kelas, topik })} />
      <ResultBox text={result} onCopy={() => Alert.alert('Tersalin!')} />
    </>
  );
}

function PresentationForm() {
  const [topik, setTopik] = useState('');
  const [kelas, setKelas] = useState(KELAS[0]);
  const [slides, setSlides] = useState('10');
  const { loading, result, generate } = useTool('presentation');
  return (
    <>
      <Field label="Topik Presentasi"><TextF value={topik} onChangeText={setTopik} placeholder="cth. Rukun Islam dan Iman" /></Field>
      <Field label="Kelas"><SelectF options={KELAS} value={kelas} onSelect={setKelas} /></Field>
      <Field label="Jumlah Slide"><TextF value={slides} onChangeText={setSlides} placeholder="10" /></Field>
      <GenerateBtn loading={loading} onPress={() => generate({ topik, kelas, slides })} />
      <ResultBox text={result} onCopy={() => Alert.alert('Tersalin!')} />
    </>
  );
}

function SyllabusForm() {
  const [mapel, setMapel] = useState(MAPEL[0]);
  const [kelas, setKelas] = useState(KELAS[0]);
  const [kurikulum, setKurikulum] = useState(KURIKULUM[0]);
  const { loading, result, generate } = useTool('syllabus');
  return (
    <>
      <Field label="Mata Pelajaran"><SelectF options={MAPEL} value={mapel} onSelect={setMapel} /></Field>
      <Field label="Kelas"><SelectF options={KELAS} value={kelas} onSelect={setKelas} /></Field>
      <Field label="Kurikulum"><SelectF options={KURIKULUM} value={kurikulum} onSelect={setKurikulum} /></Field>
      <GenerateBtn loading={loading} onPress={() => generate({ mapel, kelas, kurikulum })} />
      <ResultBox text={result} onCopy={() => Alert.alert('Tersalin!')} />
    </>
  );
}

function UnitPlanForm() {
  const [mapel, setMapel] = useState(MAPEL[0]);
  const [kelas, setKelas] = useState(KELAS[0]);
  const [kurikulum, setKurikulum] = useState(KURIKULUM[0]);
  const [topik, setTopik] = useState('');
  const { loading, result, generate } = useTool('unit-plan');
  return (
    <>
      <Field label="Mata Pelajaran"><SelectF options={MAPEL} value={mapel} onSelect={setMapel} /></Field>
      <Field label="Kelas"><SelectF options={KELAS} value={kelas} onSelect={setKelas} /></Field>
      <Field label="Kurikulum"><SelectF options={KURIKULUM} value={kurikulum} onSelect={setKurikulum} /></Field>
      <Field label="Topik / Sub-bab"><TextF value={topik} onChangeText={setTopik} placeholder="cth. Thaharah" /></Field>
      <GenerateBtn loading={loading} onPress={() => generate({ mapel, kelas, kurikulum, topik })} />
      <ResultBox text={result} onCopy={() => Alert.alert('Tersalin!')} />
    </>
  );
}

function AcademicForm() {
  const [topik, setTopik] = useState('');
  const JENIS = ['Rangkuman Materi', 'Penjelasan Konsep', 'Contoh Soal & Jawaban', 'Glosarium'];
  const [jenis, setJenis] = useState(JENIS[0]);
  const { loading, result, generate } = useTool('academic-content');
  return (
    <>
      <Field label="Topik"><TextF value={topik} onChangeText={setTopik} placeholder="cth. Thaharah dalam Islam" /></Field>
      <Field label="Jenis Konten"><SelectF options={JENIS} value={jenis} onSelect={setJenis} /></Field>
      <GenerateBtn loading={loading} onPress={() => generate({ topik, jenis })} />
      <ResultBox text={result} onCopy={() => Alert.alert('Tersalin!')} />
    </>
  );
}

const TOOL_FORMS = {
  'multiple-choice': MultipleChoiceForm,
  'rubric': RubricForm,
  'writing-feedback': FeedbackForm,
  'worksheet': WorksheetForm,
  'presentation': PresentationForm,
  'syllabus': SyllabusForm,
  'unit-plan': UnitPlanForm,
  'academic-content': AcademicForm,
};

export default function ToolPageScreen({ route, navigation }) {
  const { slug } = route.params;

  // Redirect tools dengan dedicated screen (Rules of Hooks: useEffect di level atas)
  useEffect(() => {
    if (slug === 'writing-feedback') navigation.replace('WritingFeedback');
    if (slug === 'worksheet') navigation.replace('Worksheet');
    if (slug === 'presentation') navigation.replace('PresentationForm');
  }, [slug]);

  const tool = findTool(slug);
  if (!tool || slug === 'writing-feedback' || slug === 'worksheet') return null;

  const iconName = ICON_MAP[tool.icon] ?? 'sparkles';
  const isGold = tool.accent === 'gold';
  const ToolForm = TOOL_FORMS[slug] ?? (() => <Text style={{ color: C.muted }}>Form tidak ditemukan.</Text>);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.heroIcon, isGold ? styles.heroIconGold : styles.heroIconEmerald]}>
          <Ionicons name={iconName} size={28} color={isGold ? C.goldFg : C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSub}>{tool.subtitle}</Text>
          <Text style={styles.heroTitle}>{tool.title}</Text>
          <Text style={styles.heroDesc}>{tool.desc}</Text>
        </View>
      </View>

      {/* Form card */}
      <View style={[styles.formCard, S.shadow]}>
        <ToolForm navigation={navigation} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: C.muted },
  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroIconEmerald: { backgroundColor: C.primaryLight },
  heroIconGold: { backgroundColor: C.goldLight },
  heroSub: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.ink, marginTop: 2 },
  heroDesc: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 19 },
  formCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink,
  },
  selectOpt: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  selectOptActive: { backgroundColor: C.primary, borderColor: C.primary },
  selectOptText: { fontSize: 13, color: C.ink },
  selectOptTextActive: { color: '#fff', fontWeight: '600' },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14,
  },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  result: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultLabel: { fontSize: 11, fontWeight: '800', color: C.gold, textTransform: 'uppercase', letterSpacing: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fff' },
  copyBtnText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  resultText: { fontSize: 13, color: C.ink, lineHeight: 20 },
});

const mcS = StyleSheet.create({
  infoBox: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: C.border },
  infoTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  infoDesc: { fontSize: 13, color: C.muted, lineHeight: 19 },
  schemaLabel: { fontSize: 10, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1 },
  schemaCode: { fontSize: 12, color: C.muted, fontFamily: 'monospace', lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.border },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1.5 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, color: C.ink },
  row: { flexDirection: 'row', gap: 10 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border,
  },
  switchSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fca5a5',
  },
  errorText: { fontSize: 13, color: '#dc2626', flex: 1 },
  resultWrap: { gap: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  resultTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  resultSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  copyAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  copyAllText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', gap: 8, paddingVertical: 4,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.primary, backgroundColor: '#fff',
  },
  actionBtnSave: {
    backgroundColor: C.primary, borderColor: C.primary,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  qCard: { backgroundColor: C.bg, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: C.border },
  qHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  noText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  soalText: { fontSize: 14, color: C.ink, lineHeight: 21, flex: 1 },
  pilihanList: { gap: 6, paddingLeft: 38 },
  pilihanRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  pilihanKunci: { backgroundColor: C.primaryLight, borderColor: C.primary },
  pilihanKey: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  pilihanKeyActive: { backgroundColor: C.primary },
  pilihanKeyText: { fontSize: 11, fontWeight: '700', color: C.ink },
  pilihanVal: { fontSize: 13, color: C.ink, flex: 1 },
  pembahasanBox: { backgroundColor: '#fffbeb', borderRadius: 8, padding: 10, gap: 4, borderLeftWidth: 3, borderLeftColor: C.gold },
  pembahasanLabel: { fontSize: 11, fontWeight: '700', color: C.gold },
  pembahasanText: { fontSize: 12, color: C.ink, lineHeight: 18 },
  pdfModal: {
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  pdfModalTitle: { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 4 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, paddingVertical: 12,
  },
  pdfBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  pdfCancelText: { fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 4 },
});

const rubricS = StyleSheet.create({
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fca5a5' },
  errorText: { fontSize: 13, color: '#dc2626', flex: 1 },
  resultWrap: { gap: 12 },
  resultHeader: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  resultTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  resultSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  tpBox: { backgroundColor: C.primaryLight, borderRadius: 10, padding: 12, gap: 4 },
  tpLabel: { fontSize: 11, fontWeight: '700', color: C.primary },
  tpText: { fontSize: 13, color: C.ink, lineHeight: 19 },
  aspekCard: { backgroundColor: C.bg, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  aspekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fef3c7' },
  aspekNama: { fontSize: 14, fontWeight: '700', color: '#92400e', flex: 1 },
  bobotBadge: { backgroundColor: C.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  bobotText: { fontSize: 11, fontWeight: '700', color: C.goldFg },
  levelRow: { borderTopWidth: 1, borderTopColor: C.border, padding: 10, gap: 4 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelNama: { fontSize: 12, fontWeight: '700', color: C.ink },
  skorBadge: { backgroundColor: C.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  skorText: { fontSize: 11, fontWeight: '700', color: C.primary },
  levelDesc: { fontSize: 12, color: C.muted, lineHeight: 17 },
});
