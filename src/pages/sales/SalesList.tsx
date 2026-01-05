
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, ShoppingCart, Eye, Calendar, User, FileDown } from 'lucide-react';
import { exportToExcel } from '../../lib/excelUtils';
import { SaleTransaction } from '../../types/database';

const MOCK_SALES = [
  { id: '1', transaction_code: 'SLS-001', transaction_date: new Date().toISOString(), customer_name: 'Budi Santoso', total_amount: 300000, status: 'completed' },
  { id: '2', transaction_code: 'SLS-002', transaction_date: new Date().toISOString(), customer_name: 'Umum', total_amount: 85000, status: 'completed' },
];

export const SalesList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    if (!isConfigured()) {
      setTimeout(() => {
        setSales(MOCK_SALES as any);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      if (data) setSales(data as SaleTransaction[]);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = sales.map(s => ({
      'No. Struk': s.transaction_code,
      'Tanggal': new Date(s.transaction_date).toLocaleDateString('id-ID'),
      'Pelanggan': s.customer_name || 'Umum',
      'Total Belanja': s.total_amount,
      'Status': s.status
    }));
    exportToExcel(data, 'Data_Penjualan_Retail');
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Toko Tani (Saprodi)</h1>
          <p className="text-slate-500">Penjualan pupuk, alat, dan kebutuhan pertanian.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <FileDown size={16} /> Export
          </button>
          <Link
            to="/sales/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Kasir Penjualan (POS)
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">No. Struk</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4 text-right">Total Belanja</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Memuat data...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada penjualan.</td></tr>
              ) : (
                sales.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{trx.transaction_code}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" /> {new Date(trx.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        {trx.customer_name || 'Umum'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(trx.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">Completed</span>
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
