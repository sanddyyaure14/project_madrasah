"use client";

import { useState } from "react";

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Row action states
  const [openActionId, setOpenActionId] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const daftarMapel = [
    "Akidah Akhlak",
    "Al-Qur'an Hadis",
    "Fiqih",
    "SKI",
    "Bahasa Arab",
    "Matematika",
    "IPA",
    "IPS",
    "Bahasa Indonesia",
  ];
  
  // Dummy data
  const [teachers, setTeachers] = useState([
    { id: 1, name: "Ust. Ahmad Fauzi, S.Pd.I.", mapel: "Fiqih", email: "ustadz@madrasah.id", generate: 38, lastActive: "2 jam lalu", initial: "UA", bg: "bg-emerald-100", text: "text-emerald-700" },
    { id: 2, name: "Ustz. Aisyah Nurhaliza, S.Pd.", mapel: "Bahasa Arab", email: "ustadzah@madrasah.id", generate: 51, lastActive: "12 menit lalu", initial: "UA", bg: "bg-emerald-100", text: "text-emerald-700" },
    { id: 3, name: "Ust. Yusuf Maulana, M.Pd.", mapel: "Al-Qur'an Hadis", email: "yusuf@madrasah.id", generate: 27, lastActive: "1 hari lalu", initial: "UY", bg: "bg-emerald-100", text: "text-emerald-700" },
    { id: 4, name: "Ustz. Khadijah Salma, S.Pd.", mapel: "Akidah Akhlak", email: "khadijah@madrasah.id", generate: 14, lastActive: "5 hari lalu", initial: "UK", bg: "bg-amber-100", text: "text-amber-700" },
    { id: 5, name: "Ust. Hamzah Ibrahim, S.Pd.", mapel: "Sejarah Kebudayaan Islam", email: "hamzah@madrasah.id", generate: 19, lastActive: "Kemarin", initial: "UH", bg: "bg-emerald-100", text: "text-emerald-700" },
    { id: 6, name: "Ustz. Maryam Zahra, S.Pd.", mapel: "Matematika", email: "maryam@madrasah.id", generate: 33, lastActive: "3 jam lalu", initial: "UM", bg: "bg-emerald-100", text: "text-emerald-700" },
    { id: 7, name: "Ust. Budi Santoso, S.Pd.", mapel: "IPA Terpadu", email: "budi@madrasah.id", generate: 0, lastActive: "1 bulan lalu", initial: "UB", bg: "bg-gray-200", text: "text-gray-700" },
  ]);

  // Derived state for filtering
  const filteredTeachers = teachers.filter(t => {
    return t.name.toLowerCase().includes(search.toLowerCase()) || 
           t.mapel.toLowerCase().includes(search.toLowerCase()) || 
           t.email.toLowerCase().includes(search.toLowerCase());
  });

  const totalGuru = teachers.length;

  const handleReset = () => {
    setSearch("");
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    alert("Fitur simpan guru baru sedang dalam pengembangan backend.");
  };

  const handleEditTeacher = (e) => {
    e.preventDefault();
    setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? editingTeacher : t));
    setEditingTeacher(null);
    alert("Data guru berhasil diperbarui!");
  };

  const handleDeleteTeacher = (id) => {
    if(confirm("Apakah Anda yakin ingin menghapus guru ini?")) {
      setTeachers(prev => prev.filter(t => t.id !== id));
      setOpenActionId(null);
    }
  };

  const closeDropdowns = () => {
    if(openActionId) setOpenActionId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 m-0">Daftar Guru</h1>
          <p className="text-[13px] text-gray-500 m-0 mt-1">Kelola akun guru: tambah, ubah, dan hapus.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Reset
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-[#006747] text-white rounded-lg text-sm font-medium hover:bg-[#005238] transition-colors flex items-center gap-2 shadow-sm cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Cari nama, mapel, email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div className="text-[12px] text-gray-500 hidden md:block">
            {filteredTeachers.length} dari {totalGuru} guru
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5]/50 border-b border-gray-100">
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">NAMA</th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">MAPEL</th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">EMAIL</th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">GENERATE</th>
                <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">TERAKHIR AKTIF</th>
                <th className="py-4 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50" onClick={closeDropdowns}>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 text-sm">Tidak ada data guru yang cocok dengan pencarian Anda.</td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF9F5]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${t.bg} ${t.text} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                          {t.initial}
                        </div>
                        <span className="text-[13px] text-gray-800 font-medium whitespace-nowrap">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-gray-600 whitespace-nowrap">{t.mapel}</td>
                    <td className="py-4 px-6 text-[13px] text-gray-500 flex items-center gap-2 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {t.email}
                    </td>
                    <td className="py-4 px-6 text-[14px] text-gray-900 font-serif text-center">{t.generate}</td>
                    <td className="py-4 px-6 text-[12px] text-gray-400 text-right whitespace-nowrap">{t.lastActive}</td>
                    <td className="py-4 px-4 text-right relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === t.id ? null : t.id); }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                      </button>
                      {openActionId === t.id && (
                        <div className="absolute right-8 top-10 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingTeacher({...t}); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Ubah
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(t.id); }}
                            className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Tambah Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] w-full max-w-[480px] rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 m-0 mb-1">Tambah Guru Baru</h2>
              <p className="text-sm text-gray-500 m-0 mb-6">Lengkapi data berikut untuk membuat akun guru baru.</p>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Nama Lengkap</label>
                  <input type="text" required placeholder="Ust. / Ustz. ..." className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Mata Pelajaran</label>
                  <input type="text" required placeholder="Fiqih, Bahasa Arab..." className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div className="pb-4">
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Email</label>
                  <input type="email" required placeholder="nama@madrasah.id" className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">Batal</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#006747] rounded-lg shadow-sm hover:bg-[#005238] transition-colors">Tambah Guru</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Guru */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] w-full max-w-[480px] rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setEditingTeacher(null)} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-serif font-bold text-gray-900 m-0 mb-1">Ubah Data Guru</h2>
              <p className="text-sm text-gray-500 m-0 mb-6">Perbarui informasi akun guru.</p>
              <form onSubmit={handleEditTeacher} className="space-y-4">
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Nama Lengkap</label>
                  <input type="text" required value={editingTeacher.name} onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})} placeholder="Ust. / Ustz. ..." className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Mata Pelajaran</label>
                  <select required value={editingTeacher.mapel} onChange={(e) => setEditingTeacher({...editingTeacher, mapel: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer">
                    <option value="" disabled>Pilih mapel...</option>
                    {daftarMapel.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
                <div className="pb-4">
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Email</label>
                  <input type="email" required value={editingTeacher.email} onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})} placeholder="nama@madrasah.id" className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setEditingTeacher(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">Batal</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#006747] rounded-lg shadow-sm hover:bg-[#005238] transition-colors">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
