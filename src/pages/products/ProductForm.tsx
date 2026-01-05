
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';
import { NumberInput } from '../../components/ui/NumberInput';

export const ProductForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    unit: 'KG',
    price_guide: 0,
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = { ...formData };
    if (!cleanData.price_guide) cleanData.price_guide = 0;

    const { error } = await supabase.from('products').insert([cleanData]);
    if (!error) navigate('/products');
    else alert(error.message);
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/products')} className="flex items-center text-slate-500 mb-6 gap-2">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-6">Tambah Produk Baru</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Kode Unik)</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="CTH: KOPI-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Kopi Arabika" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                <select className="w-full border border-slate-300 rounded-lg px-4 py-2" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                  <option value="KG">Kilogram (KG)</option>
                  <option value="SAK">Karung (SAK)</option>
                  <option value="PCS">Pcs</option>
                  <option value="LITER">Liter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga Acuan (Rp)</label>
                <NumberInput
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  value={formData.price_guide}
                  onChange={e => setFormData({ ...formData, price_guide: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Spesifikasi produk, grade, dll..."
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold mt-4 flex justify-center gap-2">
              <Save size={18} /> Simpan Produk
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
