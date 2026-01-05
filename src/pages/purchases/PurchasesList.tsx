
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Calendar, User, Eye, CheckCircle, Clock, Smartphone, Globe, CloudOff, FileDown } from 'lucide-react';
import { exportToExcel } from '../../lib/excelUtils';

export const PurchasesList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    if (!isConfigured()) {
      setPurchases([
        {
          id: '1', transaction_code: 'TRX-170123', transaction_date: new Date().toISOString(),
          farmers: { name: 'Budi Santoso' }, products: { name: 'Kopi Arabika', unit: 'KG' },
          quantity: 50, total_amount: 4250000, status: 'completed', source_platform: 'web'
        },
        {
          id: '2', transaction_code: 'MOB-882192', transaction_date: new Date().toISOString(),
          farmers: { name: 'Siti Aminah' }, products: { name: 'Robusta', unit: 'KG' },
          quantity: 100, total_amount: 4500000, status: 'completed', source_platform: 'android_ims', is_offline_created: true
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('purchase_transactions').select(`*, farmers (name), products (name, unit)`).order('created_at', { ascending: false });
      if (data) setPurchases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = purchases.map(p => ({
      'Kode Transaksi': p.transaction_code,
      'Tanggal': p.transaction_date ? new Date(p.transaction_date).toLocaleDateString('id-ID') : '-',
      'Petani': p.farmers?.name || 'Umum',
      'Produk': p.products?.name || '-',
      'Jumlah (Netto)': p.quantity,
      'Satuan': p.products?.unit || 'KG',
      'Total Bayar': p.total_amount,
      'Status': p.status,
      'Sumber': p.source_platform === 'android_ims' ? 'Android' : 'Web'
    }));
    exportToExcel(data, 'Data_Pembelian_Panen');
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Log Pembelian Hasil Panen</h1>
          <p className="text-sm text-slate-500 font-medium">Monitoring transaksi dari Web Shelter dan Aplikasi Android IMS.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <FileDown size={16} /> Export Excel
          </button>
          <Link to="/purchases/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20">
            <Plus size={16} /> Input Transaksi Baru
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-200">
              <tr>
                <th className="px-8 py-5">Kode / Sumber</th>
                <th className="px-6 py-5">Identitas</th>
                <th className="px-6 py-5 text-right">Hasil (Netto)</th>
                <th className="px-6 py-5 text-right">Total Bayar</th>
                <th className="px-6 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center animate-pulse">Menghubungkan ke server...</td></tr>
              ) : purchases.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-slate-900">{trx.transaction_code}</span>
                      <div className="flex items-center gap-2">
                        {trx.source_platform === 'android_ims' ? (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                            <Smartphone size={10} /> Android {trx.is_offline_created && (
                              // Fix: Property 'title' does not exist on type 'IntrinsicAttributes ...'
                              <span title="Offline Created">
                                <CloudOff size={10} className="ml-1" />
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            <Globe size={10} /> Web Shelter
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-black text-slate-800">{trx.farmers?.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </td>
                  <td className="px-6 py-6 text-right font-bold text-slate-700">
                    {trx.quantity} <span className="text-[10px] text-slate-400 uppercase">{trx.products?.unit || 'KG'}</span>
                  </td>
                  <td className="px-6 py-6 text-right font-black text-blue-600">
                    Rp {new Intl.NumberFormat('id-ID').format(trx.total_amount)}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button onClick={() => navigate(`/purchases/${trx.id}`)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};