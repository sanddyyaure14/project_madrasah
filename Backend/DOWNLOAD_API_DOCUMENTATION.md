# Dokumentasi API Download Content

Dokumentasi ini menjelaskan cara menggunakan endpoint untuk mendownload hasil generate content dalam berbagai format file.

## Endpoint Download

### 1. Academic Content - Download PDF

**Endpoint:** `GET /api/content/academic-content/download/:id/pdf`

**Deskripsi:** Download konten akademik dalam format PDF

**Parameter:**
- `id` (path parameter) - UUID dari academic content yang ingin didownload

**Response:**
- File PDF akan otomatis terdownload dengan nama `academic_content_{id}.pdf`

**Contoh Request:**
```bash
GET http://localhost:3000/api/content/academic-content/download/123e4567-e89b-12d3-a456-426614174000/pdf
```

---

### 2. Presentation - Download PPT

**Endpoint:** `GET /api/content/presentation/download/:id/ppt`

**Deskripsi:** Download presentasi dalam format PowerPoint (PPTX)

**Parameter:**
- `id` (path parameter) - UUID dari presentation yang ingin didownload

**Response:**
- File PPTX akan otomatis terdownload dengan nama `presentation_{id}.pptx`

**Contoh Request:**
```bash
GET http://localhost:3000/api/content/presentation/download/123e4567-e89b-12d3-a456-426614174000/ppt
```

---

### 3. Syllabus - Download PDF

**Endpoint:** `GET /api/content/syllabus/download/:id/pdf`

**Deskripsi:** Download silabus dalam format PDF

**Parameter:**
- `id` (path parameter) - UUID dari syllabus yang ingin didownload

**Response:**
- File PDF akan otomatis terdownload dengan nama `syllabus_{id}.pdf`

**Contoh Request:**
```bash
GET http://localhost:3000/api/content/syllabus/download/123e4567-e89b-12d3-a456-426614174000/pdf
```

---

### 4. Syllabus - Download DOCX

**Endpoint:** `GET /api/content/syllabus/download/:id/docx`

**Deskripsi:** Download silabus dalam format Word (DOCX)

**Parameter:**
- `id` (path parameter) - UUID dari syllabus yang ingin didownload

**Response:**
- File DOCX akan otomatis terdownload dengan nama `syllabus_{id}.docx`

**Contoh Request:**
```bash
GET http://localhost:3000/api/content/syllabus/download/123e4567-e89b-12d3-a456-426614174000/docx
```

---

### 5. Unit Plan - Download DOCX

**Endpoint:** `GET /api/content/unit-plan/download/:id/docx`

**Deskripsi:** Download unit plan/modul ajar dalam format Word (DOCX)

**Parameter:**
- `id` (path parameter) - UUID dari unit plan yang ingin didownload

**Response:**
- File DOCX akan otomatis terdownload dengan nama `unit_plan_{id}.docx`

**Contoh Request:**
```bash
GET http://localhost:3000/api/content/unit-plan/download/123e4567-e89b-12d3-a456-426614174000/docx
```

---

## Ringkasan Format File

| Content Type | Format yang Tersedia |
|--------------|---------------------|
| Academic Content | PDF |
| Presentation | PPT (PPTX) |
| Syllabus | PDF, DOCX |
| Unit Plan | DOCX |

## Error Response

Jika terjadi error, API akan mengembalikan response JSON:

```json
{
  "success": false,
  "message": "Pesan error",
  "error": "Detail error"
}
```

**Kemungkinan Error:**
- `404` - Content tidak ditemukan
- `500` - Error saat generate file atau server error

## Catatan Penting

1. File yang didownload akan otomatis dihapus dari server setelah proses download selesai
2. Pastikan ID yang digunakan valid dan sudah ada di database
3. File temporary disimpan di folder `Backend/temp/` selama proses generate
4. Semua endpoint menggunakan method GET untuk kemudahan akses

## Contoh Penggunaan di Frontend

### JavaScript/Fetch API
```javascript
// Download Academic Content PDF
const downloadAcademicContentPDF = async (contentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/content/academic-content/download/${contentId}/pdf`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_content_${contentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};

// Download Presentation PPT
const downloadPresentationPPT = async (presentationId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/content/presentation/download/${presentationId}/ppt`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation_${presentationId}.pptx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Error downloading PPT:', error);
  }
};
```

### React Native
```javascript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const downloadFile = async (contentId, type, format) => {
  try {
    const url = `http://localhost:3000/api/content/${type}/download/${contentId}/${format}`;
    const fileUri = FileSystem.documentDirectory + `${type}_${contentId}.${format}`;
    
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri
    );
    
    const { uri } = await downloadResumable.downloadAsync();
    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

// Contoh penggunaan
downloadFile('123e4567-e89b-12d3-a456-426614174000', 'academic-content', 'pdf');
downloadFile('123e4567-e89b-12d3-a456-426614174000', 'presentation', 'ppt');
downloadFile('123e4567-e89b-12d3-a456-426614174000', 'syllabus', 'docx');
downloadFile('123e4567-e89b-12d3-a456-426614174000', 'unit-plan', 'docx');
```

## Testing dengan cURL

```bash
# Download Academic Content PDF
curl -O -J http://localhost:3000/api/content/academic-content/download/YOUR_ID_HERE/pdf

# Download Presentation PPT
curl -O -J http://localhost:3000/api/content/presentation/download/YOUR_ID_HERE/ppt

# Download Syllabus PDF
curl -O -J http://localhost:3000/api/content/syllabus/download/YOUR_ID_HERE/pdf

# Download Syllabus DOCX
curl -O -J http://localhost:3000/api/content/syllabus/download/YOUR_ID_HERE/docx

# Download Unit Plan DOCX
curl -O -J http://localhost:3000/api/content/unit-plan/download/YOUR_ID_HERE/docx
```
