
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Warehouse, MapPin, Trash2 } from 'lucide-react';

const MOCK_WAREHOUSES = [
    { id: '1', code: 'SH-001', name: 'Shelter Pusat (Demo)', location: 'Jakarta', capacity_limit: 10000 },
    { id: '2', code: 'SH-002', name: 'Shelter Unit Timur (Demo)', location: 'Surabaya', capacity_limit: 5000 },
];

export const WarehousesList = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
       if (!isConfigured()) {
           setWarehouses(MOCK_WAREHOUSES);
           return;
       }
       try {
           const { data, error } = await supabase.from('warehouses').select('*');
           if (error) throw error;
           if(data) setWarehouses(data);
       } catch (err) {
           console.warn(err);
           setWarehouses(MOCK_WAREHOUSES);
       }
    }
    fetch();
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm("Hapus shelter ini?")) return;
    if (!isConfigured()) {
        setWarehouses(prev => prev.filter(w => w.id !== id));
        return;
    }
    await supabase.from('warehouses').delete().eq('id', id);
    window.location.reload();
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Data Shelter</h1>
        <Link to="/warehouses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center">
            <Plus size={16} /> Tambah Shelter
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {warehouses.map(w => (
             <div key={w.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-4">
                     <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                        <Warehouse size={24} />
                     </div>
                     <button onClick={() => handleDelete(w.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                 </div>
                 <h3 className="font-bold text-lg text-slate-800">{w.name}</h3>
                 <p className="text-xs text-slate-500 font-mono mb-4">{w.code}</p>
                 
                 <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="shrink-0 mt-0.5" />
                    <p>{w.location || 'Lokasi tidak diset'}</p>
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-500">Kapasitas</span>
                    <span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(w.capacity_limit || 0)} KG</span>
                 </div>
             </div>
         ))}
      </div>
    </Layout>
  );
};
