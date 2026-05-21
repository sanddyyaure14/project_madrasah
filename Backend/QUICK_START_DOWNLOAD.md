# Quick Start - Fitur Download

## 🚀 Langkah Cepat Menggunakan Fitur Download

### Step 1: Pastikan Server Running
```bash
cd Backend
npm run dev
```

### Step 2: Generate Content (Pilih salah satu)

#### A. Academic Content
```bash
POST http://localhost:3000/api/content/academic-content/generate
Content-Type: application/json

{
  "jenis_konten": "Materi Pembelajaran",
  "topik": "Fotosintesis",
  "mapel": "Biologi",
  "kelas": "10",
  "panjang": "sedang",
  "bahasa": "Indonesia",
  "gaya_bahasa": "Akademik"
}
```

#### B. Presentation
```bash
POST http://localhost:3000/api/content/presentation/generate
Content-Type: application/json

{
  "topik": "Sistem Tata Surya",
  "jumlah_slide": 8,
  "tujuan": "Edukasi",
  "audiens": "Siswa SMP",
  "include_catatan": true
}
```

#### C. Syllabus
```bash
POST http://localhost:3000/api/content/syllabus/generate
Content-Type: application/json

{
  "mata_pelajaran": "Matematika",
  "kurikulum": "Kurikulum Merdeka",
  "jenjang": "SMA",
  "tingkat_kelas": "10",
  "semester": "Ganjil",
  "tahun_ajaran": "2024/2025"
}
```

#### D. Unit Plan
```bash
POST http://localhost:3000/api/content/unit-plan/generate
Content-Type: application/json

{
  "judul_unit": "Sistem Persamaan Linear",
  "mata_pelajaran": "Matematika",
  "tingkat_kelas": "10",
  "tujuan_pembelajaran": "Memahami sistem persamaan linear",
  "jumlah_pertemuan": 3,
  "durasi_per_jp": 45
}
```

### Step 3: Ambil ID dari Response

Response akan berisi `id` seperti ini:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    ...
  }
}
```

### Step 4: Download File

Gunakan ID dari step 3, lalu akses URL berikut di browser atau gunakan cURL:

#### Academic Content → PDF
```
http://localhost:3000/api/content/academic-content/download/123e4567-e89b-12d3-a456-426614174000/pdf
```

#### Presentation → PPT
```
http://localhost:3000/api/content/presentation/download/123e4567-e89b-12d3-a456-426614174000/ppt
```

#### Syllabus → PDF
```
http://localhost:3000/api/content/syllabus/download/123e4567-e89b-12d3-a456-426614174000/pdf
```

#### Syllabus → DOCX
```
http://localhost:3000/api/content/syllabus/download/123e4567-e89b-12d3-a456-426614174000/docx
```

#### Unit Plan → DOCX
```
http://localhost:3000/api/content/unit-plan/download/123e4567-e89b-12d3-a456-426614174000/docx
```

## 📱 Contoh Implementasi Frontend

### React/Next.js
```javascript
const handleDownload = async (contentId, type, format) => {
  const url = `http://localhost:3000/api/content/${type}/download/${contentId}/${format}`;
  window.open(url, '_blank');
};

// Penggunaan
<button onClick={() => handleDownload(contentId, 'academic-content', 'pdf')}>
  Download PDF
</button>
```

### React Native
```javascript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const downloadFile = async (contentId, type, format) => {
  const url = `http://localhost:3000/api/content/${type}/download/${contentId}/${format}`;
  const fileUri = FileSystem.documentDirectory + `${type}_${contentId}.${format}`;
  
  const { uri } = await FileSystem.downloadAsync(url, fileUri);
  await Sharing.shareAsync(uri);
};

// Penggunaan
<Button 
  title="Download PDF" 
  onPress={() => downloadFile(contentId, 'academic-content', 'pdf')} 
/>
```

## 🎯 Format File yang Tersedia

| Content | PDF | DOCX | PPT |
|---------|-----|------|-----|
| Academic Content | ✅ | ❌ | ❌ |
| Presentation | ❌ | ❌ | ✅ |
| Syllabus | ✅ | ✅ | ❌ |
| Unit Plan | ❌ | ✅ | ❌ |

## ⚡ Tips

1. **Gunakan Postman atau Thunder Client** untuk testing API dengan mudah
2. **Simpan ID** setelah generate content untuk download nanti
3. **File otomatis terhapus** setelah download, jadi tidak perlu khawatir storage
4. **Buka di browser** untuk download langsung tanpa coding

## 🔗 Dokumentasi Lengkap

- **API Documentation**: `DOWNLOAD_API_DOCUMENTATION.md`
- **Fitur Overview**: `FITUR_DOWNLOAD.md`
- **Test File**: `test-download.http`
