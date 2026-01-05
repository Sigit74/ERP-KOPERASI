
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { 
    ArrowLeft, Save, ShoppingCart, Plus, Minus, Trash2, 
    Search, ChevronDown, X, PackageOpen,
    Printer, Receipt, RefreshCw, CheckCircle, Tag, Store
} from 'lucide-react';
import { Product, Farmer, Shelter } from '../../types/database';
import { DEMO_PRODUCTS, DEMO_FARMERS, DEMO_SHELTERS } from '../../services/demoData';

interface CartItem {
    product_id: string;
    product_name: string;
    unit: string;
    price: number;
    qty: number;
    subtotal: number;
}

export const NewSale = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [farmers, setFarmers] = useState<Farmer[]>(DEMO_FARMERS as any);
  const [shelters, setShelters] = useState<Shelter[]>(DEMO_SHELTERS);
  
  const [selectedShelter, setSelectedShelter] = useState(DEMO_SHELTERS[0].id);
  const [customerType, setCustomerType] = useState<'FARMER' | 'GENERAL'>('FARMER');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);
  const farmerDropdownRef = useRef<HTMLDivElement>(null);
  const [generalCustomerName, setGeneralCustomerName] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProd, setSearchProd] = useState('');

  useEffect(() => {
    if (isConfigured()) fetchRealData();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (farmerDropdownRef.current && !farmerDropdownRef.current.contains(event.target as Node)) {
        setIsFarmerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRealData = async () => {
      setLoading(true);
      try {
          const [pRes, fRes, sRes] = await Promise.all([
              supabase.from('products').select('*').order('name'),
              supabase.from('farmers').select('id, name, username, farmer_groups(name)').eq('status', 'active').order('name'),
              supabase.from('shelters').select('*').order('name')
          ]);
          if (pRes.data && pRes.data.length > 0) setProducts(pRes.data);
          if (fRes.data && fRes.data.length > 0) setFarmers(fRes.data as any);
          if (sRes.data && sRes.data.length > 0) {
              setShelters(sRes.data);
              setSelectedShelter(sRes.data[0].id);
          }
      } catch (err) { console.warn("Using demo data fallback"); }
      finally { setLoading(false); }
  };

  const addToCart = (product: Product) => {
      const existing = cart.find(c => c.product_id === product.id);
      if (existing) {
          updateQty(product.id, existing.qty + 1);
      } else {
          setCart([...cart, {
              product_id: product.id,
              product_name: product.name,
              unit: product.unit,
              price: product.price_guide || 0,
              qty: 1,
              subtotal: product.price_guide || 0
          }]);
      }
  };

  const updateQty = (prodId: string, newQty: number) => {
      if (newQty < 1) return;
      setCart(cart.map(item => item.product_id === prodId ? { ...item, qty: newQty, subtotal: newQty * item.price } : item));
  };

  const removeFromCart = (prodId: string) => setCart(cart.filter(c => c.product_id !== prodId));
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
      if (cart.length === 0) return;
      if (customerType === 'FARMER' && !selectedFarmerId) return alert("Pilih Anggota");

      setLoading(true);
      const custName = customerType === 'FARMER' 
          ? farmers.find(f => f.id === selectedFarmerId)?.name || 'Anggota'
          : generalCustomerName || 'Umum';

      // Simulasikan delay simpan
      setTimeout(async () => {
          const trxData = {
              transaction_code: `SLS-${Date.now().toString().slice(-6)}`,
              transaction_date: new Date().toISOString(),
              customer_name: custName,
              total_amount: totalAmount,
              items: [...cart]
          };

          if (isConfigured()) {
              try {
                  const { data: header, error: hError } = await supabase.from('sales_transactions').insert([{
                      shelter_id: selectedShelter,
                      customer_name: custName,
                      total_amount: totalAmount,
                      payment_method: 'CASH',
                      status: 'completed'
                  }]).select().single();
                  if (!hError) {
                      const itemsPayload = cart.map(item => ({
                          sale_id: header.id, product_id: item.product_id, quantity: item.qty, price_per_unit: item.price, subtotal: item.subtotal
                      }));
                      await supabase.from('sales_items').insert(itemsPayload);
                      trxData.transaction_code = header.transaction_code;
                  }
              } catch (e) { console.error(e); }
          }

          setLastTransaction(trxData);
          setShowReceipt(true);
          setLoading(false);
      }, 800);
  };

  const handlePrint = () => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const itemsHtml = lastTransaction.items.map((item: any) => `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px;">
            <span>${item.product_name} (${item.qty})</span>
            <span>${item.subtotal.toLocaleString('id-ID')}</span>
        </div>
      `).join('');
      const content = `<html><body style="font-family:monospace; width:58mm; padding:5px;">
        <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
            <b>SIMULTAN ERP</b><br/><small>Unit Saprodi Retail</small>
        </div>
        <div style="font-size:9px; margin-bottom:5px;">
            No: ${lastTransaction.transaction_code}<br/>Pel: ${lastTransaction.customer_name}
        </div>
        ${itemsHtml}
        <div style="border-top:1px dashed #000; padding-top:5px; margin-top:5px; text-align:right;">
            <b>TOTAL: Rp ${lastTransaction.total_amount.toLocaleString('id-ID')}</b>
        </div>
        <div style="text-align:center; margin-top:10px; font-size:8px;">Terima Kasih</div>
      </body></html>`;
      const doc = iframe.contentWindow?.document;
      if (doc) {
          doc.open(); doc.write(content); doc.close();
          setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 500);
      }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()));

  return (
    <Layout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0 px-2">
            <button onClick={() => navigate('/sales/retail')} className="flex items-center text-slate-500 hover:text-slate-800 gap-2 font-bold"><ArrowLeft size={16}/> Kembali</button>
            <div className="text-center">
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Kasir Digital Saprodi</h1>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <Store size={10}/> Point of Sale
                </p>
            </div>
            <div className="w-20"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            {/* CATALOG */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" placeholder="Cari barang..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500" value={searchProd} onChange={e => setSearchProd(e.target.value)} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-4 custom-scrollbar">
                    {filteredProducts.map(p => (
                        <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg transition-all group flex flex-col">
                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors"><ShoppingCart size={18}/></div>
                            <h3 className="font-bold text-slate-800 text-xs mb-1 line-clamp-2 h-8">{p.name}</h3>
                            <p className="font-black text-blue-600 text-sm mb-3">Rp {p.price_guide?.toLocaleString('id-ID')}</p>
                            <button onClick={() => addToCart(p)} className="w-full mt-auto py-2 bg-slate-900 text-white font-bold text-[10px] rounded-xl hover:bg-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Plus size={14}/> Tambah</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* CART */}
            <div className="w-full lg:w-[380px] flex flex-col bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 shrink-0">
                <div className="p-6 pb-2 space-y-4">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl">
                        <button onClick={() => setCustomerType('FARMER')} className={`py-2 text-[10px] rounded-xl font-black uppercase transition-all ${customerType === 'FARMER' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Anggota</button>
                        <button onClick={() => setCustomerType('GENERAL')} className={`py-2 text-[10px] rounded-xl font-black uppercase transition-all ${customerType === 'GENERAL' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Umum</button>
                    </div>

                    {customerType === 'FARMER' ? (
                        <div className="relative" ref={farmerDropdownRef}>
                            <button onClick={() => setIsFarmerDropdownOpen(!isFarmerDropdownOpen)} className="w-full bg-white/10 border border-white/10 rounded-2xl text-left p-3 text-white flex items-center justify-between">
                                <span className="text-sm truncate">{selectedFarmerId ? farmers.find(f => f.id === selectedFarmerId)?.name : 'Pilih Nama Anggota...'}</span>
                                <ChevronDown size={16} className="text-slate-500" />
                            </button>
                            {isFarmerDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden">
                                    <div className="p-2 border-b bg-slate-50"><input autoFocus type="text" className="w-full p-2 text-sm border rounded-xl outline-none" placeholder="Cari..." value={farmerSearchQuery} onChange={e => setFarmerSearchQuery(e.target.value)} /></div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {farmers.filter(f => f.name.toLowerCase().includes(farmerSearchQuery.toLowerCase())).map(f => (
                                            <button key={f.id} onClick={() => { setSelectedFarmerId(f.id); setIsFarmerDropdownOpen(false); }} className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-0 flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{f.name}</span>
                                                <span className="text-[10px] text-blue-600 font-bold">{f.username}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <input className="w-full bg-white/10 border border-white/10 rounded-2xl text-sm p-3 text-white outline-none" placeholder="Nama Pembeli..." value={generalCustomerName} onChange={e => setGeneralCustomerName(e.target.value)} />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-white"><PackageOpen size={60}/><p className="font-black uppercase tracking-widest text-[10px] mt-2">Kosong</p></div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item) => (
                                <div key={item.product_id} className="bg-white/5 p-4 rounded-2xl flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-[11px] text-white leading-tight pr-4">{item.product_name}</span>
                                        <button onClick={() => removeFromCart(item.product_id)} className="text-white/20 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl">
                                        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-1 py-1">
                                            <button onClick={() => updateQty(item.product_id, item.qty - 1)} className="p-1 text-white hover:text-blue-400"><Minus size={14}/></button>
                                            <span className="text-xs font-black w-6 text-center text-white">{item.qty}</span>
                                            <button onClick={() => updateQty(item.product_id, item.qty + 1)} className="p-1 text-white hover:text-blue-400"><Plus size={14}/></button>
                                        </div>
                                        <p className="font-black text-blue-400 text-xs">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-800 shrink-0">
                    <div className="flex justify-between items-end mb-6">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Total Bayar</p><p className="text-3xl font-black text-white tracking-tighter">Rp {totalAmount.toLocaleString('id-ID')}</p></div>
                        <button onClick={() => setCart([])} className="text-[10px] font-black text-red-400 uppercase">Reset</button>
                    </div>
                    <button onClick={handleCheckout} disabled={loading || cart.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-3xl font-black uppercase text-xs flex justify-center gap-3 items-center shadow-xl active:scale-95 transition-all">
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <><Save size={18}/> Bayar Sekarang</>}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {showReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3"><Receipt size={24}/><h3 className="font-black uppercase tracking-widest text-sm">Berhasil</h3></div>
                      <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 flex-1 overflow-y-auto text-center">
                      <div className="mb-6 border-b-2 border-slate-100 border-dashed pb-4">
                          <h2 className="font-black text-xl uppercase text-slate-800">SIMULTAN ERP</h2>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Struk Belanja Tani</p>
                      </div>
                      <div className="flex justify-between font-black text-2xl text-slate-900 border-t-2 border-slate-900 border-dashed pt-4 mb-8">
                          <span>TOTAL</span><span>Rp {lastTransaction.total_amount.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-[10px] font-black text-blue-600 uppercase italic mb-8 flex items-center justify-center gap-2"><CheckCircle size={14}/> LUNAS - TRANSAKSI DISIMPAN</p>
                      <div className="flex gap-3">
                          <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-4 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><Printer size={16}/> Cetak Struk</button>
                          <button onClick={() => setShowReceipt(false)} className="flex-1 bg-blue-600 text-white py-4 rounded-3xl font-black uppercase text-xs tracking-widest">Selesai</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};
