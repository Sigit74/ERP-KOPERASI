
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { 
    ArrowLeft, Save, Truck, DollarSign, User, MapPin, 
    Info, Calculator, Box, CheckCircle2, ShieldCheck, 
    RefreshCw, Loader2, AlertCircle
} from 'lucide-react';

export const NewCommoditySale = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [shelters, setShelters] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
      shelter_id: '',
      customer_name: '',
      customer_address: '',
      reference_number: '', 
      lot_id: '',
      quantity: 0,
      price_per_kg: 0,
      include_tax: true,
      shipping_cost: 0,
      vehicle_number: '',
      driver_name: '',
      notes: ''
  });

  useEffect(() => {
      fetchMaster();
  }, []);

  const fetchMaster = async () => {
      if(!isConfigured()) {
          setShelters([{id:'s1', name: 'Shelter Pusat', code: 'SH-PST'}]);
          setLots([
              {id:'l1', lot_code: 'LOT-2025-001', products: {name: 'Biji Kakao Fermentasi', id: 'p1'}, available_quantity: 1250, hpp_per_kg: 15400},
              {id:'l2', lot_code: 'LOT-2025-005', products: {name: 'Green Bean Arabika', id: 'p2'}, available_quantity: 450, hpp_per_kg: 85000}
          ]);
          return;
      }
      try {
          const [sRes, lRes] = await Promise.all([
              supabase.from('shelters').select('id, name, code'),
              supabase.from('product_lots').select('*, products:products(id, name, unit)').gt('available_quantity', 0)
          ]);
          if(sRes.data) setShelters(sRes.data);
          if(lRes.data) setLots(lRes.data);
      } catch (e) {
          console.error("Master fetch error:", e);
      }
  };

  const handleLotChange = (id: string) => {
      const lot = lots.find(l => l.id === id);
      setSelectedLot(lot);
      setFormData(prev => ({
          ...prev, 
          lot_id: id,
          price_per_kg: lot ? Math.round(lot.hpp_per_kg * 1.25) : 0 // Suggest 25% margin
      }));
  };

  const subtotal = formData.quantity * formData.price_per_kg;
  const tax = formData.include_tax ? subtotal * 0.11 : 0;
  const grandTotal = subtotal + tax + Number(formData.shipping_cost);

  // Validation: Check if all mandatory fields are filled
  const isFormValid = 
    formData.shelter_id !== '' && 
    formData.customer_name.trim() !== '' && 
    formData.lot_id !== '' && 
    formData.quantity > 0 &&
    formData.price_per_kg > 0;

  const handleSubmit = async (e: React.FormEvent) => {
      if (e) e.preventDefault();
      
      if(!isFormValid) return alert("Mohon lengkapi semua data wajib (Bintang merah)");
      if(formData.quantity > (selectedLot?.available_quantity || 0)) {
          return alert(`Stok tidak cukup! Tersedia hanya ${selectedLot?.available_quantity} Kg`);
      }
      
      setLoading(true);

      if(!isConfigured()) {
          setTimeout(() => { 
              alert("Mode Demo: Penjualan B2B Berhasil Disimpan!"); 
              navigate('/sales/commodity'); 
          }, 800);
          return;
      }

      try {
          // 1. Create Transaction Header
          const { data: header, error: hError } = await supabase.from('sales_transactions').insert([{
              transaction_code: `B2B-${Date.now().toString().slice(-8)}`,
              shelter_id: formData.shelter_id,
              customer_name: formData.customer_name,
              customer_address: formData.customer_address,
              reference_number: formData.reference_number,
              total_amount: grandTotal,
              tax_amount: tax,
              shipping_cost: formData.shipping_cost,
              vehicle_number: formData.vehicle_number,
              driver_name: formData.driver_name,
              payment_method: 'TRANSFER',
              status: 'completed'
          }]).select().single();

          if(hError) throw hError;

          // 2. Create Sale Item linked to Lot
          // Safe access to product_id from joined data
          const productId = selectedLot.products?.id || selectedLot.final_product_id;

          const { error: iError } = await supabase.from('sales_items').insert([{
              sale_id: header.id,
              product_id: productId,
              lot_id: formData.lot_id,
              quantity: formData.quantity,
              price_per_unit: formData.price_per_kg,
              subtotal: subtotal
          }]);

          if(iError) throw iError;

          navigate('/sales/commodity');
      } catch(err: any) {
          alert("Gagal menyimpan transaksi: " + (err.message || "Unknown error"));
          console.error("Submit Error:", err);
      } finally {
          setLoading(false);
      }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate('/sales/commodity')} className="flex items-center text-slate-500 hover:text-slate-800 gap-2 transition-colors">
                <ArrowLeft size={16}/> Kembali ke Daftar
            </button>
            {!isFormValid && (
                <div className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <AlertCircle size={12}/> Form belum lengkap
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN FORM */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-purple-700 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Truck size={24}/>
                            <h1 className="text-xl font-bold">Entry Penjualan Partai (B2B)</h1>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Commercial</span>
                    </div>
                    
                    <form className="p-8 space-y-8" onSubmit={handleSubmit}>
                        {/* BUYER INFO */}
                        <section>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <User size={14}/> Informasi Pembeli & Lokasi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Perusahaan / Buyer <span className="text-red-500">*</span></label>
                                    <input required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all font-medium" placeholder="Contoh: PT. Exportir Kopi Jaya" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Alamat Penagihan / Pengiriman</label>
                                    <textarea rows={2} className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all text-sm" placeholder="Alamat lengkap tujuan..." value={formData.customer_address} onChange={e => setFormData({...formData, customer_address: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">No. Kontrak / PO</label>
                                    <input className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all font-mono" placeholder="CTR/2025/XXX" value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Shelter Asal Stok <span className="text-red-500">*</span></label>
                                    <select required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all appearance-none bg-white font-medium" value={formData.shelter_id} onChange={e => setFormData({...formData, shelter_id: e.target.value})}>
                                        <option value="">-- Pilih Shelter --</option>
                                        {shelters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* PRODUCT & TRACEABILITY */}
                        <section>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Box size={14}/> Produk & Traceability (Inventory Lot)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Pilih Lot Barang Jadi <span className="text-red-500">*</span></label>
                                    <select required className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all appearance-none bg-white font-black text-purple-900" value={formData.lot_id} onChange={e => handleLotChange(e.target.value)}>
                                        <option value="">-- Pilih Lot Stok --</option>
                                        {lots.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.lot_code} - {l.products?.name || 'Produk'} (Tersedia: {l.available_quantity} Kg)
                                            </option>
                                        ))}
                                    </select>
                                    {selectedLot && (
                                        <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                                            <ShieldCheck className="text-blue-600" size={20}/>
                                            <p className="text-xs text-blue-800 leading-tight">
                                                Lot <strong>{selectedLot.lot_code}</strong> terverifikasi.<br/>
                                                HPP rata-rata produksi: <strong>Rp {new Intl.NumberFormat('id-ID').format(selectedLot.hpp_per_kg)}/Kg</strong>.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Berat Dijual (Kg) <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none text-xl font-black" placeholder="0.00" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)||0})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Harga Jual per Kg (Rp) <span className="text-red-500">*</span></label>
                                        <input required type="number" className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none text-xl font-black text-purple-700" placeholder="0" value={formData.price_per_kg || ''} onChange={e => setFormData({...formData, price_per_kg: parseFloat(e.target.value)||0})} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* SHIPPING INFO */}
                        <section>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Truck size={14}/> Logistik & Pengiriman
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Plat Nomor Truk</label>
                                    <input className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all font-mono uppercase font-bold" placeholder="DD XXXX XX" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Driver</label>
                                    <input className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all" placeholder="Nama pengemudi..." value={formData.driver_name} onChange={e => setFormData({...formData, driver_name: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Biaya Pengiriman (Jika Dibebankan)</label>
                                    <input type="number" className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl p-3 focus:border-purple-500 outline-none transition-all font-mono" placeholder="0" value={formData.shipping_cost || ''} onChange={e => setFormData({...formData, shipping_cost: parseFloat(e.target.value)||0})} />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>
            </div>

            {/* SIDEBAR: SUMMARY & ACTION */}
            <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden sticky top-6">
                    <div className="p-6 bg-slate-900 text-white">
                        <h3 className="font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
                            <Calculator size={18} className="text-purple-400"/> Kalkulasi Invois
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Nilai Barang</span>
                            <span className="font-bold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-y border-dashed border-slate-100">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="tax-toggle" 
                                    checked={formData.include_tax} 
                                    onChange={e => setFormData({...formData, include_tax: e.target.checked})}
                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="tax-toggle" className="text-sm font-bold text-slate-700 cursor-pointer">PPN (11%)</label>
                            </div>
                            <span className="font-bold text-red-500">+{tax.toLocaleString('id-ID')}</span>
                        </div>

                        {formData.shipping_cost > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Logistik</span>
                                <span className="font-bold text-slate-800">Rp {formData.shipping_cost.toLocaleString('id-ID')}</span>
                            </div>
                        )}

                        <div className="pt-4 border-t-2 border-slate-900">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Grand Total Bill</p>
                            <p className="text-3xl font-black text-purple-700 text-center font-mono">
                                <span className="text-sm align-top mr-1 font-sans">Rp</span>
                                {grandTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </div>

                        {selectedLot && (
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 mt-6 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profitability Analysis</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase">Gross Margin</p>
                                        <p className={`text-lg font-bold ${formData.price_per_kg > selectedLot.hpp_per_kg ? 'text-green-600' : 'text-red-500'}`}>
                                            {formData.price_per_kg > 0 ? `${(((formData.price_per_kg - selectedLot.hpp_per_kg) / formData.price_per_kg) * 100).toFixed(1)}%` : '0%'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase">Laba kotor / Kg</p>
                                        <p className="text-sm font-bold text-slate-800">
                                            Rp {(formData.price_per_kg - selectedLot.hpp_per_kg).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6">
                            <button 
                                type="button"
                                onClick={handleSubmit} 
                                disabled={loading || !isFormValid} 
                                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 disabled:opacity-30 shadow-xl shadow-purple-900/20 transition-all active:scale-95 flex justify-center gap-3 items-center"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin"/> : <><Save size={18}/> Simpan Penjualan</>}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                                Pastikan semua data ber-tanda <span className="text-red-500 font-bold">*</span> telah diisi dengan benar sebelum menyimpan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};
