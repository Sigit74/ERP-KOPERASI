
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Truck, Calendar, User, Eye, CheckCircle, Search, ArrowRight, FileDown } from 'lucide-react';
import { exportToExcel } from '../../lib/excelUtils';

export const CommoditySalesList = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setSales([
                    { id: '1', transaction_code: 'B2B-170125001', transaction_date: '2024-05-22', customer_name: 'PT. Exportir Kopi Nusantara', total_amount: 155000000, status: 'completed' },
                    { id: '2', transaction_code: 'B2B-170125002', transaction_date: '2024-05-25', customer_name: 'CV. Maju Berdikari', total_amount: 45000000, status: 'completed' }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('sales_transactions')
                .select('*')
                .ilike('transaction_code', 'B2B%')
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            if (data) setSales(data);
        } catch (err) {
            console.warn(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s =>
        s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        s.transaction_code.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => {
        const data = filteredSales.map(s => ({
            'No. Kontrak/TRX': s.transaction_code,
            'Tanggal': new Date(s.transaction_date).toLocaleDateString('id-ID'),
            'Nama Buyer': s.customer_name,
            'Nilai Tagihan': s.total_amount,
            'Status': s.status
        }));
        exportToExcel(data, 'Data_Penjualan_B2B');
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Penjualan Komoditas (B2B)</h1>
                    <p className="text-slate-500">Monitoring pengiriman barang ke Buyer & Eksportir.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
                        <FileDown size={16} /> Export
                    </button>
                    <Link
                        to="/sales/commodity/new"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-purple-900/20"
                    >
                        <Plus size={16} />
                        Input Penjualan Partai
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari Buyer atau No. Transaksi..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-purple-100"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white border-b border-slate-200 text-slate-900 font-semibold">
                            <tr>
                                <th className="px-6 py-4">No. Kontrak/TRX</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Nama Buyer</th>
                                <th className="px-6 py-4 text-right">Nilai Tagihan</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 animate-pulse">Memuat data penjualan...</td></tr>
                            ) : filteredSales.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Tidak ada transaksi ditemukan.</td></tr>
                            ) : (
                                filteredSales.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-purple-700">{s.transaction_code}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(s.transaction_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                {s.customer_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(s.total_amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                    <CheckCircle size={10} /> Completed
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/sales/commodity/${s.id}`)}
                                                className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto"
                                            >
                                                <Eye size={14} /> DETAIL
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout >
    );
};
