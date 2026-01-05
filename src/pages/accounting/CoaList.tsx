
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Coa } from '../../types/database';

export const CoaList = () => {
    const [accounts, setAccounts] = useState<Coa[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<Coa>>({
        code: '',
        name: '',
        type: 'ASSET',
        normal_balance: 'DEBIT'
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setLoading(false);
            return;
        }
        const { data } = await supabase.from('coa').select('*').order('code');
        if (data) setAccounts(data as unknown as Coa[]);
        setLoading(false);
    };

    const getTypeColor = (type: string) => {
        const colors: any = {
            'ASSET': 'bg-blue-100 text-blue-700',
            'LIABILITY': 'bg-red-100 text-red-700',
            'EQUITY': 'bg-purple-100 text-purple-700',
            'REVENUE': 'bg-green-100 text-green-700',
            'EXPENSE': 'bg-orange-100 text-orange-700',
        };
        return colors[type] || 'bg-slate-100';
    };

    const handleEdit = (acc: Coa) => {
        setFormData(acc);
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus akun ini?")) return;

        const { error } = await supabase.from('coa').delete().eq('id', id);
        if (error) alert("Gagal hapus: " + error.message);
        else fetchAccounts();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple Validation
        if (!formData.code || !formData.name) {
            alert("Kode dan Nama Akun wajib diisi");
            return;
        }

        const payload = {
            code: formData.code,
            name: formData.name,
            type: formData.type,
            normal_balance: formData.normal_balance
        };

        try {
            if (editMode && formData.id) {
                const { error } = await supabase.from('coa').update(payload).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('coa').insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchAccounts();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    const openAddModal = () => {
        setFormData({ code: '', name: '', type: 'ASSET', normal_balance: 'DEBIT' });
        setEditMode(false);
        setShowModal(true);
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Chart of Accounts (COA)</h1>
                    <p className="text-slate-500">Daftar Akun Buku Besar.</p>
                </div>
                <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 shadow-sm transition-colors">
                    <Plus size={16} /> Tambah Akun
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                        <tr>
                            <th className="px-6 py-4">Kode Akun</th>
                            <th className="px-6 py-4">Nama Akun</th>
                            <th className="px-6 py-4">Tipe / Klasifikasi</th>
                            <th className="px-6 py-4">Saldo Normal</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr> :
                            accounts.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada data COA. Silakan tambah baru.</td></tr> :
                                accounts.map(acc => (
                                    <tr key={acc.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-700">{acc.code}</td>
                                        <td className="px-6 py-4 font-medium">{acc.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeColor(acc.type)}`}>
                                                {acc.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold uppercase text-slate-500">{acc.normal_balance}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEdit(acc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{editMode ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kode Akun</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Contoh: 1-1001"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Akun</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Kas Kecil"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipe</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="ASSET">ASSET</option>
                                        <option value="LIABILITY">LIABILITY</option>
                                        <option value="EQUITY">EQUITY</option>
                                        <option value="REVENUE">REVENUE</option>
                                        <option value="EXPENSE">EXPENSE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Saldo Normal</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        value={formData.normal_balance}
                                        onChange={e => setFormData({ ...formData, normal_balance: e.target.value as any })}
                                    >
                                        <option value="DEBIT">DEBIT</option>
                                        <option value="CREDIT">CREDIT</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-2 flex justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                                <Save size={18} /> Simpan Akun
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

