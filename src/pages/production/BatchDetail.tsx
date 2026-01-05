
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import {
    ArrowLeft, Weight, CheckCircle, FileText, Activity,
    Users, Info, TrendingDown, DollarSign, Calendar, X,
    ArrowRightLeft, List
} from 'lucide-react';
import { Batch } from '../../types/database';

export const BatchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [batch, setBatch] = useState<Batch | any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Modals State
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);

    // Log Form
    const [newLog, setNewLog] = useState({ process_type: 'FERMENTATION', temperature: 0, humidity: 0, notes: '' });

    // QC & Finish Form
    const [finishData, setFinishData] = useState({
        final_product_id: '',
        final_weight: 0,
        reject_product_id: '',
        reject_weight: 0,
        moisture: 0,
        bean_count: 0,
        waste_percent: 0,
        reject_percent: 0,
        notes: ''
    });

    useEffect(() => {
        fetchBatchDetail();
        fetchProducts();
    }, [id]);

    const fetchBatchDetail = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                const isClosed = id === '1';
                setBatch({
                    id: id,
                    batch_code: isClosed ? 'Batch.SH001.KB.XII.2025.001' : 'Batch.SH001.KB.XII.2025.002',
                    shelter_id: 's1',
                    start_date: '2025-12-01',
                    end_date: isClosed ? '2025-12-08' : null,
                    status: isClosed ? 'closed' : 'processing',
                    total_input_weight: 500,
                    total_output_weight: isClosed ? 485.5 : 0,
                    total_cost: 7500000,
                    hpp_per_kg: isClosed ? 15447.99 : 0,
                    qc_data: isClosed ? {
                        moisture: 6.5,
                        bean_count: 95,
                        waste_percent: 1.2,
                        notes: 'Kualitas sangat baik, fermentasi sempurna.'
                    } : null
                });
                setLogs([
                    { id: 'l1', log_date: '2025-12-02', process_type: 'FERMENTATION', temperature: 45, notes: 'Pembalikan pertama' },
                    { id: 'l2', log_date: '2025-12-05', process_type: 'DRYING', temperature: 38, notes: 'Penjemuran hari ke-1' }
                ]);
                setSources([
                    { id: 'src1', quantity_used: 200, purchase_transactions: { transaction_code: 'TRX-001', farmers: { name: 'Budi Santoso' } } },
                    { id: 'src2', quantity_used: 300, purchase_transactions: { transaction_code: 'TRX-002', farmers: { name: 'Siti Aminah' } } }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        const { data } = await supabase.from('batches').select('*').eq('id', id).single();
        if (data) setBatch(data);

        const { data: lData } = await supabase.from('processing_logs').select('*').eq('batch_id', id).order('log_date', { ascending: false });
        if (lData) setLogs(lData);

        const { data: sData } = await supabase
            .from('batch_sources')
            .select(`id, quantity_used, purchase_transactions(transaction_code, farmers(name))`)
            .eq('batch_id', id);
        if (sData) setSources(sData);

        setLoading(false);
    };

    const fetchProducts = async () => {
        if (!isConfigured()) {
            setProducts([
                { id: 'p_ferm', name: 'Biji Kakao Fermentasi' },
                { id: 'p_asalan', name: 'Biji Kakao Asalan' }
            ]);
            return;
        }
        const { data } = await supabase.from('products').select('id, name');
        if (data) setProducts(data);
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConfigured()) {
            setLogs(prev => [{ ...newLog, id: Date.now(), log_date: new Date().toISOString() }, ...prev]);
            setNewLog({ process_type: 'FERMENTATION', temperature: 0, humidity: 0, notes: '' });
            return;
        }
        const { error } = await supabase.from('processing_logs').insert([{ ...newLog, batch_id: id }]);
        if (!error) {
            fetchBatchDetail();
            setNewLog({ process_type: 'FERMENTATION', temperature: 0, humidity: 0, notes: '' });
        } else {
            alert("Gagal menyimpan log: " + error.message);
        }
    };

    const handleFinishBatch = async () => {
        if (!finishData.final_product_id || finishData.final_weight <= 0) {
            alert("Lengkapi data produk utama dan berat hasil.");
            return;
        }
        setSaving(true);
        const totalOutput = finishData.final_weight + finishData.reject_weight;
        const hpp = (batch?.total_cost || 0) / (totalOutput || 1);

        if (!isConfigured()) {
            setTimeout(() => {
                alert(`Demo: Batch Closed.\nHPP: Rp ${hpp.toLocaleString()}/kg`);
                navigate('/production');
            }, 1000);
            return;
        }

        try {
            const { error } = await supabase.from('batches').update({
                status: 'closed',
                final_product_id: finishData.final_product_id,
                end_date: new Date().toISOString(),
                total_output_weight: totalOutput,
                hpp_per_kg: hpp,
                qc_data: {
                    moisture: finishData.moisture,
                    bean_count: finishData.bean_count,
                    waste_percent: finishData.waste_percent,
                    notes: finishData.notes
                }
            }).eq('id', id);

            if (error) throw error;
            navigate('/production');
        } catch (err: any) {
            alert("Error: " + err.message);
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="p-10 text-center">Loading...</div></Layout>;
    if (!batch) return <Layout><div className="p-10 text-center">Batch tidak ditemukan.</div></Layout>;

    const weightLoss = batch.status === 'closed' ? batch.total_input_weight - batch.total_output_weight : 0;
    const yieldPercent = batch.status === 'closed' ? (batch.total_output_weight / batch.total_input_weight * 100).toFixed(1) : 0;

    // FIX: Use total_cost directly for journal value to match 'Total Nilai Bahan Baku'
    const totalValueForJournal = batch.total_cost || 0;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20">
                <button onClick={() => navigate('/production')} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 gap-2 transition-colors"><ArrowLeft size={16} /> Kembali</button>

                {/* HEADER & STATUS */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-slate-800">{batch.batch_code}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${batch.status === 'open' ? 'bg-blue-100 text-blue-700' : batch.status === 'processing' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {batch.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Calendar size={14} /> Mulai: {new Date(batch.start_date).toLocaleDateString()}</span>
                                {batch.end_date && <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Selesai: {new Date(batch.end_date).toLocaleDateString()}</span>}
                                <span className="flex items-center gap-1"><Weight size={14} /> Input Awal: {batch.total_input_weight} Kg</span>
                            </div>
                        </div>
                    </div>

                    {batch.status === 'closed' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Hasil Akhir (Netto)</p>
                                <p className="text-2xl font-bold text-blue-900">{batch.total_output_weight} <span className="text-sm font-normal">Kg</span></p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <p className="text-xs font-bold text-green-600 uppercase mb-1">HPP Produksi</p>
                                <p className="text-2xl font-bold text-green-900 font-mono">Rp {new Intl.NumberFormat('id-ID').format(batch.hpp_per_kg || 0)}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs font-bold text-orange-600 uppercase mb-1">Penyusutan (Loss)</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-orange-900">{weightLoss.toFixed(1)} <span className="text-sm font-normal">Kg</span></p>
                                    <span className="text-xs font-bold text-orange-700 flex items-center"><TrendingDown size={12} /> {(100 - parseFloat(yieldPercent as string)).toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Rendemen</p>
                                <p className="text-2xl font-bold text-purple-900">{yieldPercent}%</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {batch.status === 'closed' && batch.qc_data && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Hasil Quality Control (QC)</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Kadar Air</p>
                                        <p className="text-lg font-bold text-slate-700">{batch.qc_data.moisture}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Bean Count</p>
                                        <p className="text-lg font-bold text-slate-700">{batch.qc_data.bean_count}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Waste</p>
                                        <p className="text-lg font-bold text-slate-700">{batch.qc_data.waste_percent}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                                        <p className="text-lg font-bold text-green-600">PASSED</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 italic">
                                    "{batch.qc_data.notes}"
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-orange-500" /> Log Aktivitas Produksi</h3>
                            </div>

                            {batch.status !== 'closed' && (
                                <form onSubmit={handleAddLog} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aktivitas</label>
                                        <select className="w-full border p-2 rounded text-sm bg-white" value={newLog.process_type} onChange={e => setNewLog({ ...newLog, process_type: e.target.value })}>
                                            <option value="FERMENTATION">Fermentasi</option>
                                            <option value="DRYING">Penjemuran</option>
                                            <option value="SORTING">Sortasi</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Suhu (°C)</label>
                                            <input type="number" className="w-full border p-2 rounded text-sm" value={newLog.temperature || ''} onChange={e => setNewLog({ ...newLog, temperature: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kelem. (%)</label>
                                            <input type="number" className="w-full border p-2 rounded text-sm" value={newLog.humidity || ''} onChange={e => setNewLog({ ...newLog, humidity: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan</label>
                                        <input className="w-full border p-2 rounded text-sm" placeholder="Keterangan..." value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-3 flex justify-end">
                                        <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-shadow shadow-md">Simpan Log</button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-4">
                                {logs.map((log, idx) => (
                                    <div key={log.id || idx} className="flex gap-4 border-l-2 border-slate-200 pl-6 pb-6 last:pb-0 relative">
                                        <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[7.5px] top-1"></div>
                                        <div className="text-xs text-slate-400 w-24 shrink-0 font-mono">
                                            {new Date(log.log_date).toLocaleDateString()}<br />
                                            {new Date(log.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg flex-1 border border-slate-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-slate-800 text-sm">{log.process_type}</p>
                                                <div className="flex gap-2">
                                                    {log.temperature > 0 && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{log.temperature}°C</span>}
                                                    {log.humidity > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{log.humidity}%</span>}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600">{log.notes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Kontrol Batch</h3>
                            {batch.status === 'closed' ? (
                                <div className="space-y-3">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                                        <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                                        <p className="text-green-800 font-bold">Produksi Selesai</p>
                                        <p className="text-[10px] text-green-600 mt-1 uppercase font-bold tracking-tighter">Stok otomatis masuk ke gudang</p>
                                    </div>
                                    <button
                                        onClick={() => setShowJournalModal(true)}
                                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-slate-900/10"
                                    >
                                        <DollarSign size={18} /> Lihat Jurnal Akuntansi
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowFinishModal(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/20 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02]"
                                    >
                                        <span className="text-lg">Tutup & Selesaikan</span>
                                        <span className="text-[10px] font-normal opacity-90 uppercase tracking-widest">Input QC & Hasil Akhir</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                                <Users size={16} />
                                <h3 className="font-bold text-sm">Asal Bahan Baku</h3>
                            </div>
                            <div className="p-0">
                                {sources.map((src, idx) => (
                                    <div key={idx} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors">
                                        <p className="text-xs font-mono text-blue-600 font-bold mb-1">{src.purchase_transactions?.transaction_code}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-800 truncate pr-2">{src.purchase_transactions?.farmers?.name}</span>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">{src.quantity_used} Kg</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-slate-50 text-center">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Nilai Bahan Baku</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1">Rp {new Intl.NumberFormat('id-ID').format(batch.total_cost || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL JURNAL AKUNTANSI */}
                {showJournalModal && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300">
                            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg"><DollarSign size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-lg">Rincian Jurnal Akuntansi</h3>
                                        <p className="text-xs text-slate-400 font-mono">Journal Ref: JV/{batch.batch_code}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Keterangan Jurnal</p>
                                        <p className="text-sm font-semibold text-slate-800">Transfer Nilai Produksi - {batch.batch_code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Posting</p>
                                        <p className="text-sm font-semibold text-slate-800">{new Date(batch.end_date || '').toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <table className="w-full text-sm">
                                    <thead className="text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Nama Akun</th>
                                            <th className="px-4 py-3 text-right">Debit (Rp)</th>
                                            <th className="px-4 py-3 text-right">Kredit (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-slate-800">1-1310 Persediaan Barang Jadi</p>
                                                <p className="text-[10px] text-blue-600">Penerimaan {batch.total_output_weight} Kg Biji Kakao Ferm.</p>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">
                                                {new Intl.NumberFormat('id-ID').format(totalValueForJournal)}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-slate-300">-</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-4 py-4 pl-8">
                                                <p className="font-medium text-slate-700">1-1320 Persediaan Barang Dalam Proses</p>
                                                <p className="text-[10px] text-slate-400">Pelepasan bahan baku batch {batch.batch_code}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-slate-300">-</td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">
                                                {new Intl.NumberFormat('id-ID').format(totalValueForJournal)}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot className="border-t-2 border-slate-900">
                                        <tr className="bg-slate-950 text-white font-bold">
                                            <td className="px-4 py-3 uppercase text-xs tracking-widest">TOTAL BALANCE</td>
                                            <td className="px-4 py-3 text-right font-mono">{new Intl.NumberFormat('id-ID').format(totalValueForJournal)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{new Intl.NumberFormat('id-ID').format(totalValueForJournal)}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className="mt-6 flex gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <Info className="text-blue-600 shrink-0" size={20} />
                                    <p className="text-xs text-blue-800 leading-relaxed italic">
                                        Jurnal ini dibuat otomatis oleh sistem saat batch berstatus CLOSED. Nilai di atas dihitung berdasarkan total modal pembelian bahan baku yang dihubungkan ke batch ini.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 border-t bg-slate-50 flex justify-end">
                                <button
                                    onClick={() => setShowJournalModal(false)}
                                    className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Tutup Rincian
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FINISH MODAL */}
                {showFinishModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-300">
                            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">Tutup Batch Produksi</h3>
                                    <p className="text-xs text-slate-400">Verifikasi kualitas dan hitung hasil akhir produksi.</p>
                                </div>
                                <button onClick={() => setShowFinishModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">✕</button>
                            </div>

                            <div className="p-8 overflow-y-auto space-y-8 bg-slate-50">
                                {/* 1. HASIL FISIK */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Weight className="text-blue-600" size={20} />
                                        <h4 className="font-bold text-slate-800">1. Hasil Output Fisik</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Produk Utama (Hasil Jadi)</label>
                                            <select className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl focus:border-blue-500 outline-none font-medium" value={finishData.final_product_id} onChange={e => setFinishData({ ...finishData, final_product_id: e.target.value })}>
                                                <option value="">-- Pilih Produk --</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Berat Bersih (Netto Kg)</label>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl focus:border-blue-500 outline-none text-xl font-bold text-blue-600"
                                                placeholder="0.00"
                                                value={finishData.final_weight || ''}
                                                onChange={e => setFinishData({ ...finishData, final_weight: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. DATA KUALITAS */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="text-orange-600" size={20} />
                                        <h4 className="font-bold text-slate-800">2. Laporan Quality Control</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kadar Air (%)</label>
                                            <input type="number" step="0.1" className="w-full border p-2 rounded-lg" value={finishData.moisture || ''} onChange={e => setFinishData({ ...finishData, moisture: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bean Count / 100g</label>
                                            <input type="number" className="w-full border p-2 rounded-lg" value={finishData.bean_count || ''} onChange={e => setFinishData({ ...finishData, bean_count: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Waste/Sampah (%)</label>
                                            <input type="number" step="0.1" className="w-full border p-2 rounded-lg" value={finishData.waste_percent || ''} onChange={e => setFinishData({ ...finishData, waste_percent: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div className="col-span-full">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan QC</label>
                                            <textarea className="w-full border p-2 rounded-lg text-sm" rows={2} value={finishData.notes} onChange={e => setFinishData({ ...finishData, notes: e.target.value })} placeholder="Misal: Biji kering sempurna, warna seragam." />
                                        </div>
                                    </div>
                                </div>

                                {/* PREVIEW RENDEMEN & HPP */}
                                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Simulasi Hasil Produksi</h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase mb-1">Est. HPP Produksi</p>
                                            <p className="text-2xl font-bold text-green-400 font-mono">
                                                Rp {new Intl.NumberFormat('id-ID').format((batch.total_cost || 0) / (finishData.final_weight || 1))} <span className="text-xs text-white">/Kg</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase mb-1">Rendemen Akhir</p>
                                            <p className="text-2xl font-bold text-white">
                                                {((finishData.final_weight / batch.total_input_weight) * 100).toFixed(1)} %
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 border-t bg-white flex justify-end gap-3">
                                <button onClick={() => setShowFinishModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                                <button
                                    onClick={handleFinishBatch}
                                    disabled={saving || !finishData.final_product_id}
                                    className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-900/20 transition-all hover:scale-105"
                                >
                                    {saving ? 'Memproses...' : 'Konfirmasi Selesai'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};
