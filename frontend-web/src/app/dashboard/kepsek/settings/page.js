"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function KepsekSettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil");

  // ── Profil state ──────────────────────────────────────────────────────────
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail]             = useState("");
  const [noHp, setNoHp]               = useState("");
  const [nip, setNip]                 = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile]   = useState(false);
  const [profileMsg, setProfileMsg]         = useState({ type: "", text: "" });

  // ── Password state ────────────────────────────────────────────────────────
  const [passwordLama, setPasswordLama]   = useState("");
  const [passwordBaru, setPasswordBaru]   = useState("");
  const [konfirmasi, setKonfirmasi]       = useState("");
  const [savingPw, setSavingPw]           = useState(false);
  const [pwMsg, setPwMsg]                 = useState({ type: "", text: "" });

  const tabs = [
    { id: "Profil",    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: "Keamanan",  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
  ];

  const getInitials = (name) =>
    name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "KA";

  // ── Fetch profil dari backend ─────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = sessionStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/kepsek/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setNamaLengkap(d.nama_lengkap || "");
          setEmail(d.email || "");
          setNoHp(d.no_hp || "");
          setNip(d.nip || "");
          // Simpan ke sessionStorage supaya sidebar langsung update
          const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
          sessionStorage.setItem("user", JSON.stringify({ ...stored, ...d }));
        }
      } catch (e) {
        console.error("Gagal fetch profil:", e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Simpan profil ─────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      setProfileMsg({ type: "error", text: "Nama lengkap wajib diisi." });
      return;
    }
    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/kepsek/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nama_lengkap: namaLengkap.trim(), no_hp: noHp.trim() || null, nip: nip.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan profil.");
      // Update sessionStorage
      const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
      sessionStorage.setItem("user", JSON.stringify({ ...stored, nama_lengkap: namaLengkap.trim() }));
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Ganti password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordLama || !passwordBaru || !konfirmasi) {
      setPwMsg({ type: "error", text: "Semua field wajib diisi." });
      return;
    }
    if (passwordBaru !== konfirmasi) {
      setPwMsg({ type: "error", text: "Password baru dan konfirmasi tidak cocok." });
      return;
    }
    if (passwordBaru.length < 8) {
      setPwMsg({ type: "error", text: "Password baru minimal 8 karakter." });
      return;
    }
    setSavingPw(true);
    setPwMsg({ type: "", text: "" });
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/guru/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password_lama: passwordLama, password_baru: passwordBaru }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mengubah password.");
      setPwMsg({ type: "success", text: "Password berhasil diubah." });
      setPasswordLama(""); setPasswordBaru(""); setKonfirmasi("");
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-gray-900 m-0">Pengaturan</h1>
        <p className="text-[13px] text-gray-500 m-0 mt-2">Kelola profil dan keamanan akun Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F6F4EE] p-1.5 rounded-2xl border border-gray-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
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

      {/* ── TAB PROFIL ── */}
      {activeTab === "Profil" && (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 m-0">Profil Akun</h3>
            <p className="text-[13px] text-gray-500 m-0 mt-1">Informasi yang akan tampil di seluruh aplikasi.</p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-full bg-[#ECA823] text-black font-bold flex items-center justify-center text-xl shadow-sm border-2 border-amber-200">
              {getInitials(namaLengkap)}
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 m-0">{namaLengkap || "—"}</h4>
              <p className="text-[13px] text-gray-500 m-0 mt-0.5">Kepala Madrasah</p>
            </div>
          </div>

          {loadingProfile ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
              Memuat profil...
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] text-gray-700 mb-2 font-semibold">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={e => setNamaLengkap(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 text-sm shadow-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-2 font-semibold">No. Telepon</label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={e => setNoHp(e.target.value)}
                    placeholder="cth. 08123456789"
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-700 mb-2 font-semibold">NIP</label>
                  <input
                    type="text"
                    value={nip}
                    onChange={e => setNip(e.target.value)}
                    placeholder="cth. 198001012005011001"
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {profileMsg.text && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {profileMsg.type === "success" ? "✓" : "⚠"} {profileMsg.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white bg-[#006747] rounded-xl shadow-sm hover:bg-[#005238] transition-colors disabled:opacity-60"
                >
                  {savingProfile ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                  ) : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── TAB KEAMANAN ── */}
      {activeTab === "Keamanan" && (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 m-0">Ubah Password</h3>
            <p className="text-[13px] text-gray-500 m-0 mt-1">Pastikan password baru minimal 8 karakter.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
            <div>
              <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Password Lama</label>
              <input
                type="password"
                value={passwordLama}
                onChange={e => setPasswordLama(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Password Baru</label>
              <input
                type="password"
                value={passwordBaru}
                onChange={e => setPasswordBaru(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={konfirmasi}
                onChange={e => setKonfirmasi(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>

            {pwMsg.text && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                pwMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {pwMsg.type === "success" ? "✓" : "⚠"} {pwMsg.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPw}
                className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white bg-[#006747] rounded-xl shadow-sm hover:bg-[#005238] transition-colors disabled:opacity-60"
              >
                {savingPw ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>
                ) : "Ubah Password"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
