"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function GuruSettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil");

  // State form profil — diisi dari API
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    email: "",
    nip: "",
    no_hp: "",
    jenjang: "",
    kurikulum: "",
    mata_pelajaran: "",
    bio: "",
  });

  const [isLoading, setIsLoading] = useState(true);   // loading awal (fetch profil)
  const [isSaving, setIsSaving] = useState(false);    // loading saat simpan
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ─── Fetch profil dari API saat halaman dibuka ───────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setErrorMsg("Sesi tidak ditemukan. Silakan login ulang.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/guru/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Gagal memuat profil.");
        }

        const p = data.data;
        setFormData({
          nama_lengkap:   p.nama_lengkap    || "",
          email:          p.email           || "",
          nip:            p.nip             || "",
          no_hp:          p.no_hp           || "",
          jenjang:        p.jenjang         || "",
          kurikulum:      p.kurikulum       || "",
          // mata_pelajaran di DB berupa array, tampilkan sebagai string
          mata_pelajaran: Array.isArray(p.mata_pelajaran)
            ? p.mata_pelajaran.join(", ")
            : p.mata_pelajaran || "",
          bio: "",
        });
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ─── Kirim perubahan ke API saat tombol Simpan diklik ────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setErrorMsg("Sesi tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch(`${API_URL}/api/guru/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap:   formData.nama_lengkap,
          nip:            formData.nip,
          no_hp:          formData.no_hp,
          jenjang:        formData.jenjang,
          kurikulum:      formData.kurikulum,
          // Kirim sebagai array agar sesuai format backend
          mata_pelajaran: formData.mata_pelajaran
            ? formData.mata_pelajaran.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan perubahan.");
      }

      // Update localStorage agar nama di sidebar ikut berubah
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, nama_lengkap: formData.nama_lengkap })
      );

      setSuccessMsg("Profil berhasil diperbarui!");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "Profil",      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: "Madrasah",    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: "Notifikasi",  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: "Tampilan",    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
    { id: "Keamanan",   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
  ];

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "UA";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-gray-900 m-0">Pengaturan</h1>
        <p className="text-[13px] text-gray-500 m-0 mt-2">
          Kelola profil, mata pelajaran, notifikasi, dan keamanan akun Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between bg-[#F6F4EE] p-1.5 rounded-2xl border border-gray-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] overflow-x-auto hidden-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex-1 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
          >
            {tab.icon}
            {tab.id}
          </button>
        ))}
      </div>

      {/* ─── TAB PROFIL ───────────────────────────────────────────────────── */}
      {activeTab === "Profil" && (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 m-0">Profil Akun</h3>
            <p className="text-[13px] text-gray-500 m-0 mt-1">Informasi yang akan tampil di seluruh aplikasi.</p>
          </div>

          {/* Loading skeleton */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-28" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 rounded-full bg-[#006747] text-white font-bold flex items-center justify-center text-xl shadow-sm border-2 border-emerald-800/30">
                  {getInitials(formData.nama_lengkap)}
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900 m-0">{formData.nama_lengkap || "—"}</h4>
                  <p className="text-[13px] text-gray-500 m-0 mt-0.5">Guru {formData.mata_pelajaran}</p>
                </div>
              </div>

              {/* Notifikasi sukses / error */}
              {successMsg && (
                <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.nama_lengkap}
                      onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      title="Email tidak dapat diubah"
                      className="w-full px-4 py-2.5 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 text-sm shadow-sm cursor-not-allowed"
                    />
                  </div>

                  {/* No. Telepon */}
                  <div>
                    <label className="block text-[13px] text-gray-700 mb-2 font-semibold">No. Telepon</label>
                    <input
                      type="text"
                      value={formData.no_hp}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                      placeholder="08xx-xxxx-xxxx"
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Mata Pelajaran */}
                  <div>
                    <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={formData.mata_pelajaran}
                      onChange={(e) => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                      placeholder="Contoh: Fiqih, Akidah"
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* NIP */}
                  <div>
                    <label className="block text-[13px] text-gray-700 mb-2 font-semibold">NIP</label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="Nomor Induk Pegawai"
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Jenjang */}
                  <div>
                    <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Jenjang</label>
                    <select
                      value={formData.jenjang}
                      onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    >
                      <option value="">-- Pilih Jenjang --</option>
                      <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                      <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
                      <option value="MA">MA (Madrasah Aliyah)</option>
                    </select>
                  </div>

                </div>

                {/* Bio Singkat */}
                <div>
                  <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Bio Singkat</label>
                  <textarea
                    rows="3"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tentang Anda..."
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 text-[13px] font-semibold text-white bg-[#006747] rounded-xl shadow-sm hover:bg-[#005238] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Tab Content Placeholder (Madrasah, Notifikasi, dll) */}
      {activeTab !== "Profil" && (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            {tabs.find((t) => t.id === activeTab)?.icon}
          </div>
          <h3 className="text-xl font-serif text-gray-900 m-0 mb-2">Pengaturan {activeTab}</h3>
          <p className="text-sm text-gray-500 m-0">Halaman ini sedang dalam tahap pengembangan.</p>
        </div>
      )}

    </div>
  );
}
