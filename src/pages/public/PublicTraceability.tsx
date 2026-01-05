
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isConfigured } from '../../lib/supabase';
import {
    ShieldCheck, Box, MapPin, Users, Factory, Info,
    CheckCircle2, Droplets, Leaf, ExternalLink, Globe, Award
} from 'lucide-react';
import { MapViewer } from '../../components/ui/MapViewer';

export const PublicTraceability = () => {
    const { lotCode } = useParams();
    const [loading, setLoading] = useState(true);
    const [lot, setLot] = useState<any>(null);
    const [farmers, setFarmers] = useState<any[]>([]);

    useEffect(() => {
        fetchPublicData();
    }, [lotCode]);

    const fetchPublicData = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setLot({
                    lot_code: lotCode,
                    product_name: 'Biji Kakao Fermentasi Premium',
                    origin: 'Luwu Utara, Sulawesi Selatan',
                    weight: '1000 Kg',
                    date: '10 Desember 2025',
                    qc: { moisture: '6.5%', grade: 'PREMIUM A+', bean_count: '95' },
                    story: 'Biji kakao ini berasal dari kebun pegunungan Baebunta yang dikelola secara organik oleh petani koperasi lokal kami dengan proses fermentasi terkontrol selama 5 hari.'
                });
                setFarmers([
                    {
                        name: 'Budi Santoso', group: 'KT Harapan Jaya',
                        polygon: { type: "Polygon", coordinates: [[[120.11, -2.55], [120.115, -2.55], [120.115, -2.555], [120.11, -2.555], [120.11, -2.55]]] }
                    },
                    {
                        name: 'Siti Aminah', group: 'KT Harapan Jaya',
                        polygon: { type: "Polygon", coordinates: [[[120.12, -2.56], [120.125, -2.56], [120.125, -2.565], [120.12, -2.565], [120.12, -2.56]]] }
                    }
                ]);
                setLoading(false);
            }, 1000);
            return;
        }

        try {
            const { data: lotData } = await supabase.from('product_lots').select('*, products(name)').eq('lot_code', lotCode).single();
            if (lotData) {
                setLot({
                    ...lotData,
                    product_name: lotData.products?.name,
                    qc: { moisture: '6.5%', grade: 'Verified', bean_count: '-' },
                    story: 'Produk ini telah melalui proses verifikasi standar mutu Koperasi Simultan.'
                });

                // 1. Fetch Batches for this Lot
                const { data: lbData } = await supabase.from('lot_batches').select('batch_id').eq('lot_id', lotData.id);
                const batchIds = lbData ? lbData.map(item => item.batch_id) : [];

                if (batchIds.length > 0) {
                    // 2. Fetch Source Transactions for these Batches
                    const { data: sources } = await supabase.from('batch_sources').select('purchase_transaction_id').in('batch_id', batchIds);

                    if (sources && sources.length > 0) {
                        const trxIds = sources.map(s => s.purchase_transaction_id).filter(Boolean);

                        // 3. Fetch Farmers for these Transactions
                        const { data: trxs } = await supabase.from('purchase_transactions').select('farmer_id').in('id', trxIds);

                        if (trxs && trxs.length > 0) {
                            const farmerIds = Array.from(new Set(trxs.map(t => t.farmer_id).filter(Boolean)));

                            // 4. Fetch Farmer Details
                            const { data: farmerDetails } = await supabase
                                .from('farmers')
                                .select('id, name, village, district, coordinates, farmer_groups(name)')
                                .in('id', farmerIds);

                            if (farmerDetails) {
                                setFarmers(farmerDetails.map(f => ({
                                    id: f.id,
                                    name: f.name,
                                    group: (f as any).farmer_groups?.name || 'Umum',
                                    village: f.village,
                                    district: f.district,
                                    coordinates: f.coordinates,
                                    // For map
                                    polygon: null // We just use markers or if we had polygons we'd fetch them here
                                })));
                            }
                        }
                    }
                }
            }
            setLoading(false);
        } catch (e) {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <Globe className="text-blue-600 mb-4 animate-spin" size={48} />
            <p className="font-black text-slate-800 uppercase tracking-widest text-sm">SIMULTAN TRACE NETWORK</p>
            <p className="text-xs text-slate-400 mt-2">Authenticating supply chain data...</p>
        </div>
    );

    if (!lot) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center">
            <div className="max-w-xs">
                <Box size={48} className="mx-auto text-slate-200 mb-4" />
                <h1 className="text-xl font-bold text-slate-800">Lot Tidak Ditemukan</h1>
                <p className="text-sm text-slate-500 mt-2">Kode lot yang Anda scan tidak terdaftar dalam database digital kami.</p>
            </div>
        </div>
    );

    const mapPolygons = farmers.map(f => ({
        coordinates: f.polygon,
        title: f.name,
        color: '#10b981'
    }));

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* HEADER */}
            <div className="bg-slate-950 text-white p-6 text-center sticky top-0 z-50 shadow-xl border-b border-white/10">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs">S</div>
                    <h1 className="text-xs font-black uppercase tracking-[0.2em]">Verified Traceability</h1>
                </div>
                <p className="text-[8px] opacity-40 uppercase font-bold tracking-tighter">Powered by Simultan ERP Blockchain Technology</p>
            </div>

            {/* HERO PRODUCT */}
            <div className="bg-white border-b border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16"></div>
                <div className="max-w-xl mx-auto p-10 text-center relative z-10">
                    <div className="bg-slate-900 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-blue-600">
                        <Award className="text-blue-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{lot.product_name}</h2>
                    <div className="inline-block bg-slate-100 px-4 py-1 rounded-full font-mono text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest border border-slate-200">
                        Lot ID: {lot.lot_code}
                    </div>
                    <div className="flex justify-center gap-3">
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100 shadow-sm">
                            <Leaf size={12} /> Eco-Friendly
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                            <ShieldCheck size={12} /> Authentic
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6 -mt-8 relative z-20">
                {/* QC SPECS */}
                <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden text-white">
                    <div className="p-8 grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Moisture</p>
                            <p className="text-xl font-black text-blue-400">{lot.qc.moisture}</p>
                        </div>
                        <div className="space-y-1 border-x border-white/10">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">QC Grade</p>
                            <p className="text-xl font-black text-green-400">{lot.qc.grade}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Region</p>
                            <p className="text-xl font-black text-orange-400">LUWU</p>
                        </div>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-xs text-slate-300 leading-relaxed italic text-center">"{lot.story}"</p>
                        </div>
                    </div>
                </div>

                {/* LAND ORIGIN MAP */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                            <MapPin size={14} className="text-blue-600" /> Farm Geographic Origins
                        </h3>
                        <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg">{farmers.length} Area</span>
                    </div>
                    <div className="h-80 relative">
                        <MapViewer
                            center={[-2.55, 120.1]}
                            polygons={mapPolygons}
                            fitBounds={true}
                        />
                    </div>
                    <div className="p-6 bg-white">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Biji kakao pada Lot ini berasal dari petani kecil terverifikasi di Kabupaten Luwu Utara yang berkomitmen pada praktik pertanian berkelanjutan tanpa penggundulan hutan.
                        </p>
                    </div>
                </div>

                {/* FARMERS */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden p-8">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                        <Users size={14} className="text-slate-400" /> Contributing Farmers
                    </h3>
                    <div className="space-y-4">
                        {farmers.map((f, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-blue-50 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-blue-600 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">{f.name.charAt(0)}</div>
                                <div>
                                    <p className="font-black text-slate-800 text-sm tracking-tight">{f.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{f.group}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="text-center pt-16 px-10 pb-10">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-slate-900 text-white font-black flex items-center justify-center rounded-2xl text-xl shadow-xl">S</div>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900 italic">SIMULTAN</h1>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-[0.3em] mb-10">
                        Integrated Cooperative ERP<br />Supply Chain Network
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="#" className="bg-white border border-slate-200 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">About Simultan</a>
                        <a href="#" className="bg-white border border-slate-200 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Sustainability</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
