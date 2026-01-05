
import React, { useState } from 'react';
import { Rocket, Shield, Server, CheckSquare, AlertTriangle, Globe, Lock, HardDrive, FileCode, Info, Trash2, Database, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DeploymentDocs = () => {
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const toggleCheck = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
            <div className="border-b border-slate-200 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">Backend Connectivity Guide</h1>
                    <p className="text-slate-600 font-medium">Langkah menghubungkan SIMULTAN ERP ke Database Cloud Anda.</p>
                </div>
                <button onClick={() => navigate('/settings')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Key size={16} /> Buka App Setup
                </button>
            </div>

            {/* STEP 1: SUPABASE */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-900 text-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">1</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Setup Supabase (Backend)</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Waktu Estimasi: 3 Menit</p>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Database size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Buat Project Baru</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Buka <a href="https://supabase.com" target="_blank" className="text-blue-600 font-bold underline">supabase.com</a>, buat project bernama <b>SIMULTAN ERP</b>. Pilih Region Singapore untuk akses tercepat.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0"><FileCode size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Inisialisasi Tabel (SQL)</p>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">Pergi ke menu <b>SQL Editor</b> di Supabase, pilih <b>New Query</b>, lalu Copy-Paste script dari menu <b>SQL Script</b> di sidebar aplikasi ini dan klik <b>RUN</b>.</p>
                            <button onClick={() => navigate('/docs/database')} className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">Lihat SQL Script &rarr;</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 2: CONNECTION */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 bg-blue-600 text-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">2</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Hubungkan Aplikasi</h2>
                        <p className="text-xs text-blue-100 font-bold uppercase tracking-widest">Waktu Estimasi: 1 Menit</p>
                    </div>
                </div>
                <div className="p-8">
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1">
                            <p className="text-sm text-blue-900 leading-relaxed">
                                Dapatkan <b>Project URL</b> dan <b>Anon Public Key</b> dari dashboard Supabase Anda (Settings &gt; API). Masukkan kode tersebut di menu <b>Konfigurasi</b> aplikasi ini.
                            </p>
                        </div>
                        <button onClick={() => navigate('/settings')} className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-xl transition-all">Setting Sekarang</button>
                    </div>
                </div>
            </section>

            {/* STEP 3: WEB HOSTING */}
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-900 text-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">3</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">Deploy ke Hostinger</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Website: koperasisimultan.org</p>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex gap-4 items-start">
                        <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                        <div>
                            <h4 className="font-black text-amber-900 text-sm uppercase">PENTING: Hapus File default.php</h4>
                            <p className="text-xs text-amber-800 leading-relaxed mt-1">
                                Hostinger secara default menyertakan file <code>default.php</code> yang menampilkan halaman "Launching Soon" biru. Anda <b>WAJIB</b> menghapus file tersebut melalui File Manager di hPanel sebelum mengupload file aplikasi ini.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <Globe className="text-blue-600 mb-3" size={24} />
                            <h4 className="font-bold text-slate-800 text-sm">Upload public_html</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-2">Upload isi folder hasil build ke folder <code>public_html</code> di hPanel Hostinger.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <Lock className="text-green-600 mb-3" size={24} />
                            <h4 className="font-bold text-slate-800 text-sm">SSL Certificate</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-2">Pastikan SSL (HTTPS) aktif di Hostinger agar koneksi API Supabase berjalan lancar.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
