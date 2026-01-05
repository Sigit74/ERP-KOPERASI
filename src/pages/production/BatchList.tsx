
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Factory, Calendar, Package, ArrowRight, CheckCircle } from 'lucide-react';

export const BatchList = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    if (!isConfigured()) {
        setTimeout(() => {
            setBatches([
                { 
                    id: '1', 
                    batch_code: 'Batch.SH001.KB.XII.2025.001', 
                    start_date: '2024-12-01', 
                    status: 'closed', 
                    shelter: { name: 'Shelter Pusat' }, 
                    total_input_weight: 500,
                    total_output_weight: 485.5 
                },
                { id: '2', batch_code: 'Batch.SH001.KB.XII.2025.002', start_date: '2024-12-05', status: 'processing', shelter: { name: 'Shelter Pusat' }, total_input_weight: 750 },
                { id: '3', batch_code: 'Batch.SH002.KB.XII.2025.001', start_date: '2024-12-10', status: 'open', shelter: { name: 'Shelter Timur' }, total_input_weight: 350 }
            ]);
            setLoading(false);
        }, 500);
        return;
    }

    try {
        const { data, error } = await supabase.from('batches').select('*, shelter:shelters(name)').order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setBatches(data);
    } catch (err) {
        console.warn(err);
    } finally {
        setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'open': return 'bg-blue-100 text-blue-700';
          case 'processing': return 'bg-orange-100 text-orange-700';
          case 'closed': return 'bg-green-100 text-green-700';
          default: return 'bg-slate-100';
      }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produksi (Batch)</h1>
          <p className="text-slate-500">Monitoring proses transformasi bahan baku menjadi barang jadi.</p>
        </div>
        <Link 
          to="/production/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Buat Batch Baru
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold">
                <tr>
                    <th className="px-6 py-4">Kode Batch</th>
                    <th className="px-6 py-4">Tanggal Mulai</th>
                    <th className="px-6 py-4">Shelter</th>
                    <th className="px-6 py-4 text-right">Input (Kg)</th>
                    <th className="px-6 py-4 text-right">Output (Kg)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={7} className="text-center p-8">Memuat data...</td></tr>
                ) : batches.length === 0 ? (
                    <tr><td colSpan={7} className="text-center p-8 text-slate-400">Belum ada batch produksi.</td></tr>
                ) : (
                    batches.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                <div className="flex items-center gap-2">
                                    {b.status === 'closed' && <CheckCircle size={14} className="text-green-500" />}
                                    {b.batch_code}
                                </div>
                            </td>
                            <td className="px-6 py-4 flex items-center gap-2"><Calendar size={14}/> {new Date(b.start_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{b.shelter?.name || '-'}</td>
                            <td className="px-6 py-4 text-right font-medium">{b.total_input_weight}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">{b.total_output_weight || '-'}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(b.status)}`}>{b.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => navigate(`/production/${b.id}`)}
                                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-xs font-bold flex items-center justify-end gap-1 ml-auto"
                                >
                                    DETAIL <ArrowRight size={12}/>
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </Layout>
  );
};
