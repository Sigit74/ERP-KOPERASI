
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Box, Tag, ArrowRight, FileSearch, QrCode } from 'lucide-react';

export const LotList = () => {
  const navigate = useNavigate();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    setLoading(true);
    if (!isConfigured()) {
        setTimeout(() => {
            setLots([
                { 
                    id: 'lot-001', 
                    lot_code: 'LOT-2025-001', 
                    products: { name: 'Biji Kakao Fermentasi', unit: 'KG' }, 
                    quantity: 1000, 
                    available_quantity: 1000, 
                    hpp_per_kg: 15447,
                    created_at: '2025-12-10'
                }
            ]);
            setLoading(false);
        }, 500);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('product_lots')
            .select('*, products(name, unit)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setLots(data);
    } catch (err) {
        console.warn(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Lot (Sales Ready)</h1>
          <p className="text-slate-500">Inventory barang jadi yang siap dijual ke Buyer B2B.</p>
        </div>
        <button 
          onClick={() => navigate('/sales/lot/new')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-purple-900/20"
        >
          <Plus size={16} />
          Buat Lot Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map(lot => (
              <div key={lot.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                              <Box size={24}/>
                          </div>
                          <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Batch Code</span>
                              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{lot.lot_code}</span>
                          </div>
                      </div>
                      
                      <h3 className="font-bold text-lg text-slate-800 mb-1">{lot.products?.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                          <Tag size={12}/> Terdaftar pada {new Date(lot.created_at).toLocaleDateString('id-ID')}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                          <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Total Stok</p>
                              <p className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(lot.quantity)} <span className="text-xs font-normal">{lot.products?.unit}</span></p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Nilai HPP</p>
                              <p className="font-bold text-blue-600 font-mono">Rp {new Intl.NumberFormat('id-ID').format(lot.hpp_per_kg)}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 flex gap-2 border-t border-slate-100">
                      <button 
                        onClick={() => navigate(`/production/lots/${lot.id}`)}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold border border-slate-200 flex items-center justify-center gap-2 transition-colors"
                      >
                          <FileSearch size={14}/> Traceability
                      </button>
                      <button className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors" title="Print Label QR">
                          <QrCode size={16}/>
                      </button>
                  </div>
              </div>
          ))}
          
          {lots.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <Box size={48} className="mx-auto text-slate-200 mb-4"/>
                  <p className="text-slate-400 font-medium">Belum ada Lot yang siap jual.</p>
                  <button onClick={() => navigate('/sales/lot/new')} className="text-purple-600 font-bold text-sm mt-2 hover:underline">Buat Lot Pertama &rarr;</button>
              </div>
          )}
      </div>
    </Layout>
  );
};
