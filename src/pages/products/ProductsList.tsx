
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Package, Trash2 } from 'lucide-react';

const MOCK_PRODUCTS = [
    { id: '1', sku: 'KOPI-001', name: 'Kopi Arabika (Demo)', unit: 'KG', price_guide: 85000 },
    { id: '2', sku: 'PUPUK-01', name: 'Pupuk NPK (Demo)', unit: 'SAK', price_guide: 150000 },
];

export const ProductsList = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    if (!isConfigured()) {
        setTimeout(() => {
            setProducts(MOCK_PRODUCTS);
            setLoading(false);
        }, 300);
        return;
    }

    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at');
        if (error) throw error;
        if (data) setProducts(data);
    } catch (err) {
        console.warn("Product fetch error:", err);
        setProducts(MOCK_PRODUCTS);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    if (!isConfigured()) {
        setProducts(prev => prev.filter(p => p.id !== id));
        return;
    }
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Produk</h1>
          <p className="text-slate-500">Daftar komoditas yang dikelola koperasi.</p>
        </div>
        <Link to="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700">
          <Plus size={16} /> Tambah Produk
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
            <tr>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Nama Produk</th>
              <th className="px-6 py-4">Satuan</th>
              <th className="px-6 py-4 text-right">Harga Acuan (IDR)</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr> : 
             products.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-slate-400">Tidak ada produk</td></tr> :
             products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.sku}</td>
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                   <Package size={16} className="text-slate-400" />
                   {p.name}
                </td>
                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{p.unit}</span></td>
                <td className="px-6 py-4 text-right font-mono">
                   {new Intl.NumberFormat('id-ID').format(p.price_guide)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};
