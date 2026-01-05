import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Truck, Phone, MapPin, Search, X, Save, ArrowLeft } from 'lucide-react';
import { Vendor } from '../../types/database';
import { useNavigate } from 'react-router-dom';

export const VendorList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState<Partial<Vendor>>({
        name: '',
        contact_person: '',
        phone: '',
        address: '',
        category: 'SAPRODI'
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setVendors([
                { id: '1', name: 'Toko Tani Makmur', contact_person: 'Pak Haji', phone: '08123', address: 'Jl. Raya', category: 'SAPRODI' },
                { id: '2', name: 'CV ATK Jaya', contact_person: 'Budi', phone: '08124', address: 'Kota', category: 'OFFICE' }
            ]);
            setLoading(false);
            return;
        }
        const { data } = await supabase.from('vendors').select('*').order('name');
        if (data) setVendors(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!isConfigured()) { setShowModal(false); return; }

            if (editingId) {
                const { error } = await supabase.from('vendors').update(formData).eq('id', editingId);
                if (error) throw error;
                alert("Vendor berhasil diperbarui!");
            } else {
                const { error } = await supabase.from('vendors').insert([formData]);
                if (error) throw error;
                alert("Vendor berhasil ditambahkan!");
            }

            setShowModal(false);
            setEditingId(null);
            fetchVendors();
            setFormData({ name: '', contact_person: '', phone: '', address: '', category: 'SAPRODI' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (v: Vendor) => {
        setEditingId(v.id);
        setFormData({
            name: v.name,
            contact_person: v.contact_person || '',
            phone: v.phone || '',
            address: v.address || '',
            category: v.category as any
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus vendor ini?")) return;

        try {
            if (!isConfigured()) return;
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) throw error;
            alert("Vendor berhasil dihapus!");
            fetchVendors();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Layout>
            <button onClick={() => navigate('/finance/operational')} className="flex items-center text-slate-500 mb-6 gap-2 hover:text-slate-800 font-bold outline-none">
                <ArrowLeft size={16} /> Kembali ke Operasional
            </button>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Daftar Pemasok (Vendor)</h1>
                    <p className="text-slate-500 text-sm">Kelola data supplier Saprodi dan kebutuhan kantor.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', contact_person: '', phone: '', address: '', category: 'SAPRODI' });
                        setShowModal(true);
                    }}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-xl active:scale-95 transition-all"
                >
                    <Plus size={18} /> Tambah Vendor
                </button>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari vendor..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-20 text-center font-bold text-slate-300">Memuat Data...</div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-400 italic">Belum ada data vendor.</div>
                ) : filtered.map(v => (
                    <div key={v.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:shadow-lg transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Truck size={60} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${v.category === 'SAPRODI' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {v.category}
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-4">{v.name}</h3>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-slate-500"><Phone size={14} /> {v.phone || '-'}</div>
                            <div className="flex items-center gap-2 text-slate-500"><MapPin size={14} /> {v.address || '-'}</div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => handleEdit(v)}
                                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(v.id)}
                                className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-sm">
                                {editingId ? 'Edit Vendor' : 'Tambah Vendor Baru'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Perusahaan/Toko</label>
                                <input required className="w-full border-2 border-slate-100 rounded-2xl px-4 py-2 font-bold focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategori</label>
                                    <select className="w-full border-2 border-slate-100 rounded-2xl px-4 py-2 font-bold focus:border-blue-500 outline-none bg-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                                        <option value="SAPRODI">Saprodi</option>
                                        <option value="OFFICE">Kantor</option>
                                        <option value="LOGISTICS">Logistik</option>
                                        <option value="OTHER">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telepon</label>
                                    <input className="w-full border-2 border-slate-100 rounded-2xl px-4 py-2 font-bold focus:border-blue-500 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat</label>
                                <textarea className="w-full border-2 border-slate-100 rounded-2xl px-4 py-2 font-medium text-sm focus:border-blue-500 outline-none" rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all mt-4">
                                <Save size={18} /> Simpan Vendor
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};
