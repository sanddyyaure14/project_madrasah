import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* BANNER UTAMA */}
      <div className="bg-[#006747] text-white p-6 rounded-2xl relative overflow-hidden shadow-sm">
        <p className="text-emerald-300/60 font-serif italic text-base m-0 mb-1">بسم الله</p>
        <h2 className="text-xl md:text-2xl font-bold max-w-xl leading-snug m-0">
          Mari mulai mempersiapkan pelajaran hari ini, Ust. Ahmad Fauzi.
        </h2>
        <p className="text-xs text-emerald-100/70 mt-2 max-w-md m-0">
          Pilih salah satu dari modul asesmen cerdas di bawah untuk memulai otomatisasi dokumen madrasah Anda.
        </p>
        <span className="absolute right-6 -bottom-6 text-9xl font-bold text-white/5 pointer-events-none select-none">ا</span>
      </div>

      {/* GRID KARTU MENU FITUR */}
      <div>
        <h3 className="text-base font-bold text-gray-900 m-0 mb-3">Pilih Alat Bantu Asesmen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* KARTU 1: WRITING FEEDBACK */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center text-xl mb-3">✍</div>
              <h4 className="font-bold text-sm text-gray-800 m-0">Writing Feedback</h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 mb-2">Umpan Balik Karangan</p>
              <p className="text-xs text-gray-500 leading-relaxed m-0">Berikan koreksi tata bahasa, skor, dan umpan balik konstruktif untuk karangan siswa secara otomatis.</p>
            </div>
            <Link href="/tools/writing-feedback" className="text-xs font-semibold text-emerald-700 mt-4 inline-block no-underline hover:underline">
              Buka Fitur →
            </Link>
          </div>

          {/* KARTU 2: WORKSHEET GENERATOR */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl mb-3">📄</div>
              <h4 className="font-bold text-sm text-gray-800 m-0">Worksheet Generator</h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 mb-2">Lembar Kerja Siswa</p>
              <p className="text-xs text-gray-500 leading-relaxed m-0">Rancang susunan soal (LKS) terstruktur sesuai topik bahasan madrasah yang siap cetak langsung.</p>
            </div>
            <Link href="/tools/worksheet-generator" className="text-xs font-semibold text-emerald-700 mt-4 inline-block no-underline hover:underline">
              Buka Fitur →
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}