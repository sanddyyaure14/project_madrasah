"use client";

import { useState, useEffect } from "react";

export default function GuruSettingsPage() {
  const [activeTab, setActiveTab] = useState("Profil");
  const [user, setUser] = useState({ 
    nama_lengkap: "Ust. Ahmad Fauzi, S.Pd.I",
    email: "ahmad@madrasah.id",
    role: "guru",
    mata_pelajaran: "Fiqih & Akidah"
  });

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        setUser({
          ...userData,
          // Fallback mapel if undefined
          mata_pelajaran: userData.mata_pelajaran || "Fiqih & Akidah"
        });
      }
    } catch (e) {}
  }, []);

  const tabs = [
    { id: "Profil", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: "Madrasah", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: "Notifikasi", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: "Tampilan", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
    { id: "Keamanan", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
  ];

  const getInitials = (name) => {
    return name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "UA";
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert("Profil berhasil diperbarui!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-gray-900 m-0">Pengaturan</h1>
        <p className="text-[13px] text-gray-500 m-0 mt-2">Kelola profil, mata pelajaran, notifikasi, dan keamanan akun Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between bg-[#F6F4EE] p-1.5 rounded-2xl border border-gray-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] overflow-x-auto hidden-scrollbar">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex-1 whitespace-nowrap ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm border border-gray-200/60" : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            }`}
          >
            {tab.icon}
            {tab.id}
          </button>
        ))}
      </div>

      {/* Profil Akun Section */}
      {activeTab === "Profil" && (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 m-0">Profil Akun</h3>
            <p className="text-[13px] text-gray-500 m-0 mt-1">Informasi yang akan tampil di seluruh aplikasi.</p>
          </div>

          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-full bg-[#006747] text-white font-bold flex items-center justify-center text-xl shadow-sm border-2 border-emerald-800/30">
              {getInitials(user.nama_lengkap)}
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 m-0">{user.nama_lengkap}</h4>
              <p className="text-[13px] text-gray-500 m-0 mt-0.5">Guru {user.mata_pelajaran}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Nama Lengkap</label>
                <input 
                  type="text" 
                  defaultValue={user.nama_lengkap}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Email</label>
                <input 
                  type="email" 
                  defaultValue={user.email}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-700 mb-2 font-semibold">No. Telepon</label>
                <input 
                  type="text" 
                  defaultValue="08xx-xxxx-xxxx"
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Mata Pelajaran</label>
                <input 
                  type="text" 
                  defaultValue={user.mata_pelajaran}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-sm focus:outline-none shadow-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-gray-700 mb-2 font-semibold">Bio Singkat</label>
              <textarea 
                rows="3"
                placeholder="Tentang Anda..."
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="px-6 py-2.5 text-[13px] font-semibold text-white bg-[#006747] rounded-xl shadow-sm hover:bg-[#005238] transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Tab Content Placeholder */}
      {activeTab !== "Profil" && (
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            {tabs.find(t => t.id === activeTab)?.icon}
          </div>
          <h3 className="text-xl font-serif text-gray-900 m-0 mb-2">Pengaturan {activeTab}</h3>
          <p className="text-sm text-gray-500 m-0">Halaman ini sedang dalam tahap pengembangan.</p>
        </div>
      )}

    </div>
  );
}
