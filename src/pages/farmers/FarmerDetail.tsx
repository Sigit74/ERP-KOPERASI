
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import {
    ArrowLeft, MapPin, Phone, Calendar, Ruler, Sprout, Edit,
    FileText, TrendingUp, DollarSign, Package, User, Users,
    Droplets, Bug, Trees, Mountain, ClipboardList, Image as ImageIcon,
    Code, Braces, CreditCard, Leaf
} from 'lucide-react';
import { MapViewer } from '../../components/ui/MapViewer';

export const FarmerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [farmer, setFarmer] = useState<any>(null);
    const [farms, setFarms] = useState<any[]>([]);
    const [showRawPoly, setShowRawPoly] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);

        if (!isConfigured()) {
            // Mock Data for Demo
            setTimeout(() => {
                setFarmer({
                    id: '1',
                    // Identitas
                    name: 'Budi Santoso (Demo)',
                    username: '11.2001.01.001',
                    nik: '3201123456780001',
                    gender: 'L',
                    birth_date: '1980-05-15',
                    mother_name: 'Siti Aminah',
                    phone: '08123456789',
                    address: 'Dusun III, RT 02 RW 01',
                    village: 'Baebunta',
                    district: 'Baebunta',
                    status: 'active',
                    farmer_groups: { name: 'KT Harapan Jaya', code: '11.2001.01' },

                    // Lahan
                    farm_count: 2,
                    total_farm_area_ha: 1.5,
                    productive_area_ha: 1.2,
                    natural_ecosystem_area_ha: 0.2,
                    conservation_area_ha: 0.1,
                    farm_recommendation: 'Perlu peremajaan tanaman pelindung.',
                    coordinates: '-2.5555, 120.1111',

                    // Agronomi
                    primary_crop: 'Kopi Arabika',
                    secondary_crop: 'Pisang',
                    crop_age: 5,
                    productive_trees_count: 1200,
                    unproductive_trees_count: 50,
                    clones: 'Sigarar Utang',
                    cocoa_pests: 'Penggerek Buah',
                    cocoa_diseases: 'Busuk Buah',
                    fertilizers_used: 'NPK, Kompos',
                    fungicides_used: 'Nordox',
                    insecticides_used: '-',
                    herbicides_used: 'Roundup',
                    shade_trees_type: 'Lamtoro',
                    shade_trees_count: 50,

                    // Produksi & Sosial
                    worker_names: 'Asep, Udin',
                    male_workers_count: 2,
                    female_workers_count: 1,
                    last_year_production_kg: 1500,
                    current_year_production_kg: 1800,
                    sales_commitment_kg: 1500,
                    quota_kg: 2000,
                    surveyor_name: 'Admin Lapangan',

                    join_date: '2023-01-15'
                });
                // Mock Farms with Polygon
                setFarms([
                    {
                        id: 'f1', name: 'Kebun Atas', center_point: '-2.55, 120.10', size_hectares: 1.0,
                        polygon_json: {
                            type: "Polygon",
                            coordinates: [[
                                [120.10, -2.55], [120.11, -2.55], [120.11, -2.56], [120.10, -2.56], [120.10, -2.55]
                            ]]
                        }
                    }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const { data: fData, error: fError } = await supabase
                .from('farmers')
                .select('*, farmer_groups(name, code)')
                .eq('id', id)
                .single();

            if (fError) throw fError;
            setFarmer(fData);

            const { data: farmData } = await supabase.from('farms').select('*').eq('farmer_id', id);
            if (farmData) setFarms(farmData);

        } catch (err: any) {
            alert("Gagal memuat data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="p-10 text-center">Memuat profil lengkap...</div></Layout>;
    if (!farmer) return <Layout><div className="p-10 text-center">Data tidak ditemukan.</div></Layout>;

    // Prepare Map Data
    let mapCenter: [number, number] = [-2.55, 120.1];
    if (farmer.coordinates) {
        const parts = farmer.coordinates.split(',').map((s: string) => parseFloat(s.trim()));
        if (parts.length === 2) mapCenter = [parts[0], parts[1]];
    }

    const mapPolygons = farms.map(f => ({
        coordinates: f.polygon_json,
        title: f.name,
        label: `${farmer.name}\n${f.name} (${f.size_hectares} Ha)`,
        color: 'orange'
    })).filter(f => f.coordinates);

    // Helper for Data Row
    const DataRow = ({ label, value, sub }: { label: string, value: any, sub?: string }) => (
        <div className="py-3 border-b border-slate-50 last:border-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <span className="text-sm text-slate-500">{label}</span>
            <div className="text-right">
                <span className="text-sm font-medium text-slate-800 block">{value || '-'}</span>
                {sub && <span className="text-xs text-slate-400 block">{sub}</span>}
            </div>
        </div>
    );

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Icon size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/farmers')} className="flex items-center text-slate-500 hover:text-slate-800 gap-2 transition-colors">
                        <ArrowLeft size={18} /> Kembali ke Daftar
                    </button>
                    <div className="flex gap-2">
                        <Link to={`/purchases/new`} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2">
                            <DollarSign size={16} /> Input Transaksi
                        </Link>
                        <Link to={`/farmers/edit/${id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                            <Edit size={16} /> Edit Data
                        </Link>
                    </div>
                </div>

                {/* HEADER CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                            {farmer.photo_url ? (
                                <img src={farmer.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{farmer.name}</h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-mono">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{farmer.username || 'No ID'}</span>
                                <span>•</span>
                                <span>{farmer.farmer_groups?.name || 'Tanpa Kelompok'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize flex items-center gap-2 ${farmer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${farmer.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                            {farmer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </div>
                        {farmer.membership_status && (
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {farmer.membership_status}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: 2/3 Width */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* MAP SECTION */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <MapPin size={18} className="text-red-500" /> Peta Lokasi Lahan
                                </h3>
                                <button
                                    onClick={() => setShowRawPoly(!showRawPoly)}
                                    className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                    <Code size={12} /> {showRawPoly ? 'Sembunyikan Raw Data' : 'Lihat GeoJSON'}
                                </button>
                            </div>
                            <div className="h-80 relative">
                                <MapViewer center={mapCenter} polygons={mapPolygons} />
                            </div>
                            {showRawPoly && (
                                <div className="p-4 bg-slate-900 text-slate-300 font-mono text-xs overflow-auto max-h-40 border-t border-slate-700">
                                    {farms.length > 0 ? (
                                        farms.map((f, i) => (
                                            <div key={i} className="mb-2">
                                                <span className="text-orange-400"># {f.name}:</span> {JSON.stringify(f.polygon_json)}
                                            </div>
                                        ))
                                    ) : <span className="text-slate-500">Belum ada data polygon.</span>}
                                </div>
                            )}
                        </div>

                        {/* AGRONOMY & PRODUCTION GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* 1. DATA AGRONOMI */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <SectionHeader icon={Sprout} title="Agronomi & Tanaman" />
                                <div className="space-y-1">
                                    <DataRow label="Tanaman Utama" value={farmer.primary_crop} />
                                    <DataRow label="Tanaman Sekunder" value={farmer.secondary_crop} />
                                    <DataRow label="Umur Tanaman" value={farmer.crop_age ? `${farmer.crop_age} Tahun` : '-'} />
                                    <DataRow label="Pohon Produktif" value={farmer.productive_trees_count} sub="Pohon" />
                                    <DataRow label="Pohon Tdk Produktif" value={farmer.unproductive_trees_count} sub="Pohon" />
                                    <DataRow label="Varietas / Klon" value={farmer.clones} />
                                    <div className="mt-4 pt-2 border-t border-dashed">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Input & Perawatan</h4>
                                        <DataRow label="Pupuk" value={farmer.fertilizers_used} />
                                        <DataRow label="Hama (Pests)" value={farmer.cocoa_pests} />
                                        <DataRow label="Penyakit" value={farmer.cocoa_diseases} />
                                        <DataRow label="Fungisida" value={farmer.fungicides_used} />
                                        <DataRow label="Herbisida" value={farmer.herbicides_used} />
                                    </div>
                                </div>
                            </div>

                            {/* 2. DATA PRODUKSI & SOSIAL */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <SectionHeader icon={TrendingUp} title="Produksi & Sosial" />
                                <div className="space-y-1">
                                    <DataRow label="Komitmen Penjualan" value={farmer.sales_commitment_kg ? `${new Intl.NumberFormat('id-ID').format(farmer.sales_commitment_kg)} Kg` : '-'} />
                                    <DataRow label="Kuota Ditetapkan" value={farmer.quota_kg ? `${new Intl.NumberFormat('id-ID').format(farmer.quota_kg)} Kg` : '-'} />
                                    <DataRow label="Produksi Tahun Lalu" value={farmer.last_year_production_kg ? `${new Intl.NumberFormat('id-ID').format(farmer.last_year_production_kg)} Kg` : '-'} />
                                    <DataRow label="Est. Produksi Tahun Ini" value={farmer.current_year_production_kg ? `${new Intl.NumberFormat('id-ID').format(farmer.current_year_production_kg)} Kg` : '-'} />

                                    <div className="mt-4 pt-2 border-t border-dashed">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Tenaga Kerja</h4>
                                        <DataRow label="Jml Pekerja Laki-laki" value={farmer.male_workers_count} />
                                        <DataRow label="Jml Pekerja Perempuan" value={farmer.female_workers_count} />
                                        <DataRow label="Nama Pekerja" value={farmer.worker_names} />
                                    </div>

                                    <div className="mt-4 pt-2 border-t border-dashed">
                                        <DataRow label="Surveyor" value={farmer.surveyor_name} />
                                        <DataRow label="Tanggal Gabung" value={farmer.join_date} />
                                    </div>
                                </div>
                            </div>

                            {/* 3. DETAIL LAHAN */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:col-span-2">
                                <SectionHeader icon={Ruler} title="Detail Lahan & Geospasial" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <DataRow label="Jumlah Kebun" value={farmer.farm_count} sub="Lokasi" />
                                        <DataRow label="Total Luas Lahan" value={farmer.total_farm_area_ha} sub="Hektar" />
                                        <DataRow label="Luas Area Produktif" value={farmer.productive_area_ha} sub="Hektar" />
                                    </div>
                                    <div className="space-y-1">
                                        <DataRow label="Area Konservasi" value={farmer.conservation_area_ha} sub="Hektar" />
                                        <DataRow label="Area Ekosistem Alami" value={farmer.natural_ecosystem_area_ha} sub="Hektar" />
                                        <DataRow label="Pohon Pelindung" value={farmer.shade_trees_type} sub={`${farmer.shade_trees_count || 0} Pohon`} />
                                    </div>
                                </div>
                                {farmer.farm_recommendation && (
                                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <span className="text-xs font-bold text-blue-700 block mb-1">REKOMENDASI KEBUN:</span>
                                        <p className="text-sm text-blue-900">{farmer.farm_recommendation}</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* RIGHT COLUMN: 1/3 Width (Identity & Files) */}
                    <div className="space-y-6">

                        {/* IDENTITAS DIRI */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <SectionHeader icon={CreditCard} title="Identitas Diri" />
                            <div className="space-y-1">
                                <DataRow label="NIK / KTP" value={farmer.nik} />
                                <DataRow label="Jenis Kelamin" value={farmer.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                <DataRow label="Tanggal Lahir" value={farmer.birth_date} />
                                <DataRow label="Nama Ibu Kandung" value={farmer.mother_name} />
                                <DataRow label="No. Telepon" value={farmer.phone} />
                                <div className="mt-4 pt-2 border-t border-dashed">
                                    <span className="text-xs text-slate-400 block mb-1">Alamat Lengkap</span>
                                    <p className="text-sm font-medium text-slate-800">{farmer.address}</p>
                                </div>
                                <div className="mt-2">
                                    <span className="text-xs text-slate-400 block mb-1">Wilayah</span>
                                    <p className="text-sm font-medium text-slate-800">{farmer.village}, Kec. {farmer.district}</p>
                                </div>
                            </div>
                        </div>

                        {/* BERKAS & FOTO */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <SectionHeader icon={ImageIcon} title="Berkas & Foto" />
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-2">Foto Lahan</p>
                                    {farmer.farm_photo_url ? (
                                        <img src={farmer.farm_photo_url} alt="Kebun" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                                    ) : (
                                        <div className="w-full h-20 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300">Tidak ada foto</div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-2">Tanda Tangan</p>
                                    {farmer.signature_photo_url ? (
                                        <img src={farmer.signature_photo_url} alt="Signature" className="w-full h-20 object-contain bg-slate-50 rounded-lg border border-slate-200" />
                                    ) : (
                                        <div className="w-full h-16 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300">Tidak ada ttd</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};
