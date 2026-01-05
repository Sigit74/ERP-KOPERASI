
import React, { useState } from 'react';
import { updateSupabaseConfig } from '../lib/supabase';
import { getAppConfig, saveAppConfig, AppBrandConfig } from '../lib/appConfig';
import {
    Database, ShieldCheck, ArrowLeft, Building2,
    Save, Layout, Cloud, Info, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/ui/FileUpload';

export const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'database' | 'branding'>('branding');

    const [url, setUrl] = useState(localStorage.getItem('simultan_sb_url') || '');
    const [key, setKey] = useState(localStorage.getItem('simultan_sb_key') || '');
    const [brand, setBrand] = useState<AppBrandConfig>(getAppConfig());

    const handleSaveDB = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !key) return alert("URL dan Key wajib diisi!");
        updateSupabaseConfig(url, key);
        alert('Konfigurasi database tersimpan! Aplikasi akan dimuat ulang untuk menghubungkan database baru.');
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row border border-white/10">

                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
                    <div className="mb-8">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg w-fit mb-4">
                            <Layout size={24} />
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">App Setup</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">SIMULTAN ERP</p>
                    </div>

                    <nav className="space-y-2 flex-1">
                        <button onClick={() => setActiveTab('branding')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'branding' ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><Building2 size={18} /> Branding</button>
                        <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'database' ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}><Database size={18} /> Database API</button>
                    </nav>

                    <button onClick={() => navigate('/')} className="mt-8 w-full bg-white border border-slate-200 text-slate-500 py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-50">
                        <ArrowLeft size={14} /> Kembali ke Login
                    </button>
                </div>

                <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                    {activeTab === 'branding' ? (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-black text-slate-800 mb-8">Identitas Aplikasi</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    await saveAppConfig(brand);
                                    alert("Branding berhasil disimpan dan disinkronkan ke database!");
                                    window.location.reload();
                                } catch (err: any) {
                                    alert("Berhasil menyimpan secara lokal, namun gagal sinkron ke DB: " + err.message);
                                }
                            }} className="space-y-6">
                                <FileUpload bucketName="images" label="Logo Koperasi" currentImage={brand.logoUrl} onUploadComplete={(_, url) => setBrand({ ...brand, logoUrl: url })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama Koperasi</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={brand.orgName} onChange={e => setBrand({ ...brand, orgName: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Alamat (Untuk Struk)</label>
                                        <textarea className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" rows={2} value={brand.address} onChange={e => setBrand({ ...brand, address: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">No. Telepon / WA</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={brand.phone} onChange={e => setBrand({ ...brand, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Email</label>
                                        <input type="email" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={brand.email} onChange={e => setBrand({ ...brand, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama App</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={brand.appName} onChange={e => setBrand({ ...brand, appName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Singkatan</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold uppercase" value={brand.appShortName} onChange={e => setBrand({ ...brand, appShortName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pajak PPN (%)</label>
                                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={brand.taxRate || 0} onChange={e => setBrand({ ...brand, taxRate: Number(e.target.value) })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Catatan Kaki Struk</label>
                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold" value={brand.receiptFooter || ''} onChange={e => setBrand({ ...brand, receiptFooter: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Save size={18} /> Simpan Branding</button>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <h2 className="text-2xl font-black text-slate-800">Koneksi Backend</h2>
                                <div className="px-2 py-1 bg-green-100 text-green-700 text-[8px] font-black rounded-md uppercase">Live Cloud</div>
                            </div>

                            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5 mb-8 flex gap-4 items-start">
                                <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                                <div>
                                    <p className="text-[11px] text-amber-900 leading-relaxed font-bold uppercase mb-1">Panduan Koneksi:</p>
                                    <p className="text-[10px] text-amber-800 leading-relaxed">
                                        Masukkan <b>URL</b> dan <b>Anon Key</b> yang Anda dapatkan dari Supabase (Settings &gt; API). Jika diisi, sistem akan berhenti menggunakan data demo dan mulai menyimpan ke database asli Anda.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveDB} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Supabase Project URL</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:ring-2 ring-blue-500" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://abcde.supabase.co" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Anon Public Key</label>
                                    <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] outline-none focus:ring-2 ring-blue-500" value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." required />
                                </div>
                                <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                                    <Cloud size={18} /> Aktifkan Database Baru
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
