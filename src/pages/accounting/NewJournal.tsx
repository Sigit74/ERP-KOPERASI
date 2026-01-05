
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Plus, Trash2, Save, Scale } from 'lucide-react';
import { Coa } from '../../types/database';

export const NewJournal = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<Coa[]>([]);
    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState([{ account_id: '', debit: 0, credit: 0, desc: '' }, { account_id: '', debit: 0, credit: 0, desc: '' }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCoa = async () => {
            if (!isConfigured()) {
                setAccounts([
                    { id: '1', code: '1-1001', name: 'Kas', type: 'ASSET', normal_balance: 'DEBIT' },
                    { id: '2', code: '5-0001', name: 'Beban Lain', type: 'EXPENSE', normal_balance: 'DEBIT' }
                ]);
                return;
            }
            const { data } = await supabase.from('coa').select('*').order('code');
            if (data) setAccounts(data as unknown as Coa[]);
        };
        fetchCoa();
    }, []);

    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleAddLine = () => {
        setLines([...lines, { account_id: '', debit: 0, credit: 0, desc: '' }]);
    };

    const handleRemoveLine = (index: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        (newLines[index] as any)[field] = value;
        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) return alert("Jurnal tidak seimbang (Unbalanced)!");
        setLoading(true);

        try {
            if (!isConfigured()) {
                alert("Demo: Jurnal tersimpan!");
                navigate('/accounting/journals');
                return;
            }

            // 1. Create Header
            const { data: header, error: hErr } = await supabase.from('journal_entries').insert([{
                entry_number: `JE-${Date.now()}`,
                entry_date: entryDate,
                description: description,
                status: 'posted'
            }]).select().single();

            if (hErr) throw hErr;

            // 2. Create Lines
            const linePayload = lines.map(line => ({
                journal_id: header.id,
                coa_id: line.account_id,
                debit: line.debit,
                credit: line.credit,
                description: line.desc || description
            }));

            const { error: lErr } = await supabase.from('journal_lines').insert(linePayload);
            if (lErr) throw lErr;

            navigate('/accounting/journals');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/accounting/journals')} className="flex items-center text-slate-500 mb-6 gap-2"><ArrowLeft size={16} /> Kembali</button>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h1 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Scale size={20} /> Input Jurnal Baru</h1>

                    <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Transaksi</label>
                            <input type="date" required className="w-full border border-slate-300 rounded-lg px-3 py-2" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi / Keterangan</label>
                            <input type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Pembayaran Listrik Bulan Mei" />
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="grid grid-cols-12 gap-3 text-sm font-bold text-slate-500 px-2">
                            <div className="col-span-4">Akun (COA)</div>
                            <div className="col-span-3">Keterangan Baris</div>
                            <div className="col-span-2 text-right">Debit</div>
                            <div className="col-span-2 text-right">Kredit</div>
                            <div className="col-span-1"></div>
                        </div>

                        {lines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-2 rounded-md">
                                <div className="col-span-4">
                                    <select required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={line.account_id} onChange={e => updateLine(idx, 'account_id', e.target.value)}>
                                        <option value="">-- Pilih Akun --</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" placeholder="Opsional..." value={line.desc} onChange={e => updateLine(idx, 'desc', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" min="0" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right" value={line.debit} onChange={e => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)} disabled={line.credit > 0} />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" min="0" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right" value={line.credit} onChange={e => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)} disabled={line.debit > 0} />
                                </div>
                                <div className="col-span-1 text-center">
                                    <button type="button" onClick={() => handleRemoveLine(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={handleAddLine} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
                            <Plus size={14} /> Tambah Baris
                        </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg flex justify-end gap-8 text-sm border border-slate-200">
                        <div className="text-right">
                            <div className="text-slate-500 mb-1">Total Debit</div>
                            <div className="font-mono font-bold text-lg">{new Intl.NumberFormat('id-ID').format(totalDebit)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-500 mb-1">Total Kredit</div>
                            <div className="font-mono font-bold text-lg">{new Intl.NumberFormat('id-ID').format(totalCredit)}</div>
                        </div>
                    </div>

                    <div className={`mt-4 p-3 text-center text-sm font-bold rounded-lg ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isBalanced ? "BALANCE (Seimbang)" : "TIDAK BALANCE (Periksa Debit/Kredit)"}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={!isBalanced || loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex gap-2 items-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save size={18} /> Simpan Jurnal
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
