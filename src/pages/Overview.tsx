
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, ExternalLink, Database, Globe, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

export const Overview = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* Tombol Kembali */}
      <div className="flex justify-start">
        <button 
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-all"
        >
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all shadow-sm">
                <ArrowLeft size={18}/>
            </div>
            Kembali ke Dashboard
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
            <h1 className="text-4xl font-black mb-4 tracking-tight uppercase italic">Status Deployment</h1>
            <p className="text-lg opacity-90 max-w-2xl leading-relaxed">
              Sistem ERP SIMULTAN Anda sudah siap 100%. Saat ini domain <b>koperasisimultan.org</b> sedang dalam tahap konfigurasi server.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Domain */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative group">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={24}/>
          </div>
          <h3 className="font-bold text-xl text-slate-800 mb-3 uppercase tracking-tight">Hostinger Server</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Halaman "Coming Soon" biru milik Hostinger akan hilang setelah Anda menghapus file <code>default.php</code> di hPanel.
          </p>
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg w-fit border border-amber-100">
            <Clock size={14}/> Menunggu Aksi User
          </div>
        </div>

        {/* Database Ready */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative group">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <Database size={24}/>
          </div>
          <h3 className="font-bold text-xl text-slate-800 mb-3 uppercase tracking-tight">Koneksi Database</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Kredensial Supabase sudah tertanam secara otomatis di dalam kode. Anda tidak perlu lagi melakukan setting manual di server.
          </p>
          <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg w-fit border border-green-100">
            <CheckCircle size={14}/> Terhubung ke Cloud
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 p-10 opacity-5 rotate-12"><Terminal size={150}/></div>
          <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-blue-400 mb-6 border-b border-white/10 pb-4">Prosedur Akhir Go-Live</h4>
          <div className="space-y-6 relative z-10">
              <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-lg shadow-blue-500/20">1</div>
                  <div>
                      <p className="text-sm font-bold mb-1">Download Project</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Gunakan fitur <b>"Download Project"</b> di pojok kanan atas layar ini untuk mengambil seluruh file aplikasi terbaru.</p>
                  </div>
              </div>
              <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-lg shadow-blue-500/20">2</div>
                  <div>
                      <p className="text-sm font-bold mb-1">Upload ke public_html</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Ekstrak filenya, lalu upload isi foldernya ke folder <code>public_html</code> di hPanel Hostinger.</p>
                  </div>
              </div>
              <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-lg shadow-red-500/20">3</div>
                  <div>
                      <p className="text-sm font-bold mb-1 text-red-400 uppercase">Hapus File default.php</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Pastikan Anda menghapus file <code>default.php</code> milik Hostinger agar aplikasi <b>SIMULTAN</b> bisa tampil sempurna.</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
