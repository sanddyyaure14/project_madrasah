"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const getInitials = (name) => {
  if (!name) return "G";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "G";
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const renderMapel = (mapel) => {
  if (!mapel) return "-";
  if (Array.isArray(mapel)) return mapel.join(", ");
  return mapel;
};

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchTeachers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/kepsek/guru`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setTeachers(json.data);
      } else {
        setErrorMsg(json.message || "Gagal memuat daftar guru.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(t => {
    const name = t.nama_lengkap || "";
    const email = t.email || "";
    const mapel = renderMapel(t.mata_pelajaran);
    return name.toLowerCase().includes(search.toLowerCase()) || 
           email.toLowerCase().includes(search.toLowerCase()) ||
           mapel.toLowerCase().includes(search.toLowerCase());
  });

  const totalGuru = teachers.length;

  const handleReset = () => {
    setSearch("");
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    alert("Untuk menambahkan guru baru, silakan minta guru mendaftar melalui halaman registrasi, lalu setujui di dashboard atau menu Persetujuan.");
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = sessionStorage.getItem("accessToken");
      // Mapel input can be a comma-separated string, convert to array for backend
      const mapelArr = editingTeacher.mata_pelajaran
        ? (typeof editingTeacher.mata_pelajaran === "string"
            ? editingTeacher.mata_pelajaran.split(",").map(s => s.trim()).filter(Boolean)
            : editingTeacher.mata_pelajaran)
        : null;

      const res = await fetch(`${API_URL}/api/kepsek/guru/${editingTeacher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_lengkap: editingTeacher.nama_lengkap,
          email: editingTeacher.email,
          nip: editingTeacher.nip || null,
          mata_pelajaran: mapelArr,
          jenjang: editingTeacher.jenjang || null,
          kurikulum: editingTeacher.kurikulum || null,
          no_hp: editingTeacher.no_hp || null
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Data guru berhasil diperbarui!");
        fetchTeachers();
        setEditingTeacher(null);
      } else {
        alert(json.message || "Gagal memperbarui guru.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan.");
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus guru ini?")) {
      try {
        const token = sessionStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/api/kepsek/guru/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setSuccessMsg("Guru berhasil dihapus.");
          fetchTeachers();
        } else {
          alert(json.message || "Gagal menghapus guru.");
        }
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus guru.");
      }
      setOpenActionId(null);
    }
  };

  const closeDropdowns = () => {
    if (openActionId) setOpenActionId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900 m-0">Daftar Guru</h1>
          <p className="text-[13px] text-gray-500 m-0 mt-1">Lihat dan kelola data guru madrasah.</p>
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

      {successMsg && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {errorMsg}
        </div>
      )}

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
          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
              <span>Memuat data guru...</span>
            </div>
          ) : (
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
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {getInitials(t.nama_lengkap)}
                          </div>
                          <span className="text-[13px] text-gray-800 font-medium whitespace-nowrap">{t.nama_lengkap}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-gray-600 whitespace-nowrap">{renderMapel(t.mata_pelajaran)}</td>
                      <td className="py-4 px-6 text-[13px] text-gray-500 flex items-center gap-2 whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {t.email}
                      </td>
                      <td className="py-4 px-6 text-[14px] text-gray-900 font-serif text-center">{t.total_generate_bulan_ini || 0}</td>
                      <td className="py-4 px-6 text-[12px] text-gray-400 text-right whitespace-nowrap">{formatRelativeTime(t.last_login_at || t.created_at)}</td>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTeacher({
                                  ...t,
                                  mata_pelajaran: Array.isArray(t.mata_pelajaran) ? t.mata_pelajaran.join(", ") : (t.mata_pelajaran || "")
                                });
                                setOpenActionId(null);
                              }}
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
          )}
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
              <form onSubmit={handleEditTeacher} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Nama Lengkap</label>
                  <input type="text" required value={editingTeacher.nama_lengkap} onChange={(e) => setEditingTeacher({...editingTeacher, nama_lengkap: e.target.value})} placeholder="Ust. / Ustz. ..." className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Email</label>
                  <input type="email" required value={editingTeacher.email} onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})} placeholder="nama@madrasah.id" className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">No. Telepon</label>
                  <input type="text" value={editingTeacher.no_hp || ""} onChange={(e) => setEditingTeacher({...editingTeacher, no_hp: e.target.value})} placeholder="08xx-xxxx-xxxx" className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">NIP</label>
                  <input type="text" value={editingTeacher.nip || ""} onChange={(e) => setEditingTeacher({...editingTeacher, nip: e.target.value})} placeholder="Nomor Induk Pegawai" className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Mata Pelajaran (pisahkan dengan koma)</label>
                  <input type="text" value={editingTeacher.mata_pelajaran || ""} onChange={(e) => setEditingTeacher({...editingTeacher, mata_pelajaran: e.target.value})} placeholder="Contoh: Fiqih, Akidah" className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Jenjang</label>
                  <select value={editingTeacher.jenjang || ""} onChange={(e) => setEditingTeacher({...editingTeacher, jenjang: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer">
                    <option value="">-- Pilih Jenjang --</option>
                    <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                    <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
                    <option value="MA">MA (Madrasah Aliyah)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-1.5 font-medium">Kurikulum</label>
                  <select value={editingTeacher.kurikulum || ""} onChange={(e) => setEditingTeacher({...editingTeacher, kurikulum: e.target.value})} className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer">
                    <option value="">-- Pilih Kurikulum --</option>
                    <option value="Merdeka">Kurikulum Merdeka</option>
                    <option value="K13">Kurikulum 2013 (K13)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-100">
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
