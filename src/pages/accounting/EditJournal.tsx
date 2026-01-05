
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Plus, Trash2, Save, Scale } from 'lucide-react';
import { Coa } from '../../types/database';

interface JournalLine {
    account_id: string;
    debit: number;
    credit: number;
    desc: string;
}

export const EditJournal = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [accounts, setAccounts] = useState<Coa[]>([]);
    const [entryDate, setEntryDate] = useState('');
    const [description, setDescription] = useState('');
    const [entryNumber, setEntryNumber] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([{ account_id: '', debit: 0, credit: 0, desc: '' }]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fetchCoa();
            await fetchJournal();
        };
        init();
    }, [id]);

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

    const fetchJournal = async () => {
        if (!isConfigured()) {
            setEntryNumber('JE-2024-001');
            setEntryDate('2024-05-20');
            setDescription('Setoran Modal Awal');
            setLines([
                { account_id: '1', debit: 5000000, credit: 0, desc: '' },
                { account_id: '2', debit: 0, credit: 5000000, desc: '' }
            ]);
            setLoading(false);
            return;
        }

        try {
            const { data: journalData, error: journalError } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('id', id)
                .single();

            if (journalError) throw journalError;

            const { data: linesData, error: linesError } = await supabase
                .from('journal_lines')
                .select('*')
                .eq('journal_id', id);

            if (linesError) throw linesError;

            setEntryNumber(journalData.entry_number);
            setEntryDate(journalData.entry_date);
            setDescription(journalData.description);
            setLines(linesData.map(line => ({
                account_id: line.coa_id,
                debit: line.debit || 0,
                credit: line.credit || 0,
                desc: line.description || ''
            })));

        } catch (err: any) {
            alert('Error: ' + err.message);
            navigate('/accounting/journals');
        } finally {
            setLoading(false);
        }
    };

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
        setSaving(true);

        try {
            if (!isConfigured()) {
                alert("Demo: Jurnal diperbarui!");
                navigate('/accounting/journals');
                return;
            }

            // 1. Update Header
            const { error: hErr } = await supabase
                .from('journal_entries')
                .update({
                    entry_date: entryDate,
                    description: description
                })
                .eq('id', id);

            if (hErr) throw hErr;

            // 2. Delete Old Lines
            const { error: delErr } = await supabase
                .from('journal_lines')
                .delete()
                .eq('journal_id', id);

            if (delErr) throw delErr;

            // 3. Insert New Lines
            const linePayload = lines.map(line => ({
                journal_id: id,
                coa_id: line.account_id,
                debit: line.debit,
                credit: line.credit,
                description: line.desc || description
            }));

            const { error: lErr } = await supabase.from('journal_lines').insert(linePayload);
            if (lErr) throw lErr;

            alert('Jurnal berhasil diperbarui!');
            navigate('/accounting/journals');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="p-6 text-center">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/accounting/journals')} className="flex items-center text-slate-500 mb-6 gap-2"><ArrowLeft size={16} /> Kembali</button>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h1 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Scale size={20} /> Edit Jurnal: {entryNumber}</h1>

                    <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Transaksi</label>
                            <input type="date" required className="w-full border border-slate-300 rounded-lg px-3 py-2" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi / Keterangan</label>
                            <input type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} />
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
                        <button type="submit" disabled={!isBalanced || saving} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex gap-2 items-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save size={18} /> {saving ? 'Menyimpan...' : 'Update Jurnal'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
