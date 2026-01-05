
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, Box, CheckSquare, RefreshCw, Info } from 'lucide-react';

export const CreateLot = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');

    const [batches, setBatches] = useState<any[]>([]); // Finished batches
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

    const [lotCode, setLotCode] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!isConfigured()) {
                setProducts([
                    { id: 'p_ferm', name: 'Biji Kakao Fermentasi', sku: 'FERM' },
                    { id: 'p_asalan', name: 'Biji Kakao Asalan', sku: 'ASLN' }
                ]);
                return;
            }
            const { data } = await supabase.from('products').select('id, name, sku');
            if (data) setProducts(data);
        };
        fetchProducts();
    }, []);

    const fetchBatches = async () => {
        if (!selectedProductId) return;
        setLoading(true);

        if (!isConfigured()) {
            setTimeout(() => {
                // SINKRONISASI: Menggunakan data yang sesuai dengan module Produksi
                const allMockBatches = [
                    {
                        id: '1',
                        batch_code: 'Batch.SH001.KB.XII.2025.001',
                        product_id: 'p_ferm',
                        total_output_weight: 485.5,
                        hpp_per_kg: 15447,
                        end_date: '2025-12-08',
                        status: 'closed'
                    },
                    {
                        id: '4',
                        batch_code: 'Batch.SH002.KB.I.2025.012',
                        product_id: 'p_ferm',
                        total_output_weight: 120.0,
                        hpp_per_kg: 16200,
                        end_date: '2025-01-05',
                        status: 'closed'
                    },
                    {
                        id: '5',
                        batch_code: 'Batch.SH001.AS.I.2025.003',
                        product_id: 'p_asalan',
                        total_output_weight: 300.0,
                        hpp_per_kg: 12500,
                        end_date: '2025-01-02',
                        status: 'closed'
                    }
                ];

                // Filter based on selected product to make it realistic
                const filtered = allMockBatches.filter(b => b.product_id === selectedProductId);
                setBatches(filtered);
                setLoading(false);
            }, 600);
            return;
        }

        try {
            // In real DB, we look for batches that produced the selected final_product_id
            const { data, error } = await supabase
                .from('batches')
                .select('*')
                .eq('status', 'closed')
                .eq('final_product_id', selectedProductId);

            if (data) setBatches(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleBatch = (id: string) => {
        if (selectedBatchIds.includes(id)) setSelectedBatchIds(prev => prev.filter(bid => bid !== id));
        else setSelectedBatchIds(prev => [...prev, id]);
    };

    // Calculations
    const selectedBatches = batches.filter(b => selectedBatchIds.includes(b.id));
    const totalWeight = selectedBatches.reduce((sum, b) => sum + (b.total_output_weight || 0), 0);

    // Weighted Average HPP
    const totalValue = selectedBatches.reduce((sum, b) => sum + ((b.total_output_weight || 0) * (b.hpp_per_kg || 0)), 0);
    const avgHpp = totalWeight > 0 ? totalValue / totalWeight : 0;

    const handleSubmit = async () => {
        if (totalWeight === 0) return alert("Pilih minimal satu batch.");
        setLoading(true);

        if (!isConfigured()) {
            setTimeout(() => {
                alert(`Berhasil! Lot ${lotCode} telah dibuat.\nTotal Berat: ${totalWeight} Kg\nAvg HPP: Rp ${avgHpp.toLocaleString()}`);
                navigate('/production/lots');
            }, 1000);
            return;
        }

        try {
            const { data: lot, error: lErr } = await supabase.from('product_lots').insert([{
                lot_code: lotCode,
                final_product_id: selectedProductId,
                quantity: totalWeight,
                available_quantity: totalWeight,
                hpp_per_kg: avgHpp
            }]).select().single();

            if (lErr) throw lErr;

            const links = selectedBatches.map(b => ({
                lot_id: lot.id,
                batch_id: b.id,
                weight_contributed: b.total_output_weight
            }));

            await supabase.from('lot_batches').insert(links);
            navigate('/production/lots');
        } catch (err: any) {
            alert("Error: " + err.message);
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-20">
                <button onClick={() => navigate('/production/lots')} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 gap-2 transition-colors"><ArrowLeft size={16} /> Batal</button>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">Buat Lot Penjualan Baru</h1>
                    <p className="text-sm text-slate-500">Gabungkan hasil dari beberapa batch produksi menjadi satu kelompok barang siap jual.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: SELECTION */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. PRODUCT SELECTION */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Box size={18} className="text-blue-600" /> 1. Pilih Produk Akhir</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <select
                                    className="flex-1 border-2 border-slate-100 bg-slate-50 p-2.5 rounded-lg outline-none focus:border-blue-500 font-medium"
                                    value={selectedProductId}
                                    onChange={e => {
                                        setSelectedProductId(e.target.value);
                                        setBatches([]);
                                        setSelectedBatchIds([]);
                                    }}
                                >
                                    <option value="">-- Pilih Produk Jadi --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button
                                    onClick={fetchBatches}
                                    disabled={!selectedProductId || loading}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Cari Batch Selesai'}
                                </button>
                            </div>
                            {!selectedProductId && (
                                <p className="mt-3 text-xs text-slate-400 italic flex items-center gap-1"><Info size={12} /> Pilih produk terlebih dahulu untuk memfilter batch yang tersedia.</p>
                            )}
                        </div>

                        {/* 2. BATCH SELECTION */}
                        {batches.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
                                <div className="p-4 bg-slate-50 border-b border-slate-200">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckSquare size={18} className="text-green-600" /> 2. Pilih Batch Produksi</h3>
                                </div>
                                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white font-bold text-slate-500 border-b sticky top-0 z-10">
                                            <tr>
                                                <th className="p-4 w-10"></th>
                                                <th className="p-4">Kode Batch</th>
                                                <th className="p-4">Tgl Selesai</th>
                                                <th className="p-4 text-right">Hasil (Kg)</th>
                                                <th className="p-4 text-right">HPP/Kg</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {batches.map(b => (
                                                <tr
                                                    key={b.id}
                                                    onClick={() => toggleBatch(b.id)}
                                                    className={`cursor-pointer transition-colors ${selectedBatchIds.includes(b.id) ? 'bg-purple-50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="p-4">
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedBatchIds.includes(b.id) ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'}`}>
                                                            {selectedBatchIds.includes(b.id) && <CheckSquare size={14} />}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-slate-700">{b.batch_code}</td>
                                                    <td className="p-4 text-slate-500">{new Date(b.end_date || '').toLocaleDateString('id-ID')}</td>
                                                    <td className="p-4 text-right font-bold text-slate-900">{b.total_output_weight} Kg</td>
                                                    <td className="p-4 text-right font-mono text-slate-500">Rp {new Intl.NumberFormat('id-ID').format(b.hpp_per_kg)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: SUMMARY CARD */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden sticky top-6">
                            <div className="p-5 bg-purple-600 text-white">
                                <h3 className="font-bold text-lg">Ringkasan Lot</h3>
                                <p className="text-xs opacity-80 uppercase tracking-widest font-medium mt-1">New Inventory Group</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kode Lot Otomatis</label>
                                    <input
                                        className="w-full border-b border-slate-200 bg-transparent font-mono font-bold text-slate-800 py-1 outline-none text-lg"
                                        value={lotCode}
                                        onChange={e => setLotCode(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Berat</p>
                                        <p className="text-xl font-bold text-slate-800">{totalWeight.toFixed(1)} <span className="text-xs font-normal">Kg</span></p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Jml Batch</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedBatchIds.length}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Estimasi HPP Rata-Rata</p>
                                    <div className="text-2xl font-mono font-bold text-blue-700">
                                        Rp {new Intl.NumberFormat('id-ID').format(avgHpp)}
                                        <span className="text-xs font-normal ml-1">/ Kg</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || selectedBatchIds.length === 0}
                                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] flex justify-center gap-2 items-center"
                                    >
                                        <Save size={20} />
                                        {loading ? 'Memproses...' : 'Selesaikan & Buat Lot'}
                                    </button>
                                    <p className="text-[10px] text-slate-400 text-center mt-4">
                                        Data Lot akan digunakan sebagai identitas saat Penjualan B2B.
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
