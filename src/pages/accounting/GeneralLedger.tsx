
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { FileText, Filter, Printer, FileDown } from 'lucide-react';
import { exportToExcel, printReport } from '../../lib/excelUtils';
import { Coa } from '../../types/database';

export const GeneralLedger = () => {
    const [accounts, setAccounts] = useState<Coa[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCoa = async () => {
            if (!isConfigured()) return;
            const { data } = await supabase.from('coa').select('*').order('code');
            if (data) setAccounts(data as unknown as Coa[]);
        };
        fetchCoa();
    }, []);

    const fetchLedger = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            if (!isConfigured()) {
                setLines([
                    { entry_date: '2024-05-20', entry_number: 'JE-001', journal_desc: 'Demo Trx', debit: 1000000, credit: 0 }
                ]);
                return;
            }
            // Use the View created in SQL
            const { data, error } = await supabase
                .from('view_general_ledger')
                .select('*')
                .eq('account_id', selectedAccount)
                .order('entry_date', { ascending: true });

            if (error) throw error;
            if (data) setLines(data);
        } catch (err) {
            console.error(err);
            alert("Gagal memuat buku besar (Pastikan View SQL sudah dibuat)");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const account = accounts.find(a => a.id === selectedAccount);
        const data = lines.map(l => ({
            Tanggal: new Date(l.entry_date).toLocaleDateString(),
            'No. Ref': l.entry_number,
            Keterangan: l.journal_desc,
            Debit: l.debit,
            Kredit: l.credit
        }));
        exportToExcel(data, `Buku_Besar_${account?.name || 'Simultan'}`);
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Buku Besar (General Ledger)</h1>
                    <p className="text-slate-500 text-sm italic">Mutasi detail per akun perkiraan.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => printReport('Buku Besar')}
                        disabled={lines.length === 0}
                        className="text-slate-600 hover:text-slate-900 px-4 py-2 border rounded-lg bg-white flex items-center gap-2 font-bold text-sm disabled:opacity-50"
                    >
                        <Printer size={18} /> Print
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={lines.length === 0}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        <FileDown size={18} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Akun</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                        <option value="">-- Pilih Akun --</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                </div>
                <button onClick={fetchLedger} disabled={!selectedAccount || loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                    <Filter size={18} className="inline mr-2" /> Tampilkan
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                        <tr>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">No. Ref</th>
                            <th className="px-6 py-4">Keterangan</th>
                            <th className="px-6 py-4 text-right">Debit</th>
                            <th className="px-6 py-4 text-right">Kredit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr> :
                            lines.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-slate-400">Pilih akun untuk melihat mutasi.</td></tr> :
                                lines.map((l, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">{new Date(l.entry_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-mono text-blue-600">{l.entry_number}</td>
                                        <td className="px-6 py-4">{l.journal_desc}</td>
                                        <td className="px-6 py-4 text-right">{l.debit > 0 ? new Intl.NumberFormat('id-ID').format(l.debit) : '-'}</td>
                                        <td className="px-6 py-4 text-right">{l.credit > 0 ? new Intl.NumberFormat('id-ID').format(l.credit) : '-'}</td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};
