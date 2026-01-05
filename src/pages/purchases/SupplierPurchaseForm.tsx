import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, ShoppingBag, Plus, Trash2, Search, Truck, Warehouse } from 'lucide-react';
import { NumberInput } from '../../components/ui/NumberInput';
import { Vendor, Product, Shelter } from '../../types/database';

export const SupplierPurchaseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shelters, setShelters] = useState<Shelter[]>([]);

    const [formData, setFormData] = useState({
        vendor_id: '',
        shelter_id: '',
        transaction_code: `PUR-${Date.now().toString().slice(-6)}`,
        transaction_date: new Date().toISOString().slice(0, 10),
        notes: ''
    });

    const [items, setItems] = useState<{ product_id: string, name: string, qty: number, price: number, subtotal: number }[]>([]);

    useEffect(() => {
        fetchData();
        if (id) fetchPurchase();
    }, [id]);

    const fetchPurchase = async () => {
        if (!isConfigured()) return;
        const { data: header, error: hErr } = await supabase.from('external_purchases').select('*').eq('id', id).single();
        if (header) {
            setFormData({
                vendor_id: header.vendor_id,
                shelter_id: header.shelter_id,
                transaction_code: header.transaction_code,
                transaction_date: header.transaction_date,
                notes: header.notes || ''
            });

            // Fetch Items from stock_movements
            const { data: moves, error: mErr } = await supabase.from('stock_movements')
                .select('*, products(name)')
                .eq('reference_note', `Supplier Purchase: ${header.transaction_code}`);

            if (moves) {
                setItems(moves.map(m => ({
                    product_id: m.product_id,
                    name: m.products?.name || '',
                    qty: m.quantity,
                    price: 0, // Price might not be in stock_movements, but header has total. 
                    // In a real app, external_purchase_items would be better.
                    subtotal: 0
                })));
            }
        }
    };

    const fetchData = async () => {
        if (!isConfigured()) {
            setVendors([{ id: 'v1', name: 'Toko Tani Makmur', category: 'SAPRODI' }]);
            setProducts([{ id: 'p1', name: 'Pupuk Urea', sku: 'UREA-01', unit: 'SAK', price_guide: 150000 }]);
            setShelters([{ id: 's1', name: 'Gudang Pusat', code: 'GP', location: 'Baebunta' }]);
            return;
        }
        const [vRes, pRes, sRes] = await Promise.all([
            supabase.from('vendors').select('*').order('name'),
            supabase.from('products').select('*').order('name'),
            supabase.from('shelters').select('*').order('name')
        ]);
        if (vRes.data) setVendors(vRes.data);
        if (pRes.data) setProducts(pRes.data);
        if (sRes.data) setShelters(sRes.data);
    };

    const addItem = () => {
        setItems([...items, { product_id: '', name: '', qty: 1, price: 0, subtotal: 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'product_id') {
            const p = products.find(prod => prod.id === value);
            item.name = p?.name || '';
            item.price = p?.price_guide || 0;
        }

        item.subtotal = item.qty * item.price;
        newItems[index] = item;
        setItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vendor_id || !formData.shelter_id || items.length === 0) {
            alert("Mohon lengkapi data vendor, lokasi, dan item barang.");
            return;
        }

        setLoading(true);
        try {
            if (!isConfigured()) {
                setTimeout(() => { alert("Demo: Transaksi Pembelian Berhasil."); navigate('/finance/operational'); }, 800);
                return;
            }

            if (id) {
                // UPDATE
                // 1. Update Header
                const { error: hErr } = await supabase.from('external_purchases').update({
                    ...formData,
                    total_amount: total,
                }).eq('id', id);
                if (hErr) throw hErr;

                // 2. Refresh Stock Movements (Delete old and insert new for simplicity)
                await supabase.from('stock_movements').delete().eq('reference_note', `Supplier Purchase: ${formData.transaction_code}`);

                const movements = items.map(item => ({
                    shelter_id: formData.shelter_id,
                    product_id: item.product_id,
                    movement_type: 'IN',
                    quantity: item.qty,
                    reference_note: `Supplier Purchase: ${formData.transaction_code}`
                }));

                const { error: mErr } = await supabase.from('stock_movements').insert(movements);
                if (mErr) throw mErr;

                alert("Pembelian stok berhasil diperbarui!");
            } else {
                // INSERT
                const { data: header, error: hErr } = await supabase.from('external_purchases').insert([{
                    ...formData,
                    total_amount: total,
                    status: 'completed'
                }]).select().single();

                if (hErr) throw hErr;

                const movements = items.map(item => ({
                    shelter_id: formData.shelter_id,
                    product_id: item.product_id,
                    movement_type: 'IN',
                    quantity: item.qty,
                    reference_note: `Supplier Purchase: ${formData.transaction_code}`
                }));

                const { error: mErr } = await supabase.from('stock_movements').insert(movements);
                if (mErr) throw mErr;

                alert("Pembelian stok berhasil dicatat!");
            }

            navigate('/finance/operational');
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/finance/operational')} className="flex items-center text-slate-500 mb-6 gap-2 hover:text-slate-800 font-bold">
                    <ArrowLeft size={16} /> Kembali
                </button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <ShoppingBag className="text-blue-400" size={32} />
                                <h1 className="text-2xl font-black uppercase tracking-tighter">Input Belanja Saprodi</h1>
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Pembelian Stok dari Supplier ke Gudang</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase">No. Transaksi</p>
                            <p className="text-xl font-mono font-black">{formData.transaction_code}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side: Metadata */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2"><Truck size={14} /> Pilih Supplier</label>
                                    <select
                                        required
                                        className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold bg-white focus:border-blue-500 outline-none"
                                        value={formData.vendor_id}
                                        onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
                                    >
                                        <option value="">-- Pilih Vendor --</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2"><Warehouse size={14} /> Lokasi Gudang/Shelter</label>
                                    <select
                                        required
                                        className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold bg-white focus:border-blue-500 outline-none"
                                        value={formData.shelter_id}
                                        onChange={e => setFormData({ ...formData, shelter_id: e.target.value })}
                                    >
                                        <option value="">-- Pilih Lokasi --</option>
                                        {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Tanggal</label>
                                    <input type="date" className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold outline-none" value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Daftar Barang Belanja</h3>

                                <div className="space-y-3">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-3 group border border-transparent hover:border-blue-100 transition-all">
                                            <div className="flex justify-between items-center">
                                                <select
                                                    className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                                                    value={item.product_id}
                                                    onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                                >
                                                    <option value="">-- Pilih Produk --</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                                </select>
                                                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="ml-2 text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Qty</label>
                                                    <input type="number" className="w-full bg-white border-2 border-slate-100 rounded-xl px-3 py-1.5 text-sm font-mono font-bold" value={item.qty} onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Harga Beli (Satuan)</label>
                                                    <div className="flex items-center gap-2">
                                                        <NumberInput className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-3 py-1.5 text-sm font-mono font-bold" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                                                        <span className="text-xs font-black text-blue-600 w-24 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button type="button" onClick={addItem} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Plus size={16} /> Tambah Produk
                                </button>
                            </div>

                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grand Total</p>
                                        <p className="text-4xl font-black tracking-tighter">Rp {total.toLocaleString('id-ID')}</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || items.length === 0}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
                                    >
                                        <Save size={20} /> {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
