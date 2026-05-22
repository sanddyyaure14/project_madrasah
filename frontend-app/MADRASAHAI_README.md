# MadrasahAI Dashboard — Panduan Integrasi

## Struktur file yang ditambahkan / diubah

```
src/
├── app/
│   └── index.tsx                    ← DIGANTI: Dashboard utama MadrasahAI
├── components/
│   ├── app-tabs.tsx                 ← DIUPDATE: Label tab (Dashboard / Jelajahi)
│   └── dashboard/                  ← BARU: Folder komponen dashboard
│       ├── Sidebar.tsx             ← Sidebar navigasi dengan brand MadrasahAI
│       ├── Topbar.tsx              ← Top bar (salam, nama user, upgrade btn)
│       ├── HeroBanner.tsx          ← Banner hijau dengan bismillah & greeting
│       ├── StatsRow.tsx            ← 3 stat cards (Generate / Dokumen / Waktu)
│       └── ToolsGrid.tsx           ← Grid 8 teacher tools dengan ikon & deskripsi
├── constants/
│   └── theme.ts                    ← DIUPDATE: Warna MadrasahAI (green, gold, cream)
└── hooks/
    └── use-theme.ts                ← Minor update untuk kompatibilitas

```

## Cara menjalankan

```bash
# Install dependencies (jika belum)
npm install

# Jalankan di web (sidebar muncul)
npm run web

# Jalankan di iOS
npm run ios

# Jalankan di Android
npm run android
```

## Catatan

- **Web**: Sidebar tampil di kiri secara penuh (layout desktop)
- **Mobile (iOS/Android)**: Sidebar disembunyikan otomatis; navigasi via tab bar di bawah
- **Dark mode**: Semua warna mengikuti preferensi sistem secara otomatis
- **Font**: Menggunakan font sistem bawaan Expo; untuk Playfair Display, tambahkan `expo-google-fonts`

## Menambahkan font Playfair Display (opsional)

```bash
npx expo install @expo-google-fonts/playfair-display expo-font
```

Lalu di `_layout.tsx`:
```tsx
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
```
