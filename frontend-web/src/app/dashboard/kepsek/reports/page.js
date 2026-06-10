"use client";

import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Fetch live summary data
    fetch("http://127.0.0.1:3000/api/kepsek/dashboard/summary")
      .then(res => res.json())
      .then(data => {
        if(data.success) setSummary(data.data);
      })
      .catch(err => console.error(err));
  }, []);

  const totalGenerate = summary?.card_total_generate?.total || 1284;
  const bulanIni = 312; // Mock
  const jamDihemat = "184j"; // Mock
  const rataRata = 54; // Mock

  const mapelData = [
    { name: "Bahasa Arab", count: 51, percent: "100%" },
    { name: "Fiqih", count: 38, percent: "75%" },
    { name: "Matematika", count: 33, percent: "65%" },
    { name: "Al-Qur'an Hadis", count: 27, percent: "53%" },
    { name: "Sejarah Kebudayaan Islam", count: 19, percent: "37%" },
    { name: "Akidah Akhlak", count: 14, percent: "27%" },
    { name: "IPA Terpadu", count: 0, percent: "0%" },
  ];

  const barHeights = [4, 8, 12, 10, 15, 20, 25, 18, 30, 45, 60, 85]; // Mock relative heights

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-gray-900 m-0">Laporan & Statistik</h1>
        <p className="text-[13px] text-gray-500 m-0 mt-2">Pantau penggunaan AI lintas mapel, guru, dan waktu.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">TOTAL GENERATE</p>
          <h4 className="text-3xl font-serif text-gray-900 m-0">{totalGenerate}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">BULAN INI</p>
          <h4 className="text-3xl font-serif text-gray-900 m-0">{bulanIni}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">JAM DIHEMAT</p>
          <h4 className="text-3xl font-serif text-gray-900 m-0">{jamDihemat}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">RATA-RATA / GURU</p>
          <h4 className="text-3xl font-serif text-gray-900 m-0">{rataRata}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tren Chart (Mockup) */}
        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-start mb-10">
            <h3 className="text-xl font-serif text-gray-900 m-0">Tren Generate per Bulan</h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              +12% MoM
            </span>
          </div>

          {/* Bar Chart CSS */}
          <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 border-b border-gray-100 pb-2 px-2">
            {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map((m, i) => (
              <div key={m} className="flex flex-col items-center gap-3 w-full group cursor-pointer">
                <div 
                  className="w-full bg-[#006747]/80 rounded-t-sm group-hover:bg-[#ECA823] transition-colors relative" 
                  style={{ height: `${barHeights[i]}%`, minHeight: '4px' }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] py-1 px-2 rounded transition-opacity">
                    {Math.floor(barHeights[i] * 3.12)}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mapel Horizontal Bar (Mockup) */}
        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 h-[400px] flex flex-col">
          <h3 className="text-xl font-serif text-gray-900 m-0 mb-6 shrink-0">Penggunaan per Mata Pelajaran</h3>
          
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 hidden-scrollbar">
            {mapelData.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[13px] text-gray-700 font-medium group-hover:text-[#006747] transition-colors">{item.name}</span>
                  <span className="text-[13px] text-gray-400 font-medium group-hover:text-gray-900 transition-colors">{item.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#ECA823] h-1.5 rounded-full group-hover:bg-[#006747] transition-all duration-500 ease-out" 
                    style={{ width: item.percent }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
