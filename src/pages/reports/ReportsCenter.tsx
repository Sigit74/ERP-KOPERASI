
import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { FileDown, Calendar, Database, FileSpreadsheet } from 'lucide-react';
import { supabase, isConfigured } from '../../lib/supabase';
import { exportToCsv } from '../../services/exportUtils';

const REPORT_TYPES = [
    { id: 'daily_purchase', name: 'Rekap Pembelian Harian', desc: 'Daftar transaksi per hari, detail petani & produk.', icon: FileSpreadsheet },
    { id: 'farmer_master', name: 'Master Data Petani', desc: 'Database lengkap anggota termasuk luas lahan & lokasi.', icon: Database },
    { id: 'stock_balance', name: 'Saldo Stok Gudang', desc: 'Posisi stok terkini per gudang dan produk.', icon: Database },
];

export const ReportsCenter = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (typeId: string) => {
        setLoading(true);
        try {
            if (!isConfigured()) {
                // Mock Download
                setTimeout(() => {
                    const mockData = [
                        { tanggal: '2024-05-01', petani: 'Budi', produk: 'Kopi', qty: 50, total: 4000000 },
                        { tanggal: '2024-05-02', petani: 'Siti', produk: 'Kopi', qty: 30, total: 2400000 },
                    ];
                    exportToCsv(`${typeId}_demo.csv`, mockData);
                    setLoading(false);
                }, 1000);
                return;
            }

            let dataToExport: any[] = [];
            
            // Logic per report type
            if (typeId === 'daily_purchase') {
                const { data } = await supabase
                    .from('purchase_transactions')
                    .select('transaction_date, transaction_code, farmer_id, farmers(name), product_id, products(name), quantity, total_amount, status')
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate + 'T23:59:59');
                
                // Flatten data
                if(data) {
                    dataToExport = data.map(item => ({
                        Date: new Date(item.transaction_date).toLocaleDateString(),
                        Code: item.transaction_code,
                        Farmer: (item.farmers as any)?.name,
                        Product: (item.products as any)?.name,
                        Qty_KG: item.quantity,
                        Total_IDR: item.total_amount,
                        Status: item.status
                    }));
                }
            } else if (typeId === 'farmer_master') {
                const { data } = await supabase.from('farmers').select('*');
                dataToExport = data || [];
            } else if (typeId === 'stock_balance') {
                 // Assuming view exists
                 const { data } = await supabase.from('view_product_stocks').select('*');
                 dataToExport = data || [];
            }

            if(dataToExport.length > 0) {
                exportToCsv(`${typeId}_${startDate}.csv`, dataToExport);
            } else {
                alert("Tidak ada data untuk periode ini.");
            }

        } catch (err: any) {
            alert("Gagal generate report: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Pusat Laporan</h1>
                    <p className="text-slate-500">Unduh rekapitulasi data operasional untuk analisis.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-500"/> Filter Periode
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dari Tanggal</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sampai Tanggal</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {REPORT_TYPES.map((rpt) => (
                        <div key={rpt.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                             <div className="p-4 bg-slate-100 rounded-full text-slate-600 shrink-0">
                                 <rpt.icon size={24} />
                             </div>
                             <div className="flex-1 text-center sm:text-left">
                                 <h4 className="font-bold text-lg text-slate-800">{rpt.name}</h4>
                                 <p className="text-sm text-slate-500 mt-1">{rpt.desc}</p>
                             </div>
                             <button 
                                onClick={() => handleGenerate(rpt.id)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0 w-full sm:w-auto justify-center"
                             >
                                 <FileDown size={18} />
                                 {loading ? 'Processing...' : 'Download CSV'}
                             </button>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};
