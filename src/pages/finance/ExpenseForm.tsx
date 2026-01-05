import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, TrendingDown, DollarSign, Calendar, FileText, User } from 'lucide-react';
import { NumberInput } from '../../components/ui/NumberInput';
import { Coa, Staff } from '../../types/database';

export const ExpenseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<Coa[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().slice(0, 10),
        category: 'ATK',
        amount: 0,
        notes: '',
        payment_method: 'CASH',
        staff_id: '',
        coa_id: ''
    });

    const categories = [
        { id: 'ATK', name: 'Alat Tulis Kantor (ATK)', coa: '5-1002' },
        { id: 'Transport', name: 'Transport & Bensin', coa: '5-1003' },
        { id: 'Upah', name: 'Upah / Gaji Staff', coa: '5-1001' },
        { id: 'Listrik', name: 'Listrik & Air', coa: '5-1004' },
        { id: 'Konsumsi', name: 'Konsumsi Rapat/Tamu', coa: '5-1005' },
        { id: 'Lainnya', name: 'Operasional Lainnya', coa: '5-1006' }
    ];

    useEffect(() => {
        fetchDependencies();
        if (id) fetchExpense();
    }, [id]);

    const fetchDependencies = async () => {
        if (!isConfigured()) {
            setAccounts([{ id: '1', code: '5-1001', name: 'Beban Gaji', type: 'EXPENSE', normal_balance: 'DEBIT' }]);
            setStaff([{ id: '1', full_name: 'Admin Koperasi', position: 'Admin', status: 'active', basic_salary: 0, allowance: 0, join_date: '' }]);
            return;
        }

        const [coaRes, staffRes] = await Promise.all([
            supabase.from('coa').select('*').eq('type', 'EXPENSE').order('code'),
            supabase.from('coop_staff').select('*').eq('status', 'active')
        ]);

        if (coaRes.data) setAccounts(coaRes.data as unknown as Coa[]);
        if (staffRes.data) setStaff(staffRes.data as unknown as Staff[]);
    };

    const fetchExpense = async () => {
        if (!isConfigured()) return;
        const { data, error } = await supabase.from('operational_expenses').select('*').eq('id', id).single();
        if (data) {
            setFormData({
                expense_date: data.expense_date,
                category: data.category,
                amount: data.amount,
                notes: data.notes || '',
                payment_method: data.payment_method,
                staff_id: data.staff_id || '',
                coa_id: data.coa_id || ''
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (formData.amount <= 0) {
            alert("Jumlah pengeluaran harus lebih dari 0.");
            setLoading(false);
            return;
        }

        try {
            if (!isConfigured()) {
                setTimeout(() => {
                    alert("Mode Demo: Pengeluaran berhasil disimpan.");
                    navigate('/finance/operational');
                }, 500);
                return;
            }

            // Prepare data: convert empty strings to null for UUID fields
            const dataToSave = {
                ...formData,
                staff_id: formData.staff_id || null,
                coa_id: formData.coa_id || null
            };

            if (id) {
                const { error } = await supabase.from('operational_expenses').update(dataToSave).eq('id', id);
                if (error) throw error;
                alert("Pengeluaran berhasil diperbarui!");
            } else {
                const { error } = await supabase.from('operational_expenses').insert([dataToSave]);
                if (error) throw error;
                alert("Pengeluaran berhasil disimpan!");
            }

            navigate('/finance/operational');
        } catch (err: any) {
            alert("Gagal menyimpan: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        const coa = accounts.find(a => a.code === cat?.coa);
        setFormData({
            ...formData,
            category: catId,
            coa_id: coa ? coa.id : formData.coa_id
        });
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/finance/operational')} className="flex items-center text-slate-500 mb-6 gap-2 hover:text-slate-800 font-bold">
                    <ArrowLeft size={16} /> Kembali
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 bg-slate-900 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-red-500 rounded-2xl flex items-center justify-center">
                                <TrendingDown size={24} />
                            </div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Catat Pengeluaran Kas</h1>
                        </div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Input Biaya Operasional & Beban</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Calendar size={14} /> Tanggal Transaksi
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 focus:border-red-500 outline-none transition-all font-bold"
                                    value={formData.expense_date}
                                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FileText size={14} /> Kategori Biaya
                                </label>
                                <select
                                    required
                                    className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 focus:border-red-500 bg-white outline-none transition-all font-bold"
                                    value={formData.category}
                                    onChange={e => handleCategoryChange(e.target.value)}
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <DollarSign size={14} /> Jumlah Pengeluaran (Rp)
                            </label>
                            <NumberInput
                                required
                                className="w-full border-2 border-slate-100 rounded-3xl px-6 py-4 text-3xl font-black text-red-600 focus:border-red-500 outline-none transition-all shadow-inner bg-slate-50"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Metode Pembayaran</label>
                                <div className="flex gap-2">
                                    {['CASH', 'BANK_TRANSFER'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, payment_method: m as any })}
                                            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.payment_method === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {formData.category === 'Upah' && (
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <User size={14} /> Pilih Staff
                                    </label>
                                    <select
                                        className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 bg-white font-bold"
                                        value={formData.staff_id}
                                        onChange={e => setFormData({ ...formData, staff_id: e.target.value })}
                                    >
                                        <option value="">-- Pilih Nama --</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.position})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Catatan / Keterangan Tambah</label>
                            <textarea
                                rows={3}
                                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-red-500 transition-all font-medium text-sm"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Contoh: Belanja kertas HVS A4 2 rim..."
                            />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/finance/operational')}
                                className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest bg-slate-100 rounded-3xl hover:bg-slate-200 transition-all shadow-md active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};
