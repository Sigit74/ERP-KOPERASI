
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, Filter, CheckSquare, RefreshCw } from 'lucide-react';

export const CreateBatch = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [shelters, setShelters] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Selection Filters
    const [selectedShelterId, setSelectedShelterId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState(''); // Raw Material

    // Available Transactions
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedTrxIds, setSelectedTrxIds] = useState<string[]>([]);

    // Form
    const [batchCode, setBatchCode] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchMaster = async () => {
            if (!isConfigured()) {
                setShelters([{ id: 's1', name: 'Shelter Pusat', code: 'SH001' }]);
                setProducts([{ id: 'p1', name: 'Biji Kakao Basah', sku: 'KB' }]);
                return;
            }
            const [s, p] = await Promise.all([
                supabase.from('shelters').select('id, name, code'),
                supabase.from('products').select('id, name, sku') // Ideal: filter raw materials only
            ]);
            if (s.data) setShelters(s.data);
            if (p.data) setProducts(p.data);
        };
        fetchMaster();
    }, []);

    const generateBatchCode = async (shelterId: string, productId: string) => {
        if (!shelterId || !productId) return;

        const shelter = shelters.find(s => s.id === shelterId);
        const product = products.find(p => p.id === productId);

        if (!shelter || !product) return;

        // Logic: Batch.[ShelterCode].[ProductSKU/Initials].[MonthRoman].[Year].[Seq]
        // E.g. Batch.SH001.KB.XII.2025.001

        const shelterCode = shelter.code || 'SH';
        // Use first 2 letters of SKU or Name if SKU is long
        const productCode = product.sku ? product.sku.split('-')[0] : 'RAW';

        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        const monthRoman = romans[month];

        const prefix = `Batch.${shelterCode}.${productCode}.${monthRoman}.${year}`;

        let nextSeq = 1;
        if (isConfigured()) {
            try {
                const { count } = await supabase
                    .from('batches')
                    .select('*', { count: 'exact', head: true })
                    .ilike('batch_code', `${prefix}%`);
                if (count !== null) nextSeq = count + 1;
            } catch (e) { console.error(e); }
        } else {
            nextSeq = Math.floor(Math.random() * 50) + 1;
        }

        const seqStr = nextSeq.toString().padStart(3, '0');
        setBatchCode(`${prefix}.${seqStr}`);
    };

    useEffect(() => {
        generateBatchCode(selectedShelterId, selectedProductId);
    }, [selectedShelterId, selectedProductId]);

    const fetchTransactions = async () => {
        if (!selectedShelterId || !selectedProductId) return;
        setLoading(true);

        if (!isConfigured()) {
            setTimeout(() => {
                setTransactions([
                    { id: 't1', transaction_code: 'TRX-001', quantity: 50, transaction_date: '2024-05-20', farmers: { name: 'Budi Santoso' } },
                    { id: 't2', transaction_code: 'TRX-002', quantity: 100, transaction_date: '2024-05-21', farmers: { name: 'Siti Aminah' } },
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        // Fetch confirmed transactions for this shelter & product
        const { data: trxData, error: trxErr } = await supabase
            .from('purchase_transactions')
            .select('id, transaction_code, quantity, transaction_date, farmers(name)')
            .eq('shelter_id', selectedShelterId)
            .eq('product_id', selectedProductId)
            .eq('status', 'completed');

        if (trxErr) throw trxErr;

        // Check which transactions are already in a batch
        const { data: usedTrx } = await supabase
            .from('batch_sources')
            .select('purchase_transaction_id')
            .in('purchase_transaction_id', (trxData || []).map(t => t.id));

        const usedIds = new Set(usedTrx?.map(u => u.purchase_transaction_id) || []);

        if (trxData) {
            setTransactions(trxData.map(t => ({
                ...t,
                is_used: usedIds.has(t.id)
            })));
        }
        setLoading(false);
    };

    const toggleTrx = (id: string) => {
        if (selectedTrxIds.includes(id)) {
            setSelectedTrxIds(prev => prev.filter(tid => tid !== id));
        } else {
            setSelectedTrxIds(prev => [...prev, id]);
        }
    };

    const totalWeight = transactions
        .filter(t => selectedTrxIds.includes(t.id))
        .reduce((sum, t) => sum + t.quantity, 0);

    const handleSubmit = async () => {
        if (selectedTrxIds.length === 0) return alert("Pilih minimal satu transaksi.");
        if (!batchCode) return alert("Kode Batch belum tergenerate.");
        setLoading(true);

        if (!isConfigured()) {
            alert(`Demo: Batch ${batchCode} Created!`);
            navigate('/production');
            return;
        }

        try {
            // 1. Calculate Total Cost (Approximation based on source TRX)
            const { data: trxData } = await supabase
                .from('purchase_transactions')
                .select('id, total_amount')
                .in('id', selectedTrxIds);

            const totalCost = trxData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

            // 2. Create Batch Header
            const { data: batch, error: bErr } = await supabase.from('batches').insert([{
                batch_code: batchCode,
                shelter_id: selectedShelterId,
                status: 'open',
                notes: notes,
                total_input_weight: totalWeight,
                total_cost: totalCost
            }]).select().single();

            if (bErr) throw bErr;

            // 3. Insert Batch Sources
            const sources = selectedTrxIds.map(tid => {
                const t = transactions.find(tx => tx.id === tid);
                return {
                    batch_id: batch.id,
                    purchase_transaction_id: tid,
                    quantity_used: t.quantity
                };
            });

            const { error: sErr } = await supabase.from('batch_sources').insert(sources);
            if (sErr) throw sErr;

            navigate('/production');

        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-20">
                <button onClick={() => navigate('/production')} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 gap-2"><ArrowLeft size={16} /> Batal</button>

                <h1 className="text-2xl font-bold text-slate-800 mb-6">Buat Batch Produksi Baru</h1>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Filter size={18} /> 1. Pilih Sumber Bahan Baku</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Shelter Asal</label>
                            <select className="w-full border p-2 rounded" value={selectedShelterId} onChange={e => setSelectedShelterId(e.target.value)}>
                                <option value="">-- Pilih --</option>
                                {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Komoditas Mentah</label>
                            <select className="w-full border p-2 rounded" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                                <option value="">-- Pilih --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <button onClick={fetchTransactions} disabled={!selectedShelterId || !selectedProductId} className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50">
                            Cari Stok
                        </button>
                    </div>
                </div>

                {transactions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-slide-up">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><CheckSquare size={18} /> 2. Pilih Transaksi Pembelian</h3>
                        <div className="overflow-x-auto max-h-60 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                                    <tr>
                                        <th className="p-3 w-10">
                                            <input type="checkbox" onChange={(e) => {
                                                if (e.target.checked) setSelectedTrxIds(transactions.filter(t => !t.is_used).map(t => t.id));
                                                else setSelectedTrxIds([]);
                                            }} />
                                        </th>
                                        <th className="p-3">Kode TRX</th>
                                        <th className="p-3">Tanggal</th>
                                        <th className="p-3">Petani</th>
                                        <th className="p-3 text-right">Berat (Kg)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.map(t => (
                                        <tr key={t.id} className={`hover:bg-slate-50 ${selectedTrxIds.includes(t.id) ? 'bg-blue-50' : ''} ${t.is_used ? 'opacity-60 grayscale' : ''}`}>
                                            <td className="p-3">
                                                <input type="checkbox" checked={selectedTrxIds.includes(t.id)} onChange={() => toggleTrx(t.id)} disabled={t.is_used} />
                                            </td>
                                            <td className="p-3 font-mono flex items-center gap-2">
                                                {t.transaction_code}
                                                {t.is_used && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">SUDAH DI BATCH</span>}
                                            </td>
                                            <td className="p-3">
                                                {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="p-3">{t.farmers?.name || 'Unknown'}</td>
                                            <td className="p-3 text-right font-bold">{t.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end items-center gap-4 text-sm">
                            <span className="text-slate-500">{selectedTrxIds.length} transaksi dipilih</span>
                            <span className="font-bold text-lg text-slate-800">Total: {totalWeight} Kg</span>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 mb-4">3. Konfirmasi & Kode Otomatis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kode Batch</label>
                            <div className="flex gap-2">
                                <input className="w-full border p-2 rounded bg-slate-100 font-mono text-blue-700 font-bold" value={batchCode} readOnly placeholder="Otomatis..." />
                                <button type="button" onClick={() => generateBatchCode(selectedShelterId, selectedProductId)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded"><RefreshCw size={20} /></button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Format: Batch.[Shelter].[Produk].[Bulan].[Tahun].[Urut]</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Produksi</label>
                            <input className="w-full border p-2 rounded" placeholder="Catatan awal..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedTrxIds.length === 0 || !batchCode}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex justify-center gap-2 items-center"
                    >
                        <Save size={18} /> {loading ? 'Memproses...' : 'Buat Batch Baru'}
                    </button>
                </div>

            </div>
        </Layout>
    );
};
