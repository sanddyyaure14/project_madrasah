export const TEACHERS = [
  { id: 'u-002', name: 'Ust. Ahmad Fauzi, S.Pd.I.', subject: 'Fiqih', email: 'ustadz@madrasah.id', status: 'Aktif', generates: 38, lastActive: '2 jam lalu' },
  { id: 'u-003', name: 'Ustz. Aisyah Nurhaliza, S.Pd.', subject: 'Bahasa Arab', email: 'ustadzah@madrasah.id', status: 'Aktif', generates: 51, lastActive: '12 menit lalu' },
  { id: 'u-004', name: 'Ust. Yusuf Maulana, M.Pd.', subject: 'Al-Qur\'an Hadis', email: 'yusuf@madrasah.id', status: 'Aktif', generates: 27, lastActive: '1 hari lalu' },
  { id: 'u-005', name: 'Ustz. Khadijah Salma, S.Pd.', subject: 'Akidah Akhlak', email: 'khadijah@madrasah.id', status: 'Pending', generates: 14, lastActive: '5 hari lalu' },
  { id: 'u-006', name: 'Ust. Hamzah Ibrahim, S.Pd.', subject: 'Sejarah Kebudayaan Islam', email: 'hamzah@madrasah.id', status: 'Aktif', generates: 19, lastActive: 'Kemarin' },
  { id: 'u-007', name: 'Ustz. Maryam Zahra, S.Pd.', subject: 'Matematika', email: 'maryam@madrasah.id', status: 'Aktif', generates: 33, lastActive: '3 jam lalu' },
  { id: 'u-008', name: 'Ust. Bilal Saputra, S.Pd.', subject: 'IPA Terpadu', email: 'bilal@madrasah.id', status: 'Nonaktif', generates: 4, lastActive: '3 minggu lalu' },
  { id: 'u-009', name: 'Ust. Ali Imron', subject: 'Bahasa Indonesia', email: 'ali@madrasah.id', status: 'Pending', generates: 0, lastActive: 'Baru daftar' },
  { id: 'u-010', name: 'Ustz. Fatimah Zahra', subject: 'IPS', email: 'fatimah@madrasah.id', status: 'Pending', generates: 0, lastActive: 'Baru daftar' },
];

export const PENDING = [
  { id: 'a-1', teacher: 'Ust. Ahmad Fauzi', type: 'RPP', title: 'RPP Fiqih Bab Thaharah - Kelas VII', submitted: 'Hari ini, 09:12' },
  { id: 'a-2', teacher: 'Ustz. Aisyah Nurhaliza', type: 'Soal', title: 'Soal PG Bahasa Arab — Mufrodat Tema Keluarga', submitted: 'Hari ini, 08:45' },
  { id: 'a-3', teacher: 'Ust. Hamzah Ibrahim', type: 'Silabus', title: 'Silabus SKI Semester Ganjil Kelas VIII', submitted: 'Kemarin, 16:20' },
  { id: 'a-4', teacher: 'Ustz. Maryam Zahra', type: 'LKS', title: 'LKS Matematika — Bilangan Bulat', submitted: 'Kemarin, 11:03' },
];

export const SCHOOL_STATS = {
  guru: 24,
  siswa: 612,
  kelas: 21,
  dokumen: 1284,
  generateBulanIni: 312,
  hematJam: 184,
};

export const ACTIVITY = [
  { who: 'Ustz. Aisyah', what: 'membuat 20 soal PG Bahasa Arab', when: '12 menit lalu' },
  { who: 'Ust. Ahmad', what: 'menyelesaikan RPP Thaharah', when: '2 jam lalu' },
  { who: 'Ust. Yusuf', what: 'generate Silabus Al-Qur\'an Hadis', when: 'Kemarin' },
  { who: 'Ustz. Maryam', what: 'menambah LKS Matematika', when: 'Kemarin' },
];
