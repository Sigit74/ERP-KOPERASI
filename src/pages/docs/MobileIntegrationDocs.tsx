
import React from 'react';
import { Layout } from '../../components/layout/Layout';
import { Smartphone, Zap, CloudOff, Database, Code, ShieldCheck, RefreshCw } from 'lucide-react';
import { SqlViewer } from '../../components/SqlViewer';

export const MobileIntegrationDocs = () => {
  const syncLogic = `// 1. Android Offline Storage (Pseudo-code)
val transaction = Transaction(
  id = UUID.randomUUID().toString(),
  offline_ref_id = "MOB-" + System.currentTimeMillis(), // CRITICAL for de-duplication
  farmer_id = "...",
  quantity = 100.5,
  source_platform = "android_ims",
  is_offline_created = true
)
sqlite.save(transaction)

// 2. Sync Trigger logic
if (NetworkUtils.isOnline(context)) {
  val pending = sqlite.query("SELECT * FROM transactions WHERE sync_status = 'PENDING'")
  supabase.post("/purchase_transactions", pending)
}`;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Smartphone className="text-blue-600" size={32}/> Android IMS Blueprint
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Panduan protokol integrasi aplikasi lapangan dengan arsitektur Offline-First.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-orange-50 border-2 border-orange-100 p-8 rounded-[2.5rem] flex flex-col gap-4">
                <div className="w-12 h-12 bg-orange-200 text-orange-700 rounded-2xl flex items-center justify-center">
                    <CloudOff size={24}/>
                </div>
                <h3 className="font-black text-orange-900 uppercase text-xs tracking-widest">Tantangan Koneksi</h3>
                <p className="text-sm text-orange-800 leading-relaxed">
                    Petugas IMS beroperasi di kebun dengan sinyal Edge atau tanpa sinyal sama sekali. <b>Aplikasi tidak boleh crash atau hang saat kehilangan koneksi.</b>
                </p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-100 p-8 rounded-[2.5rem] flex flex-col gap-4">
                <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-2xl flex items-center justify-center">
                    <RefreshCw size={24}/>
                </div>
                <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">Sinkronisasi Otomatis</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                    Gunakan <b>WorkManager</b> di Android untuk menjalankan proses sinkronisasi di latar belakang segera setelah perangkat mendapatkan akses internet.
                </p>
            </div>
        </div>

        <section className="space-y-6">
            <div className="flex items-center gap-3">
                <Code className="text-slate-400" size={20}/>
                <h2 className="font-black text-slate-800 uppercase text-sm tracking-widest">Protokol Penomoran Offline</h2>
            </div>
            <div className="bg-slate-900 rounded-[2rem] p-8 text-slate-300 font-mono text-xs leading-relaxed overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100}/></div>
                <SqlViewer title="android-sync-logic.kt" code={syncLogic} />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 mt-8">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-green-600"/> Rule Integritas Data
                </h3>
                <ul className="space-y-4">
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">1</div>
                        <p className="text-sm text-slate-600"><b>Upsert Pattern:</b> Selalu gunakan `offline_ref_id` sebagai kunci pengecekan di server untuk mencegah data yang sama terunggah dua kali jika terjadi interupsi saat sync.</p>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">2</div>
                        <p className="text-sm text-slate-600"><b>Master Data Cache:</b> Daftar Kelompok Tani dan Petani harus di-cache secara lokal (expire dalam 24 jam) agar petugas tetap bisa mendaftarkan panen tanpa internet.</p>
                    </li>
                    <li className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">3</div>
                        <p className="text-sm text-slate-600"><b>Geotagging:</b> Aplikasi Android wajib mengambil koordinat GPS secara otomatis saat transaksi dibuat offline untuk validasi asal-usul (traceability).</p>
                    </li>
                </ul>
            </div>
        </section>
      </div>
    </Layout>
  );
};
