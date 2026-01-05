
import React from 'react';
import { FileCode, Terminal, Folder, ExternalLink, AlertTriangle, Cloud } from 'lucide-react';
import { Layout } from '../components/layout/Layout';

export const NextJsReadme = () => {
    return (
        <Layout>
            <div className="space-y-8 animate-fade-in pb-12">
                <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase italic">Hostinger Deployment Guide</h1>
                    <p className="text-slate-600">Panduan mengunggah file ERP SIMULTAN ke subdomain erp.koperasisimultan.org.</p>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex gap-4">
                    <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                    <div>
                        <h3 className="font-black text-amber-900 uppercase text-xs tracking-widest mb-1">Peringatan Hostinger</h3>
                        <p className="text-sm text-amber-800 leading-relaxed">
                            Biasanya Hostinger meletakkan file <b>default.php</b> di folder baru. <b>Anda harus menghapus file tersebut</b> sebelum mengupload file aplikasi ini, jika tidak, website Anda akan tetap menampilkan halaman "Launching Soon" milik Hostinger.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Cloud size={18} className="text-blue-600" />
                            Urutan Langkah Upload
                        </h3>
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl font-medium text-sm text-slate-700 leading-relaxed shadow-sm space-y-4">
                            <div className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                                <p>Klik tombol <b>Download Project</b> di pojok kanan atas layar editor ini.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                                <p>Ekstrak file ZIP-nya di komputer Anda.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                                <p>Masuk ke <b>hPanel Hostinger &gt; File Manager</b> untuk domain erp.koperasisimultan.org.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                                <p>Buka folder <b>public_html</b> dan upload semua isi dari folder <b>dist</b> hasil ekstrak tadi.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-slate-300 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Terminal size={100} /></div>
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] mb-6 border-b border-white/10 pb-4">Struktur File Production</h3>
                        <p className="text-xs mb-4 text-slate-400 leading-relaxed">Pastikan folder <b>public_html</b> Anda di Hostinger berisi file-file berikut setelah di-upload:</p>
                        <div className="font-mono text-[11px] space-y-1">
                            <p className="text-blue-400">assets/</p>
                            <p className="text-green-400">index.html <span className="text-slate-600 font-sans italic ml-4">(File utama)</span></p>
                            <p className="text-blue-400">vite.svg</p>
                        </div>
                        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[10px] leading-relaxed italic">Catatan: Jika Anda tidak melihat folder 'dist' setelah mengekstrak ZIP, uploadlah seluruh file yang berada sejajar dengan file <b>index.html</b>.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
