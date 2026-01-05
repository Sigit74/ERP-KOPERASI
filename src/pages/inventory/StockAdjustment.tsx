
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export const StockAdjustment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [shelters, setShelters] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form
  const [formData, setFormData] = useState({
    shelter_id: '', // Renamed from warehouse_id
    product_id: '',
    movement_type: 'ADJUSTMENT', // IN, OUT, ADJUSTMENT
    quantity: 0,
    reference_note: ''
  });

  useEffect(() => {
    fetchDependencies();
  }, []);

  const fetchDependencies = async () => {
    if (!isConfigured()) {
        setShelters([{id:'wh1', name: 'Shelter Pusat (Demo)'}]);
        setProducts([{id:'p1', name: 'Kopi Arabika (Demo)'}]);
        return;
    }
    const [wRes, pRes] = await Promise.all([
        supabase.from('shelters').select('id, name'),
        supabase.from('products').select('id, name, unit')
    ]);
    if (wRes.data) setShelters(wRes.data);
    if (pRes.data) setProducts(pRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.quantity <= 0) {
        alert("Jumlah harus lebih dari 0");
        setLoading(false);
        return;
    }

    try {
        if (!isConfigured()) {
            alert("Demo: Stok berhasil disesuaikan!");
            navigate('/inventory');
            return;
        }

        const { error } = await supabase.from('stock_movements').insert([formData]);
        if (error) throw error;
        
        navigate('/inventory');
    } catch (err: any) {
        alert("Gagal menyimpan: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Layout>
       <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/inventory')} className="flex items-center text-slate-500 mb-6 gap-2"><ArrowLeft size={16}/> Kembali</button>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
             <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                <AlertTriangle size={24} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800">Stock Adjustment / Opname</h1>
                <p className="text-sm text-slate-500">Sesuaikan saldo stok manual (Rusak, Hilang, atau Saldo Awal).</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Shelter</label>
                    <select 
                        required 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white" 
                        value={formData.shelter_id} 
                        onChange={e => setFormData({...formData, shelter_id: e.target.value})}
                    >
                        <option value="">-- Pilih Shelter --</option>
                        {shelters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Produk</label>
                    <select 
                        required 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white" 
                        value={formData.product_id} 
                        onChange={e => setFormData({...formData, product_id: e.target.value})}
                    >
                        <option value="">-- Pilih Produk --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Penyesuaian</label>
                    <select 
                        required 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white" 
                        value={formData.movement_type} 
                        onChange={e => setFormData({...formData, movement_type: e.target.value})}
                    >
                        <option value="IN">IN (Barang Masuk / Saldo Awal)</option>
                        <option value="OUT">OUT (Barang Keluar / Rusak / Hilang)</option>
                        <option value="ADJUSTMENT">ADJUSTMENT (Koreksi Opname)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah (Qty)</label>
                    <input 
                        required 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2" 
                        value={formData.quantity} 
                        onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-slate-400 mt-1">Gunakan angka positif.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catatan / Alasan</label>
                <textarea 
                    required 
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2" 
                    placeholder="Contoh: Stok Opname Bulan Juni 2024"
                    value={formData.reference_note} 
                    onChange={e => setFormData({...formData, reference_note: e.target.value})}
                />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center gap-2 transition-colors">
                <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
