
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Shield, Zap, ShieldCheck, AlertCircle, MousePointer2, Info, ArrowLeft, Home } from 'lucide-react';
import { SqlViewer } from '../components/SqlViewer';
import { staffSetupScript, fullScript } from '../services/sqlTemplates';

export const DatabaseDocs = () => {
  const navigate = useNavigate();
  const [activeSql, setActiveSql] = useState<'staff' | 'full'>('staff');

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <button 
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-all"
        >
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                <ArrowLeft size={18}/>
            </div>
            Kembali ke Dashboard
        </button>
      </div>

      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">KONFIGURASI BACKEND</h1>
            <p className="text-slate-500 mt-2">Sinkronisasi struktur database aplikasi dengan Supabase.</p>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-green-200 shadow-sm">
            <ShieldCheck size={20}/>
            <span className="text-xs font-black uppercase tracking-widest">Script Aman & Terproteksi</span>
        </div>
      </div>

      {/* INFO PENTING */}
      <div className="bg-blue-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><Database size={200}/></div>
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                      <Info size={20}/>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Instruksi Penting Pengaktifan</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                          <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2 mb-2">
                              <AlertCircle size={16}/> Gunakan Full Setup?
                          </h4>
                          <p className="text-xs text-blue-100 leading-relaxed">
                              Jika Anda ingin menguji seluruh aplikasi (Data Petani, Kartu Stok, Dashboard), pilihlah <b>Opsi 2: Full Setup</b>. Script ini sudah mencakup Opsi 1.
                          </p>
                      </div>
                  </div>

                  <div className="bg-black/20 rounded-3xl p-6 text-white border border-white/5">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Cara Menjalankan:</p>
                      <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                              <p className="text-xs text-slate-300">Copy kode di bawah ini.</p>
                          </li>
                          <li className="flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                              <p className="text-xs text-slate-300">Buka <b>SQL Editor</b> di Dashboard Supabase.</p>
                          </li>
                          <li className="flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                              <p className="text-xs text-slate-300 font-bold text-green-400">Paste dan Klik <b>RUN</b>.</p>
                          </li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
         <button 
            onClick={() => setActiveSql('staff')} 
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSql === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'}`}
         >
            <Shield size={16}/> 1. Setup Akses Staff
         </button>
         <button 
            onClick={() => setActiveSql('full')} 
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSql === 'full' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'}`}
         >
            <Zap size={16}/> 2. Full Setup (Disarankan)
         </button>
      </div>

      {activeSql === 'staff' ? (
         <div className="space-y-6 animate-fade-in">
            <SqlViewer 
                title="SQL SCRIPT: SETUP AKSES STAFF" 
                description="Menyiapkan sistem login dan manajemen team."
                code={staffSetupScript} 
            />
         </div>
      ) : (
         <div className="space-y-6 animate-fade-in">
            <SqlViewer 
                title="SQL SCRIPT: FULL DATABASE SETUP" 
                description="Menyiapkan seluruh tabel operasional SIMULTAN ERP."
                code={fullScript} 
            />
         </div>
      )}

      {/* FOOTER ACTION */}
      <div className="pt-10 border-t border-slate-200 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-400 font-medium italic">Selesai menjalankan script?</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95"
          >
            <Home size={18}/> Kembali ke Dashboard Utama
          </button>
      </div>
    </div>
  );
};
