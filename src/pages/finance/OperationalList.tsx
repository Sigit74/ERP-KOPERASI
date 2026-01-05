import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Wallet, ShoppingBag, Truck, FileText, ChevronRight, TrendingDown, DollarSign, Calendar, Eye, Trash2, X, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OperationalList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
    const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
    const [purchaseItems, setPurchaseItems] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        if (!isConfigured()) {
            // Mock Data
            setExpenses([
                { id: '1', category: 'ATK', amount: 150000, expense_date: '2026-01-01', notes: 'Kertas & Tinta', payment_method: 'CASH' },
                { id: '2', category: 'Transport', amount: 500000, expense_date: '2026-01-02', notes: 'Bensin Operasional', payment_method: 'BANK_TRANSFER' }
            ]);
            setPurchases([
                { id: '1', transaction_code: 'EP-001', vendor_id: 'v1', total_amount: 5000000, transaction_date: '2026-01-01', status: 'completed', vendors: { name: 'Toko Tani Makmur' }, shelter_id: 's1' }
            ]);
            setLoading(false);
            return;
        }

        try {
            const { data: expData } = await supabase.from('operational_expenses').select('*, coop_staff(full_name)').order('expense_date', { ascending: false }).limit(10);
            const { data: purData } = await supabase.from('external_purchases').select('*, vendors(name)').order('transaction_date', { ascending: false }).limit(10);

            if (expData) setExpenses(expData);
            if (purData) setPurchases(purData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm("Hapus biaya ini?")) return;
        if (!isConfigured()) return;
        await supabase.from('operational_expenses').delete().eq('id', id);
        fetchData();
    };

    const handleDeletePurchase = async (id: string) => {
        if (!window.confirm("Hapus transaksi belanja ini? Data stok mungkin perlu disesuaikan manual.")) return;
        if (!isConfigured()) return;
        await supabase.from('external_purchases').delete().eq('id', id);
        fetchData();
    };

    const viewPurchaseDetail = async (p: any) => {
        setSelectedPurchase(p);
        if (!isConfigured()) {
            setPurchaseItems([{ product_id: 'p1', quantity: 10, total_amount: 1000000, products: { name: 'Pupuk' } }]);
            return;
        }
        // In this simplified schema, we don't have a separate items table for external_purchases yet in the prompt-provided schema.
        // Wait, the prompt provided external_purchases but didn't provide external_purchase_items.
        // I should check if I created such a table. Looking at Step 792, I only created external_purchases.
        // The SupplierPurchaseForm from Step 786 inserted to stock_movements directly.
        // So I'll fetch stock_movements with the same reference_note.
        const { data } = await supabase.from('stock_movements')
            .select('*, products(name)')
            .eq('reference_note', `Supplier Purchase: ${p.transaction_code}`);
        if (data) setPurchaseItems(data);
    };

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Operasional & Biaya</h1>
                    <p className="text-slate-500 text-sm italic">Monitoring pengeluaran rutin dan belanja supplier.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/finance/vendors')} className="bg-white text-slate-800 border-2 border-slate-100 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-sm active:scale-95 transition-all outline-none">
                        <Truck size={18} /> Pemasok
                    </button>
                    <button onClick={() => navigate('/finance/expenses/new')} className="bg-red-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-red-200 active:scale-95 transition-all">
                        <TrendingDown size={18} /> Catat Biaya
                    </button>
                    <button onClick={() => navigate('/purchases/supplier')} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-xl active:scale-95 transition-all">
                        <ShoppingBag size={18} /> Belanja Stok
                    </button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600"><Wallet size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Biaya (Bulan Ini)</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">Rp {totalExpense.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><ShoppingBag size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Belanja Supplier</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">Rp {purchases.reduce((sum, p) => sum + p.total_amount, 0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"><Truck size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mitra Supplier</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{purchases.length} Aktif</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Expenses */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                        <TrendingDown size={16} className="text-red-600" /> Pengeluaran Terakhir
                    </h3>
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {expenses.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold italic">Belum ada pengeluaran.</div>
                            ) : expenses.map(e => (
                                <div key={e.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><FileText size={18} /></div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm leading-tight">{e.category}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{e.notes || 'No description'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className="font-black text-red-600">Rp {e.amount.toLocaleString('id-ID')}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{e.expense_date}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setSelectedExpense(e)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Eye size={16} /></button>
                                            <button onClick={() => navigate(`/finance/expenses/edit/${e.id}`)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDeleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Purchases */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                        <ShoppingBag size={16} className="text-blue-600" /> Belanja Supplier (Stok)
                    </h3>
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {purchases.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold italic">Belum ada pembelian.</div>
                            ) : purchases.map(p => (
                                <div key={p.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-[10px] uppercase">
                                            {p.status === 'completed' ? 'PASS' : 'WAIT'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm leading-tight">{p.vendors?.name || 'Unknown Supplier'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold font-mono tracking-tighter">CODE: {p.transaction_code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className="font-black text-slate-900">Rp {p.total_amount.toLocaleString('id-ID')}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{p.transaction_date}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => viewPurchaseDetail(p)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Eye size={16} /></button>
                                            <button onClick={() => navigate(`/purchases/supplier/edit/${p.id}`)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDeletePurchase(p.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Detail Biaya */}
            {selectedExpense && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 bg-red-600 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-sm">Detail Pengeluaran</h3>
                            <button onClick={() => setSelectedExpense(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Biaya</p>
                                <p className="text-3xl font-black text-red-600">Rp {selectedExpense.amount.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="space-y-4 border-t border-slate-100 pt-6">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Kategori</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedExpense.category}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Tanggal</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedExpense.expense_date}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Metode</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedExpense.payment_method}</span>
                                </div>
                                {selectedExpense.coop_staff && (
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Staff Terkait</span>
                                        <span className="text-sm font-bold text-slate-800">{selectedExpense.coop_staff.full_name}</span>
                                    </div>
                                )}
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-2">Catatan</span>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedExpense.notes || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Belanja Supplier */}
            {selectedPurchase && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-widest text-sm">Detail Belanja Stok</h3>
                            <button onClick={() => setSelectedPurchase(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                                    <p className="text-xl font-black text-slate-800">{selectedPurchase.vendors?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedPurchase.transaction_date}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daftar Barang</p>
                                <div className="space-y-3">
                                    {purchaseItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-700">{item.products?.name}</span>
                                            <span className="font-mono text-slate-500">{item.quantity} Unit</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-400 uppercase">Grand Total</span>
                                    <span className="text-xl font-black text-slate-900">Rp {selectedPurchase.total_amount.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {selectedPurchase.notes && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <span className="block text-[10px] font-black text-blue-400 uppercase mb-2 text-right">Memo Transaksi</span>
                                    <p className="text-sm text-blue-800 font-medium">{selectedPurchase.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
