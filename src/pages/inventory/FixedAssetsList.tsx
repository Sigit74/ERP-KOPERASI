
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Building, Car, Laptop, Smartphone, Search, Trash2, Edit, Calculator, FileDown, Calendar, MapPin, DollarSign } from 'lucide-react';
import { FixedAsset } from '../../types/database';
import { exportToExcel } from '../../lib/excelUtils';

const MOCK_ASSETS: FixedAsset[] = [
    {
        id: '1', name: 'Toyota Hilux Pickup', category: 'VEHICLE', acquisition_date: '2023-01-15',
        acquisition_cost: 450000000, useful_life_years: 8, salvage_value: 50000000,
        location: 'Gudang Utama', status: 'active', serial_number: 'B 9999 XYZ'
    },
    {
        id: '2', name: 'Laptop Admin Gudang', category: 'ELECTRONIC', acquisition_date: '2023-06-01',
        acquisition_cost: 15000000, useful_life_years: 4, salvage_value: 1000000,
        location: 'Kantor Pusat', status: 'active', serial_number: 'SN-ASUS-001'
    }
];

export const FixedAssetsList = () => {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [shelters, setShelters] = useState<any[]>([]); // For location dropdown

    // Form State
    const [formData, setFormData] = useState<Partial<FixedAsset>>({
        category: 'EQUIPMENT',
        status: 'active',
        useful_life_years: 4,
        salvage_value: 0
    });

    useEffect(() => {
        fetchAssets();
        fetchShelters();
    }, []);

    const fetchShelters = async () => {
        if (!isConfigured()) return;
        const { data } = await supabase.from('shelters').select('id, name');
        if (data) setShelters(data);
    };

    const fetchAssets = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setAssets(MOCK_ASSETS);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.from('fixed_assets').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setAssets(data);
        } catch (err: any) {
            // Fallback if table doesn't exist yet
            if (err.code === '42P01') {
                console.warn("Table fixed_assets not found, using mock");
                setAssets(MOCK_ASSETS);
            } else {
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateDepreciation = (asset: FixedAsset) => {
        const cost = asset.acquisition_cost;
        const salvage = asset.salvage_value || 0;
        const life = asset.useful_life_years || 1;

        // Straight Line Method
        const annualDepreciation = (cost - salvage) / life;

        // Calculate Age in Years
        const acquisition = new Date(asset.acquisition_date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - acquisition.getTime());
        const ageYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

        const accumulated = Math.min(annualDepreciation * ageYears, cost - salvage);
        const bookValue = Math.max(cost - accumulated, salvage);

        return {
            annual: annualDepreciation,
            accumulated: accumulated,
            bookValue: bookValue,
            ageYears: ageYears
        };
    };

    const handleSave = async () => {
        if (!formData.name || !formData.acquisition_cost) {
            alert("Mohon lengkapi Nama dan Harga Perolehan");
            return;
        }

        const payload = {
            ...formData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        };

        if (isConfigured()) {
            const { error } = await supabase.from('fixed_assets').insert(payload);
            if (error) {
                alert("Gagal menyimpan: " + error.message);
                return;
            }
        } else {
            setAssets([payload as FixedAsset, ...assets]);
        }

        setShowModal(false);
        setFormData({ category: 'EQUIPMENT', status: 'active', useful_life_years: 4, salvage_value: 0 });
        if (isConfigured()) fetchAssets();
    };

    const handleExport = () => {
        const data = assets.map(a => {
            const dep = calculateDepreciation(a);
            return {
                'Nama Aset': a.name,
                'Kategori': a.category,
                'Lokasi': a.location,
                'Tgl Perolehan': a.acquisition_date,
                'Harga Perolehan': a.acquisition_cost,
                'Umur (Thn)': a.useful_life_years,
                'Nilai Sisa': a.salvage_value,
                'Penyusutan/Thn': dep.annual,
                'Akumulasi Penyusutan': dep.accumulated,
                'Nilai Buku Saat Ini': dep.bookValue
            };
        });
        exportToExcel(data, 'Data_Aset_Tetap');
    };

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'VEHICLE': return <Car size={18} />;
            case 'BUILDING': return <Building size={18} />;
            case 'ELECTRONIC': return <Laptop size={18} />;
            case 'OTHER': return <Calculator size={18} />;
            default: return <Smartphone size={18} />;
        }
    };

    const filteredAssets = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Aset Tetap</h1>
                    <p className="text-sm text-slate-500 font-medium">Inventarisasi peralatan, kendaraan, dan properti dengan perhitungan penyusutan otomatis.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <FileDown size={16} /> Export
                    </button>
                    <button onClick={() => setShowModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20">
                        <Plus size={16} /> Tambah Aset
                    </button>
                </div>
            </div>

            {/* Total Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total Nilai Perolehan</p>
                    <h3 className="text-2xl font-black">{formatCurrency(assets.reduce((sum, a) => sum + (a.acquisition_cost || 0), 0))}</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Akumulasi Penyusutan</p>
                    <h3 className="text-2xl font-black text-slate-700">{formatCurrency(assets.reduce((sum, a) => sum + calculateDepreciation(a).accumulated, 0))}</h3>
                </div>
                <div className="bg-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-600/20">
                    <p className="text-green-100 text-xs font-bold uppercase tracking-widest mb-1">Total Nilai Buku (Saat Ini)</p>
                    <h3 className="text-2xl font-black">{formatCurrency(assets.reduce((sum, a) => sum + calculateDepreciation(a).bookValue, 0))}</h3>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama aset..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-100 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Nama Aset</th>
                                <th className="px-6 py-4">Info Perolehan</th>
                                <th className="px-6 py-4 text-right">Nilai Buku (Current)</th>
                                <th className="px-6 py-4 text-right">Penyusutan / Thn</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAssets.map((asset) => {
                                const dep = calculateDepreciation(asset);
                                return (
                                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                                    {getIcon(asset.category)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{asset.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <MapPin size={12} /> {asset.location}
                                                    </div>
                                                    {asset.serial_number && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{asset.serial_number}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <span className="font-medium">{new Date(asset.acquisition_date).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign size={12} className="text-slate-400" />
                                                    <span className="font-bold text-slate-700">{formatCurrency(asset.acquisition_cost)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-black text-green-600 text-lg tracking-tight">{formatCurrency(dep.bookValue)}</p>
                                            <p className="text-[10px] text-slate-400">Akumulasi: {formatCurrency(dep.accumulated)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-bold text-slate-600">{formatCurrency(dep.annual)}</p>
                                            <p className="text-[10px] text-slate-400">Masa Manfaat: {asset.useful_life_years} Thn</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${asset.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Asset Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Tambah Aset Baru</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                <Plus size={18} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Aset</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                                    placeholder="Contoh: Mobil Pickup L300"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                    >
                                        <option value="VEHICLE">Kendaraan</option>
                                        <option value="BUILDING">Bangunan</option>
                                        <option value="LAND">Tanah</option>
                                        <option value="ELECTRONIC">Elektronik</option>
                                        <option value="EQUIPMENT">Peralatan Kantor</option>
                                        <option value="OTHER">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tgl Perolehan</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
                                        value={formData.acquisition_date || ''}
                                        onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Harga Perolehan (Rp)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:bg-white transition-all font-black text-slate-700"
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    value={formData.acquisition_cost || ''}
                                    onChange={e => setFormData({ ...formData, acquisition_cost: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div>
                                    <label className="block text-[10px] font-black text-blue-800 uppercase tracking-wider mb-2">Umur Ekonomis (Thn)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 ring-blue-500 font-bold text-slate-700"
                                        onFocus={(e) => e.target.select()}
                                        value={formData.useful_life_years || ''}
                                        onChange={e => setFormData({ ...formData, useful_life_years: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-blue-800 uppercase tracking-wider mb-2">Nilai Sisa / Residu</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 ring-blue-500 font-bold text-slate-700"
                                        onFocus={(e) => e.target.select()}
                                        value={formData.salvage_value || 0}
                                        onChange={e => setFormData({ ...formData, salvage_value: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lokasi Aset</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:bg-white transition-all font-medium text-slate-700 appearance-none"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        >
                                            <option value="">-- Pilih Lokasi --</option>
                                            <option value="Kantor Pusat">Kantor Pusat</option>
                                            <option value="Gudang Bahan">Gudang Bahan</option>
                                            {shelters.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                            <option value="Lainnya">Lainnya...</option>
                                        </select>
                                        <MapPin size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No. Seri / Plat</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
                                        placeholder="Optional"
                                        value={formData.serial_number || ''}
                                        onChange={e => setFormData({ ...formData, serial_number: e.target.value })}
                                    />
                                </div>
                            </div>

                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleSave} className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                                Simpan Aset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
