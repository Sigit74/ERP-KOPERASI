
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Printer, FileDown } from 'lucide-react';
import { exportToExcel, printReport } from '../../lib/excelUtils';

export const CashFlow = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setRows([
                    { entry_date: '2024-05-20', description: 'Setoran Modal Awal', cash_change: 50000000 },
                    { entry_date: '2024-05-21', description: 'Pembelian Inventaris', cash_change: -5000000 },
                    { entry_date: '2024-05-22', description: 'Pendapatan Jual Kopi', cash_change: 1500000 }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const { data, error } = await supabase.from('view_cash_flow').select('*');
            if (error) throw error;
            if (data) setRows(data);
        } catch (err) {
            console.error(err);
            alert("Gagal memuat laporan Arus Kas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const totalCashFlow = rows.reduce((sum, r) => sum + (r.cash_change || 0), 0);

    const handleExport = () => {
        const data = [
            ...rows.map(r => ({
                Tanggal: new Date(r.entry_date).toLocaleDateString(),
                Keterangan: r.description,
                'Arus Kas': r.cash_change
            })),
            { Tanggal: 'TOTAL', Keterangan: 'NET CASH FLOW', 'Arus Kas': totalCashFlow }
        ];
        exportToExcel(data, 'Laporan_Arus_Kas_Simultan');
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Laporan Arus Kas (Cash Flow)</h1>
                    <p className="text-slate-500 text-sm">Aliran kas masuk dan keluar koperasi.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchReport} className="text-slate-400 hover:text-blue-600 p-2 border rounded-lg bg-white" title="Refresh">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => printReport('Arus Kas Simultan')} className="text-slate-600 hover:text-slate-900 px-4 py-2 border rounded-lg bg-white flex items-center gap-2 font-bold text-sm">
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleExport} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95">
                        <FileDown size={18} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-3xl mx-auto">
                <div className="bg-slate-900 text-white p-6 text-center">
                    <h2 className="text-xl font-bold">KOPERASI SIMULTAN</h2>
                    <p className="opacity-80 text-sm">Statement of Cash Flow (Arus Kas)</p>
                    <p className="text-xs opacity-50 mt-1">Metode Langsung (Direct Method)</p>
                </div>

                <div className="p-0">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Keterangan Transaksi</th>
                                <th className="px-6 py-4 text-right">Arus Kas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={3} className="p-8 text-center text-slate-400">Loading...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-slate-400">Belum ada transaksi kas.</td></tr>
                            ) : rows.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(r.entry_date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{r.description}</td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold ${r.cash_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <div className="flex items-center justify-end gap-2">
                                            {r.cash_change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                            {new Intl.NumberFormat('id-ID').format(Math.abs(r.cash_change))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                                <td colSpan={2} className="px-6 py-4 font-bold text-slate-800 text-right uppercase">Net Cash Flow</td>
                                <td className={`px-6 py-4 text-right font-mono font-bold text-lg ${totalCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalCashFlow)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </Layout>
    );
};
