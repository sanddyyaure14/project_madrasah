"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama_lengkap: "",
    mata_pelajaran: "",
    instansi_id: "",
    instansi_nama: "", // Untuk display summary
  });

  // OTP State
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");

  // Fetch Institutions on Mount
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const res = await fetch("http://127.0.0.1:3000/api/auth/institutions");
        const data = await res.json();
        if (data.success) {
          setInstitutions(data.data);
          if (data.data.length > 0) {
            setFormData(prev => ({ 
              ...prev, 
              instansi_id: data.data[0].id,
              instansi_nama: data.data[0].nama
            }));
          }
        }
      } catch (err) {
        console.error("Gagal memuat institusi:", err);
      }
    };
    fetchInstitutions();
  }, []);

  // Handlers for next steps
  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }
    setErrorMsg("");
    // Generate random 6 digit OTP for demo
    setDemoOtp(Math.floor(100000 + Math.random() * 900000).toString());
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    if (otp !== demoOtp) {
      setErrorMsg("Kode OTP salah.");
      return;
    }
    setErrorMsg("");
    setStep(3);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.mata_pelajaran) {
      setErrorMsg("Nama dan mata pelajaran wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://127.0.0.1:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_lengkap: formData.nama_lengkap,
          email: formData.email.trim(),
          password: formData.password,
          mata_pelajaran: [formData.mata_pelajaran],
          instansi_id: formData.instansi_id
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registrasi gagal.");
      }

      setStep(4);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mendapatkan nama instansi terpilih saat dropdown diubah
  const handleInstansiChange = (e) => {
    const selectedId = e.target.value;
    const selectedInstansi = institutions.find(i => i.id === selectedId);
    setFormData(prev => ({
      ...prev,
      instansi_id: selectedId,
      instansi_nama: selectedInstansi ? selectedInstansi.nama : ""
    }));
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel (Green) */}
      <div className="hidden lg:flex w-[45%] bg-[#006747] text-white flex-col p-12 relative overflow-hidden">
        
        {/* Logo Section */}
        <div className="z-10 flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#ECA823] rounded-lg flex items-center justify-center text-black font-bold text-xl font-serif">
            الله
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif tracking-wide">MadrasahAI</h1>
            <p className="text-[#ECA823] text-[9px] tracking-[0.2em] font-medium uppercase mt-0.5">
              GURU CERDAS · BERKAH
            </p>
          </div>
        </div>

        {/* Breadcrumb Tag */}
        <div className="z-10 mb-6 inline-block">
          <div className="border border-emerald-500/50 text-emerald-100 text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Alur 1 — Registrasi & Login
          </div>
        </div>

        <h2 className="z-10 text-3xl font-serif leading-snug mb-10 max-w-sm drop-shadow-sm">
          Empat langkah singkat untuk mulai mengajar bersama MadrasahAI.
        </h2>

        {/* Stepper Vertical */}
        <div className="z-10 flex flex-col gap-8 ml-2 relative">
          {/* Vertical Line Connecting Steps */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-emerald-700/50 -z-10"></div>

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${step >= 1 ? 'bg-[#ECA823] text-black shadow-lg shadow-[#ECA823]/20' : 'border border-emerald-500 bg-[#005a3e] text-emerald-300'}`}>
              {step > 1 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : 1}
            </div>
            <div>
              <h3 className={`font-semibold text-[15px] ${step >= 1 ? 'text-white' : 'text-emerald-300/60'}`}>Registrasi Guru</h3>
              <p className="text-emerald-200/70 text-[13px] mt-0.5">Input email + password</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${step >= 2 ? 'bg-[#ECA823] text-black shadow-lg shadow-[#ECA823]/20' : 'border border-emerald-500 bg-[#005a3e] text-emerald-300'}`}>
              {step > 2 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : 2}
            </div>
            <div>
              <h3 className={`font-semibold text-[15px] ${step >= 2 ? 'text-white' : 'text-emerald-300/60'}`}>Verifikasi Email</h3>
              <p className="text-emerald-200/70 text-[13px] mt-0.5">Kode OTP dikirim ke email</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${step >= 3 ? 'bg-[#ECA823] text-black shadow-lg shadow-[#ECA823]/20' : 'border border-emerald-500 bg-[#005a3e] text-emerald-300'}`}>
              {step > 3 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : 3}
            </div>
            <div>
              <h3 className={`font-semibold text-[15px] ${step >= 3 ? 'text-white' : 'text-emerald-300/60'}`}>Profil & Administrasi</h3>
              <p className="text-emerald-200/70 text-[13px] mt-0.5">Data guru & pilihan madrasah</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${step >= 4 ? 'bg-[#ECA823] text-black shadow-lg shadow-[#ECA823]/20' : 'border border-emerald-500 bg-[#005a3e] text-emerald-300'}`}>
              4
            </div>
            <div>
              <h3 className={`font-semibold text-[15px] ${step >= 4 ? 'text-white' : 'text-emerald-300/60'}`}>Menunggu Persetujuan</h3>
              <p className="text-emerald-200/70 text-[13px] mt-0.5">Review oleh Kepala Madrasah</p>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="z-10 mt-auto pt-10">
          <div className="border border-emerald-500/30 bg-emerald-800/20 backdrop-blur-sm p-4 rounded-xl">
            <h2
              className="text-2xl font-medium mb-3 text-[#ECA823] drop-shadow-md text-right"
              dir="rtl"
              style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}
            >
              طَلَبُ الْعِلْمِ فَرِيضَةٌ
            </h2>
            <p className="text-xs text-emerald-200/80 leading-relaxed m-0">
              Akun guru baru akan aktif setelah Kepala Madrasah memberi persetujuan.
            </p>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 text-[250px] leading-none text-white/[0.03] font-serif select-none pointer-events-none">
          الله
        </div>
      </div>

      {/* Right Panel (Beige) */}
      <div className="w-full lg:w-[55%] bg-[#FDFBF7] flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md">
          
          {/* Main Card Content */}
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 w-full relative">
            
            {/* Step 1: Input Email + Password */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-xs font-bold text-emerald-700 tracking-wider mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  LANGKAH 1 / 4
                </div>
                <h2 className="text-2xl font-serif text-gray-900 mb-2">Buat akun guru</h2>
                <p className="text-gray-500 text-sm mb-6">Gunakan email instansi madrasah Anda.</p>

                {errorMsg && (
                  <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleNextStep1} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Email instansi</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="nama@madrasah.id"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Minimal 8 karakter"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Gunakan kombinasi huruf dan angka untuk keamanan.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 mt-2 bg-[#006747] hover:bg-emerald-800 text-white font-medium rounded-xl shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Lanjut
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Sudah punya akun? <Link href="/login" className="text-emerald-700 hover:text-emerald-800 font-semibold">Masuk di sini</Link>
                </div>
              </div>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-xs font-bold text-emerald-700 tracking-wider mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  LANGKAH 2 / 4
                </div>
                <h2 className="text-2xl font-serif text-gray-900 mb-2">Verifikasi email</h2>
                <p className="text-gray-500 text-sm mb-6">Masukkan 6 digit kode yang dikirim ke <span className="font-semibold text-gray-700">{formData.email}</span>.</p>

                {errorMsg && (
                  <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleNextStep2} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Kode OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // hanya angka
                      placeholder="• • • • • •"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-center tracking-[1em] font-bold text-xl text-gray-800"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button type="button" className="text-[13px] text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer" onClick={() => setDemoOtp(Math.floor(100000 + Math.random() * 900000).toString())}>
                      Kirim ulang kode
                    </button>
                    <div className="text-[11px] bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      Kode demo: <strong className="text-gray-700">{demoOtp}</strong>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3.5 bg-[#006747] hover:bg-emerald-800 text-white font-medium rounded-xl shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      Verifikasi
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Profile */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-xs font-bold text-emerald-700 tracking-wider mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  LANGKAH 3 / 4
                </div>
                <h2 className="text-2xl font-serif text-gray-900 mb-2">Profil Administrasi</h2>
                <p className="text-gray-500 text-sm mb-6">Lengkapi data Anda agar Kepala Madrasah dapat mengenali Anda.</p>

                {errorMsg && (
                  <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-gray-700">Nama Lengkap beserta Gelar</label>
                    <input
                      type="text"
                      value={formData.nama_lengkap}
                      onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                      placeholder="Contoh: Siti Afifah, S.Pd.I"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-gray-700">Mata Pelajaran (Utama)</label>
                    <input
                      type="text"
                      value={formData.mata_pelajaran}
                      onChange={(e) => setFormData({...formData, mata_pelajaran: e.target.value})}
                      placeholder="Contoh: Fikih, Sejarah Kebudayaan Islam"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-gray-700">Pilih Institusi / Madrasah</label>
                    <select
                      value={formData.instansi_id}
                      onChange={handleInstansiChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                    >
                      <option value="" disabled>-- Pilih Madrasah Anda --</option>
                      {institutions.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={loading}
                      className="w-1/3 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3 bg-[#006747] hover:bg-emerald-800 text-white font-medium rounded-xl shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Ajukan Registrasi"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="animate-in zoom-in-95 fade-in duration-500 text-center py-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                
                <h2
                  className="text-2xl mb-1 text-[#ECA823] drop-shadow-sm"
                  dir="rtl"
                  style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}
                >
                  جَزَاكُمُ اللهُ خَيْرًا
                </h2>
                <h1 className="text-2xl font-serif text-gray-900 mb-4">Pendaftaran terkirim</h1>
                
                <p className="text-sm text-gray-500 leading-relaxed mb-8 px-4">
                  Akun Anda menunggu persetujuan <strong className="text-gray-800">Kepala Madrasah</strong>. Anda akan menerima notifikasi via email setelah akun aktif, lalu dapat login dengan aman.
                </p>

                {/* Summary Box */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-left mb-8">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100/60">
                    <span className="text-[13px] text-gray-500">Email</span>
                    <span className="text-[13px] font-medium text-gray-900">{formData.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100/60">
                    <span className="text-[13px] text-gray-500">Nama</span>
                    <span className="text-[13px] font-medium text-gray-900">{formData.nama_lengkap}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100/60">
                    <span className="text-[13px] text-gray-500">Mapel</span>
                    <span className="text-[13px] font-medium text-gray-900">{formData.mata_pelajaran}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100/60">
                    <span className="text-[13px] text-gray-500">Madrasah</span>
                    <span className="text-[13px] font-medium text-gray-900">{formData.instansi_nama || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[13px] text-gray-500">Status</span>
                    <span className="text-[13px] font-medium text-[#ECA823]">Menunggu verifikasi admin</span>
                  </div>
                </div>

                <Link href="/login" className="block w-full py-3.5 bg-[#006747] hover:bg-emerald-800 text-white font-medium rounded-xl transition-all shadow-md">
                  Kembali ke halaman login →
                </Link>
              </div>
            )}
            
          </div>
          
          {/* External Toast / Alert below the card (visible in success screen screenshot) */}
          {step === 4 && (
            <div className="absolute bottom-8 right-8 animate-in slide-in-from-bottom-8 fade-in">
              <div className="bg-white px-5 py-4 rounded-xl shadow-lg border border-gray-100 flex items-start gap-3 w-80">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-[13px] text-gray-900">Data terkirim ke admin madrasah untuk diverifikasi.</h4>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
