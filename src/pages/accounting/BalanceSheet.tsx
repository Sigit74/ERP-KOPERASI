
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { RefreshCw, Scale, Printer, FileDown } from 'lucide-react';
import { exportToExcel, printReport } from '../../lib/excelUtils';

export const BalanceSheet = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setRows([
                    { name: 'Kas Besar', type: 'ASSET', net_amount: 15000000 },
                    { name: 'Bank BNI', type: 'ASSET', net_amount: 45000000 },
                    { name: 'Hutang Dagang', type: 'LIABILITY', net_amount: 10000000 },
                    { name: 'Modal Awal', type: 'EQUITY', net_amount: 50000000 }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const { data, error } = await supabase.from('view_balance_sheet').select('*');
            if (error) throw error;
            if (data) setRows(data);
        } catch (err) {
            console.error(err);
            alert("Gagal memuat laporan Neraca.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const assets = rows.filter(r => r.type === 'ASSET');
    const liabilities = rows.filter(r => r.type === 'LIABILITY');
    const equity = rows.filter(r => r.type === 'EQUITY');

    const totalAssets = assets.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, r) => sum + (r.net_amount || 0), 0);
    const totalEquity = equity.reduce((sum, r) => sum + (r.net_amount || 0), 0);

    const handleExport = () => {
        const data = [
            { Kelompok: 'ASET', Nama: '', Jumlah: '' },
            ...assets.map(r => ({ Kelompok: 'Aset', Nama: r.name, Jumlah: r.net_amount })),
            { Kelompok: 'Total Aset', Nama: '', Jumlah: totalAssets },
            { Kelompok: '', Nama: '', Jumlah: '' },
            { Kelompok: 'KEWAJIBAN', Nama: '', Jumlah: '' },
            ...liabilities.map(r => ({ Kelompok: 'Kewajiban', Nama: r.name, Jumlah: r.net_amount })),
            { Kelompok: 'Total Kewajiban', Nama: '', Jumlah: totalLiabilities },
            { Kelompok: '', Nama: '', Jumlah: '' },
            { Kelompok: 'EKUITAS', Nama: '', Jumlah: '' },
            ...equity.map(r => ({ Kelompok: 'Ekuitas', Nama: r.name, Jumlah: r.net_amount })),
            { Kelompok: 'Total Ekuitas', Nama: '', Jumlah: totalEquity },
            { Kelompok: '', Nama: '', Jumlah: '' },
            { Kelompok: 'TOTAL PASIVA', Nama: '', Jumlah: totalLiabilities + totalEquity }
        ];
        exportToExcel(data, 'Laporan_Neraca_Simultan');
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Neraca (Balance Sheet)</h1>
                    <p className="text-slate-500 text-sm">Posisi keuangan, aset, kewajiban, dan ekuitas.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchReport} className="text-slate-400 hover:text-blue-600 p-2 border rounded-lg bg-white" title="Refresh">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => printReport('Neraca Simultan')} className="text-slate-600 hover:text-slate-900 px-4 py-2 border rounded-lg bg-white flex items-center gap-2 font-bold text-sm">
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleExport} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95">
                        <FileDown size={18} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto">
                <div className="bg-slate-900 text-white p-6 text-center">
                    <h2 className="text-xl font-bold">KOPERASI SIMULTAN</h2>
                    <p className="opacity-80 text-sm">Statement of Financial Position (Neraca)</p>
                    <p className="text-xs opacity-50 mt-1">Per Tanggal: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ASSETS */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Aset (Assets)</h3>
                        <div className="space-y-3">
                            {assets.map((r, i) => (
                                <div key={i} className="flex justify-between text-slate-700">
                                    <span>{r.name}</span>
                                    <span className="font-mono">{new Intl.NumberFormat('id-ID').format(r.net_amount)}</span>
                                </div>
                            ))}
                            {assets.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada data aset.</p>}
                            <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-100 mt-4">
                                <span>Total Aset</span>
                                <span>{new Intl.NumberFormat('id-ID').format(totalAssets)}</span>
                            </div>
                        </div>
                    </div>

                    {/* LIABILITIES & EQUITY */}
                    <div className="space-y-8">
                        {/* LIABILITIES */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Kewajiban (Liabilities)</h3>
                            <div className="space-y-3">
                                {liabilities.map((r, i) => (
                                    <div key={i} className="flex justify-between text-slate-700">
                                        <span>{r.name}</span>
                                        <span className="font-mono">{new Intl.NumberFormat('id-ID').format(r.net_amount)}</span>
                                    </div>
                                ))}
                                {liabilities.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada data kewajiban.</p>}
                                <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-100">
                                    <span>Total Kewajiban</span>
                                    <span>{new Intl.NumberFormat('id-ID').format(totalLiabilities)}</span>
                                </div>
                            </div>
                        </div>

                        {/* EQUITY */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Ekuitas (Equity)</h3>
                            <div className="space-y-3">
                                {equity.map((r, i) => (
                                    <div key={i} className="flex justify-between text-slate-700">
                                        <span>{r.name}</span>
                                        <span className="font-mono">{new Intl.NumberFormat('id-ID').format(r.net_amount)}</span>
                                    </div>
                                ))}
                                {equity.length === 0 && <p className="text-sm text-slate-400 italic">Belum ada data ekuitas.</p>}
                                <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-100">
                                    <span>Total Ekuitas</span>
                                    <span>{new Intl.NumberFormat('id-ID').format(totalEquity)}</span>
                                </div>
                            </div>
                        </div>

                        {/* TOTAL PASIVA */}
                        <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-200">
                            <span className="font-bold text-slate-800">Total Kewajiban + Ekuitas</span>
                            <span className="font-bold text-slate-900 font-mono text-lg">{new Intl.NumberFormat('id-ID').format(totalLiabilities + totalEquity)}</span>
                        </div>
                    </div>
                </div>

                {/* CHECK BALANCE */}
                <div className={`p-2 text-center text-xs font-bold text-white ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? 'BALANCE / SEIMBANG' : 'NOT BALANCE / TIDAK SEIMBANG'}
                </div>
            </div>
        </Layout>
    );
};
