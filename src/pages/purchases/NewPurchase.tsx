
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, AlertTriangle, Calculator, DollarSign, RefreshCw } from 'lucide-react';
import { Farmer, Product, Shelter } from '../../types/database';

type CommodityType = 'KAKAO_BASAH' | 'KAKAO_ASALAN' | 'KAKAO_FERMENTASI' | 'GREEN_BEAN_ROBUSTA' | 'GREEN_BEAN_ARABIKA' | 'MINYAK_NILAM' | 'GENERAL';

export const NewPurchase = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Master Data
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');

    // Transaction State
    const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('GENERAL');
    const [transactionCode, setTransactionCode] = useState('');

    const [formData, setFormData] = useState({
        farmer_id: '',
        product_id: '',
        shelter_id: '',
        price_per_unit: 0,

        // Core Weight
        gross_weight: 0,

        // Quality Metrics
        sacks_count: 0,
        sack_weight_std: 0.5,

        brix: 0,
        waste_percent: 0,
        moisture_percent: 0,
        bean_count: 0,
        fungus_percent: 0,
        defects_percent: 0,

        container_weight: 0,

        // Metadata
        ims_name: '',
        notes: '',
        phone_number: ''
    });

    // Calculation Results
    const [calcResult, setCalcResult] = useState({
        netto: 0,
        deductions: [] as string[],
        isRejected: false,
        rejectReason: '',
        totalAmount: 0,
        taxAmount: 0,
        finalAmount: 0
    });

    useEffect(() => {
        fetchDependencies();
    }, []);

    // Recalculate whenever inputs change
    useEffect(() => {
        calculateNetto();
    }, [formData, selectedCommodity]);

    // Generate Transaction Code when Shelter changes
    useEffect(() => {
        if (formData.shelter_id) {
            generateTrxCode(formData.shelter_id);
        } else {
            setTransactionCode('');
        }
    }, [formData.shelter_id]);

    const generateTrxCode = async (shelterId: string) => {
        const shelter = shelters.find(s => s.id === shelterId);
        if (!shelter) return;

        const shelterCode = shelter.code || 'SH';
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

        const prefix = `TRX/${shelterCode}/${dateStr}/`;
        let nextSeq = 1;

        if (isConfigured()) {
            try {
                const { count } = await supabase
                    .from('purchase_transactions')
                    .select('*', { count: 'exact', head: true })
                    .ilike('transaction_code', `${prefix}%`);
                if (count !== null) nextSeq = count + 1;
            } catch (e) { console.error(e); }
        } else {
            nextSeq = Math.floor(Math.random() * 100) + 1;
        }

        const seqStr = nextSeq.toString().padStart(3, '0');
        setTransactionCode(`${prefix}${seqStr}`);
    };

    const fetchDependencies = async () => {
        if (!isConfigured()) {
            const mockProducts: Product[] = [
                { id: '1', sku: 'KAKAO-BASAH', name: 'Biji Kakao Basah', unit: 'KG', price_guide: 15000 },
                { id: '2', sku: 'KAKAO-ASALAN', name: 'Biji Kakao Asalan', unit: 'KG', price_guide: 35000 },
                { id: '3', sku: 'KAKAO-FERM', name: 'Biji Kakao Fermentasi', unit: 'KG', price_guide: 45000 },
                { id: '4', sku: 'GB-ROBUSTA', name: 'Green Bean Robusta', unit: 'KG', price_guide: 45000 },
                { id: '5', sku: 'GB-ARABIKA', name: 'Green Bean Arabika', unit: 'KG', price_guide: 90000 },
                { id: '6', sku: 'NILAM', name: 'Minyak Nilam', unit: 'KG', price_guide: 600000 },
            ];

            const mockFarmers: Farmer[] = [
                { id: 'f1', name: 'Budi Santoso', username: '11.2001.01.001', nik: '32010001', phone: '08123456789', status: 'active', group_id: 'g1' },
                { id: 'f2', name: 'Siti Aminah', username: '11.2001.01.002', nik: '32010002', phone: '08129876543', status: 'active', group_id: 'g1' },
            ];

            const mockShelters: Shelter[] = [
                { id: 's1', name: 'Shelter Pusat', code: 'SH001', location: 'Baebunta' },
                { id: 's2', name: 'Shelter Unit Timur', code: 'SH002', location: 'Sukatani' },
            ];

            setProducts(mockProducts);
            setFarmers(mockFarmers);
            setShelters(mockShelters);
            return;
        }

        const [fRes, pRes, sRes, gRes] = await Promise.all([
            supabase.from('farmers').select('id, name, username, nik, phone, group_id').eq('status', 'active'),
            supabase.from('products').select('*'),
            supabase.from('shelters').select('*'),
            supabase.from('farmer_groups').select('id, name, code')
        ]);

        if (fRes.data) setFarmers(fRes.data as unknown as Farmer[]);
        if (pRes.data) setProducts(pRes.data as unknown as Product[]);
        if (sRes.data) setShelters(sRes.data as unknown as Shelter[]);
        if (gRes.data) setGroups(gRes.data);
    };

    const handleProductChange = (productId: string) => {
        const prod = products.find(p => p.id === productId);
        let type: CommodityType = 'GENERAL';

        if (prod) {
            const name = prod.name.toUpperCase();
            const sku = prod.sku.toUpperCase();

            if (name.includes('BASAH') || sku.includes('BASAH')) type = 'KAKAO_BASAH';
            else if (name.includes('ASALAN') || sku.includes('ASALAN')) type = 'KAKAO_ASALAN';
            else if (name.includes('FERMENTASI') || sku.includes('FERM')) type = 'KAKAO_FERMENTASI';
            else if (name.includes('ROBUSTA') && name.includes('GREEN')) type = 'GREEN_BEAN_ROBUSTA';
            else if (name.includes('ARABIKA') && name.includes('GREEN')) type = 'GREEN_BEAN_ARABIKA';
            else if (name.includes('NILAM')) type = 'MINYAK_NILAM';
            else if (name.includes('ARABIKA')) type = 'GREEN_BEAN_ARABIKA';
            else if (name.includes('ROBUSTA')) type = 'GREEN_BEAN_ROBUSTA';

            setFormData(prev => ({ ...prev, product_id: productId, price_per_unit: 0 }));
        } else {
            setFormData(prev => ({ ...prev, product_id: productId, price_per_unit: 0 }));
        }
        setSelectedCommodity(type);
    };

    const handleFarmerChange = (farmerId: string) => {
        const f = farmers.find(farm => farm.id === farmerId);
        setFormData(prev => ({
            ...prev,
            farmer_id: farmerId,
            phone_number: f?.phone || ''
        }));
    };

    const calculateNetto = () => {
        let weight = formData.gross_weight || 0;
        let logs: string[] = [];
        let reject = false;
        let reason = '';

        if (selectedCommodity !== 'MINYAK_NILAM' && formData.sacks_count > 0) {
            const sackTare = formData.sacks_count * formData.sack_weight_std;
            weight -= sackTare;
            logs.push(`Pot. Karung (${formData.sacks_count} x ${formData.sack_weight_std}kg): -${sackTare.toFixed(2)} kg`);
        }

        if (selectedCommodity === 'KAKAO_BASAH') {
            if (formData.brix > 0 && formData.brix < 8) {
                reject = true;
                reason = "Brix Level < 8 (Reject)";
            }
            if (formData.waste_percent > 6) {
                reject = true;
                reason = "Sampah (Waste) > 6% (Reject)";
            } else if (formData.waste_percent > 3) {
                const excess = formData.waste_percent - 3;
                const ded = weight * (excess / 100);
                weight -= ded;
                logs.push(`Pot. Sampah (Toleransi 3%): -${ded.toFixed(2)} kg`);
            }
        }
        else if (['KAKAO_ASALAN', 'KAKAO_FERMENTASI'].includes(selectedCommodity)) {
            if (formData.moisture_percent > 7) {
                const excess = formData.moisture_percent - 7;
                const ded = weight * (excess / 100);
                weight -= ded;
                logs.push(`Pot. Air (Toleransi 7%): -${ded.toFixed(2)} kg`);
            }
            if (formData.waste_percent > 2.5) {
                const excess = formData.waste_percent - 2.5;
                const ded = weight * (excess / 100);
                weight -= ded;
                logs.push(`Pot. Sampah (Toleransi 2.5%): -${ded.toFixed(2)} kg`);
            }
            if (formData.fungus_percent > 4) {
                const excess = formData.fungus_percent - 4;
                const ded = weight * (excess / 100);
                weight -= ded;
                logs.push(`Pot. Jamur (Toleransi 4%): -${ded.toFixed(2)} kg`);
            }
        }
        else if (['GREEN_BEAN_ROBUSTA', 'GREEN_BEAN_ARABIKA'].includes(selectedCommodity)) {
            if (formData.moisture_percent > 12) {
                const excess = formData.moisture_percent - 12;
                const ded = weight * (excess / 100);
                weight -= ded;
                logs.push(`Pot. Air (Toleransi 12%): -${ded.toFixed(2)} kg`);
            }
            if (formData.defects_percent > 5) {
                const excess = formData.defects_percent - 5;
                const ded = weight * (excess / 100);
                weight -= ded;
                logs.push(`Pot. Biji Cacat (Toleransi 5%): -${ded.toFixed(2)} kg`);
            }
        }
        else if (selectedCommodity === 'MINYAK_NILAM') {
            if (formData.container_weight > 0) {
                weight -= formData.container_weight;
                logs.push(`Pot. Berat Drum/Jerigen: -${formData.container_weight} kg`);
            }
        }

        if (weight < 0) weight = 0;
        const total = weight * formData.price_per_unit;
        const tax = total * 0.0025;
        const final = total - tax;

        setCalcResult({
            netto: weight,
            deductions: logs,
            isRejected: reject,
            rejectReason: reason,
            totalAmount: total,
            taxAmount: tax,
            finalAmount: final
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        if (calcResult.isRejected) {
            alert("Transaksi REJECTED. Tidak dapat disimpan.");
            return;
        }
        if (formData.gross_weight <= 0) {
            alert("Berat bruto harus diisi.");
            return;
        }
        if (formData.price_per_unit <= 0) {
            alert("Harga satuan wajib diisi manual.");
            return;
        }
        if (!transactionCode) {
            alert("Kode Transaksi belum tergenerate.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                transaction_code: transactionCode,
                farmer_id: formData.farmer_id,
                product_id: formData.product_id,
                shelter_id: formData.shelter_id,
                quantity: calcResult.netto,
                gross_weight: formData.gross_weight,
                price_per_unit: formData.price_per_unit,
                total_amount: calcResult.totalAmount,
                tax_amount: calcResult.taxAmount,
                notes: formData.notes,
                ims_name: formData.ims_name,

                quality_details: {
                    commodity_type: selectedCommodity,
                    sacks_count: formData.sacks_count,
                    sack_weight: formData.sack_weight_std,
                    moisture_percent: formData.moisture_percent,
                    waste_percent: formData.waste_percent,
                    brix_level: formData.brix,
                    bean_count: formData.bean_count,
                    fungus_percent: formData.fungus_percent,
                    defects_percent: formData.defects_percent,
                    container_weight: formData.container_weight,
                    deductions_log: calcResult.deductions,
                    rejection_status: calcResult.isRejected ? 'REJECTED' : 'PASSED'
                }
            };

            if (!isConfigured()) {
                setTimeout(() => {
                    alert(`Mode Demo: Transaksi ${transactionCode} Berhasil Disimpan!`);
                    navigate('/purchases');
                }, 800);
                return;
            }

            const { error } = await supabase.from('purchase_transactions').insert([payload]);
            if (error) throw error;
            navigate('/purchases');
        } catch (err: any) {
            alert('Gagal menyimpan transaksi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20">
                <button
                    onClick={() => navigate('/purchases')}
                    className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Batal & Kembali
                </button>

                <div className="flex gap-6 flex-col xl:flex-row">

                    {/* --- LEFT FORM --- */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Pembelian Komoditas</h1>
                                <p className="text-sm text-slate-500 mt-1">Sistem otomatis menghitung Netto & Pajak 0.25%.</p>
                            </div>
                        </div>

                        <form className="p-6 space-y-6">
                            {/* Unique Transaction Code Display */}
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Nomor Transaksi (Auto-Generated)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={transactionCode}
                                        placeholder="Pilih Shelter untuk generate kode..."
                                        className="w-full bg-transparent text-blue-400 font-mono font-bold text-lg outline-none"
                                    />
                                    {formData.shelter_id && (
                                        <button type="button" onClick={() => generateTrxCode(formData.shelter_id)} className="text-slate-500 hover:text-white"><RefreshCw size={18} /></button>
                                    )}
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Shelter Penerima</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={formData.shelter_id} onChange={e => setFormData({ ...formData, shelter_id: e.target.value })}>
                                        <option value="">-- Pilih Shelter --</option>
                                        {shelters.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelompok</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                        value={selectedGroupId}
                                        onChange={e => {
                                            setSelectedGroupId(e.target.value);
                                            setFormData(prev => ({ ...prev, farmer_id: '' })); // Reset farmer selection on group change
                                        }}
                                    >
                                        <option value="">-- Semua Kelompok --</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Petani</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={formData.farmer_id} onChange={e => handleFarmerChange(e.target.value)}>
                                        <option value="">-- Pilih Petani --</option>
                                        {farmers
                                            .filter(f => !selectedGroupId || f.group_id === selectedGroupId)
                                            .map(f => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name} - {f.username || f.nik || 'No ID'}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Produk / Komoditas</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white" value={formData.product_id} onChange={e => handleProductChange(e.target.value)}>
                                        <option value="">-- Pilih Produk --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-blue-700 mb-1">Harga Satuan (Rp) <span className="text-red-500">*Manual</span></label>
                                    <input
                                        type="number"
                                        className="w-full border-2 border-blue-100 bg-blue-50 rounded-lg p-2 font-mono font-bold focus:border-blue-500 outline-none"
                                        value={formData.price_per_unit || ''}
                                        onChange={e => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-blue-800 flex items-center gap-2"><Calculator size={18} /> Input Kualitas & Berat</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">{selectedCommodity}</span>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-800 mb-1">BERAT BRUTO (KG)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full border-2 border-slate-300 rounded-lg p-3 text-2xl font-mono font-bold focus:border-blue-500 outline-none"
                                        value={formData.gross_weight || ''}
                                        onChange={e => setFormData({ ...formData, gross_weight: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    {selectedCommodity !== 'MINYAK_NILAM' && (
                                        <div className="col-span-2 flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Jml Karung</label>
                                                <input type="number" className="w-full border rounded p-2" value={formData.sacks_count || ''} onChange={e => setFormData({ ...formData, sacks_count: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Berat Karung (Kg)</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.sack_weight_std} onChange={e => setFormData({ ...formData, sack_weight_std: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                    )}

                                    {selectedCommodity === 'KAKAO_BASAH' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Level Brix</label>
                                                <input type="number" className="w-full border rounded p-2" value={formData.brix || ''} onChange={e => setFormData({ ...formData, brix: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Sampah (Waste) %</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.waste_percent || ''} onChange={e => setFormData({ ...formData, waste_percent: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </>
                                    )}

                                    {['KAKAO_ASALAN', 'KAKAO_FERMENTASI'].includes(selectedCommodity) && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Kadar Air %</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.moisture_percent || ''} onChange={e => setFormData({ ...formData, moisture_percent: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Sampah (Waste) %</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.waste_percent || ''} onChange={e => setFormData({ ...formData, waste_percent: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Jamur %</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.fungus_percent || ''} onChange={e => setFormData({ ...formData, fungus_percent: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Bean Count / 100g</label>
                                                <input type="number" className="w-full border rounded p-2" value={formData.bean_count || ''} onChange={e => setFormData({ ...formData, bean_count: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </>
                                    )}

                                    {['GREEN_BEAN_ROBUSTA', 'GREEN_BEAN_ARABIKA'].includes(selectedCommodity) && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Kadar Air %</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.moisture_percent || ''} onChange={e => setFormData({ ...formData, moisture_percent: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Biji Cacat %</label>
                                                <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.defects_percent || ''} onChange={e => setFormData({ ...formData, defects_percent: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </>
                                    )}

                                    {selectedCommodity === 'MINYAK_NILAM' && (
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Berat Jerigen / Drum (Kg)</label>
                                            <input type="number" step="0.1" className="w-full border rounded p-2" value={formData.container_weight || ''} onChange={e => setFormData({ ...formData, container_weight: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama IMS</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.ims_name} onChange={e => setFormData({ ...formData, ims_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">No HP</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                                    <textarea rows={2} className="w-full border border-slate-300 rounded-lg p-2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* --- RIGHT PANEL: LIVE CALCULATION --- */}
                    <div className="w-full xl:w-96 space-y-6">
                        <div className={`rounded-xl border shadow-lg overflow-hidden sticky top-6 ${calcResult.isRejected ? 'bg-red-50 border-red-200' : 'bg-white border-blue-200'}`}>
                            <div className={`p-4 border-b text-center font-bold flex items-center justify-center gap-2 ${calcResult.isRejected ? 'bg-red-100 text-red-800' : 'bg-blue-600 text-white'}`}>
                                {calcResult.isRejected ? <><AlertTriangle size={20} /> REJECTED</> : <><Calculator size={20} /> Kalkulasi Transaksi</>}
                            </div>

                            <div className="p-6">
                                {calcResult.isRejected ? (
                                    <div className="text-center text-red-600 font-bold py-4">
                                        {calcResult.rejectReason}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm border-b pb-2">
                                            <span className="text-slate-500">Berat Bruto</span>
                                            <span className="font-bold text-slate-900">{formData.gross_weight} Kg</span>
                                        </div>
                                        {calcResult.deductions.length > 0 && (
                                            <div className="bg-red-50 p-2 rounded text-xs text-red-600 space-y-1">
                                                {calcResult.deductions.map((d, i) => <div key={i}>{d}</div>)}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                                            <span className="text-blue-800 font-bold text-sm">NETTO</span>
                                            <span className="text-2xl font-mono font-bold text-blue-700">{calcResult.netto.toFixed(2)} <span className="text-xs">Kg</span></span>
                                        </div>
                                        <div className="pt-2 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Total Harga</span>
                                                <span className="font-mono text-slate-800">{new Intl.NumberFormat('id-ID').format(calcResult.totalAmount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-red-500">
                                                <span>Pajak (0.25%)</span>
                                                <span className="font-mono">-{new Intl.NumberFormat('id-ID').format(calcResult.taxAmount)}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-dashed pt-3 mt-2">
                                            <span className="block text-center text-xs text-slate-500 uppercase tracking-wider mb-1">Total Dibayarkan</span>
                                            <div className="text-center text-3xl font-bold text-green-600 font-mono">
                                                <span className="text-lg align-top mr-1">Rp</span>
                                                {new Intl.NumberFormat('id-ID').format(calcResult.finalAmount)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || calcResult.isRejected || formData.gross_weight <= 0 || formData.price_per_unit <= 0 || !transactionCode}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold flex justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                                >
                                    <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
