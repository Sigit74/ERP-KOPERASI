
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { TrendingUp, RefreshCw, Printer, FileDown } from 'lucide-react';
import { exportToExcel, printReport } from '../../lib/excelUtils';

export const IncomeStatement = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setRows([
                    { name: 'Penjualan Kopi', type: 'REVENUE', net_amount: 50000000 },
                    { name: 'Harga Pokok Penjualan', type: 'EXPENSE', net_amount: 35000000 },
                    { name: 'Beban Operasional', type: 'EXPENSE', net_amount: 5000000 }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const { data, error } = await supabase.from('view_income_statement').select('*');
            if (error) throw error;
            if (data) setRows(data);
        } catch (err) {
            console.error(err);
            alert("Gagal memuat laporan. Pastikan View SQL sudah ada.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const revenues = rows.filter(r => r.type === 'REVENUE');
    const expenses = rows.filter(r => r.type === 'EXPENSE');

    const totalRevenue = revenues.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const totalExpense = expenses.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const netIncome = totalRevenue - totalExpense;

    const handleExport = () => {
        const data = [
            ...revenues.map(r => ({ Kategori: 'Pendapatan', Nama: r.name, Jumlah: r.net_amount })),
            { Kategori: 'Total Pendapatan', Nama: '', Jumlah: totalRevenue },
            ...expenses.map(r => ({ Kategori: 'Beban', Nama: r.name, Jumlah: r.net_amount })),
            { Kategori: 'Total Beban', Nama: '', Jumlah: totalExpense },
            { Kategori: 'LABA/RUGI BERSIH', Nama: '', Jumlah: netIncome }
        ];
        exportToExcel(data, 'Laporan_Laba_Rugi_Simultan');
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h1>
                    <p className="text-slate-500 text-sm">Rekapitulasi pendapatan dan beban koperasi.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchReport} className="text-slate-400 hover:text-blue-600 p-2 border rounded-lg bg-white" title="Refresh">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => printReport('Laba Rugi Simultan')} className="text-slate-600 hover:text-slate-900 px-4 py-2 border rounded-lg bg-white flex items-center gap-2 font-bold text-sm">
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
                    <p className="opacity-80 text-sm">Income Statement (Laba Rugi)</p>
                    <p className="text-xs opacity-50 mt-1">Periode: Current</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Revenue Section */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Pendapatan (Revenue)</h3>
                        <div className="space-y-3">
                            {revenues.map((r, i) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                    <span>{r.name}</span>
                                    <span className="font-mono">{new Intl.NumberFormat('id-ID').format(r.net_amount)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-100">
                                <span>Total Pendapatan</span>
                                <span>{new Intl.NumberFormat('id-ID').format(totalRevenue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expense Section */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Beban (Expenses)</h3>
                        <div className="space-y-3">
                            {expenses.map((r, i) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                    <span>{r.name}</span>
                                    <span className="font-mono">{new Intl.NumberFormat('id-ID').format(r.net_amount)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-100">
                                <span>Total Beban</span>
                                <span>{new Intl.NumberFormat('id-ID').format(totalExpense)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Income */}
                    <div className={`mt-8 p-4 rounded-lg flex justify-between items-center ${netIncome >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <TrendingUp size={24} />
                            {netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                        </div>
                        <div className="font-bold text-2xl font-mono">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(netIncome)}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
