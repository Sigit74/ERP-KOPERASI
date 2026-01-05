
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import {
    ArrowLeft, Box, Users, MapPin, Factory, ShieldCheck,
    Calendar, Info, ExternalLink, QrCode, Printer, X, Share2, Award, Download
} from 'lucide-react';
import { MapViewer } from '../../components/ui/MapViewer';

export const LotDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [lot, setLot] = useState<any>(null);
    const [batches, setBatches] = useState<any[]>([]);
    const [farmers, setFarmers] = useState<any[]>([]);

    // UI States
    const [showQrModal, setShowQrModal] = useState(false);

    useEffect(() => {
        fetchLotTraceability();
    }, [id]);

    const fetchLotTraceability = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setLot({
                    id: 'lot-001',
                    lot_code: 'LOT-2025-001',
                    created_at: '2025-12-10',
                    product_name: 'Biji Kakao Fermentasi',
                    total_weight: 1000,
                    available_weight: 1000,
                    qc_summary: { moisture: '6.5%', bean_count: '95/100g', grade: 'Premium Grade A' }
                });
                setBatches([
                    { id: 'b1', batch_code: 'Batch.SH001.KB.XII.2025.001', output_weight: 485.5, end_date: '2025-12-08' },
                    { id: 'b2', batch_code: 'Batch.SH002.KB.I.2025.012', output_weight: 514.5, end_date: '2025-12-09' }
                ]);
                setFarmers([
                    {
                        id: 'f1', name: 'Budi Santoso', group: 'KT Harapan Jaya', village: 'Baebunta',
                        location: [-2.55, 120.11],
                        polygon: { type: "Polygon", coordinates: [[[120.11, -2.55], [120.115, -2.55], [120.115, -2.555], [120.11, -2.555], [120.11, -2.55]]] }
                    },
                    {
                        id: 'f2', name: 'Siti Aminah', group: 'KT Harapan Jaya', village: 'Baebunta',
                        location: [-2.56, 120.12],
                        polygon: { type: "Polygon", coordinates: [[[120.12, -2.56], [120.125, -2.56], [120.125, -2.565], [120.12, -2.565], [120.12, -2.56]]] }
                    }
                ]);
                setLoading(false);
            }, 800);
            return;
        }

        try {
            const { data: lotData } = await supabase.from('product_lots').select('*, products(name)').eq('id', id).single();
            setLot(lotData);

            // 1. Fetch Batches for this Lot
            const { data: lbData } = await supabase.from('lot_batches').select('*, batches(*)').eq('lot_id', id);
            const batchList = lbData ? lbData.map(item => item.batches) : [];
            setBatches(batchList);

            if (batchList.length > 0) {
                // 2. Fetch Source Transactions for these Batches
                const batchIds = batchList.map(b => b.id);
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
                                coordinates: f.coordinates
                            })));
                        }
                    }
                }
            }
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const publicUrl = `${window.location.origin}/#/trace/${lot?.lot_code}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}&bgcolor=ffffff`;

    const handlePrint = () => {
        // PROFESSIONAL PRINTING TECHNIQUE: Open dedicated window
        const printWindow = window.open('', '_blank', 'width=1000,height=1200');
        if (!printWindow) {
            alert('Popup terblokir! Mohon izinkan popup untuk mencetak sertifikat.');
            return;
        }

        const farmerRows = farmers.map(f => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">${f.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: monospace;">${f.group}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${f.village}, Luwu Utara</td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Certificate - ${lot.lot_code}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');
                        body { margin: 0; padding: 0; background: #f1f5f9; }
                        .cert-page { 
                            width: 210mm; 
                            min-height: 297mm; 
                            padding: 20mm; 
                            margin: 10mm auto; 
                            background: white; 
                            box-shadow: 0 0 20px rgba(0,0,0,0.1);
                            position: relative;
                            border: 15px double #1e293b;
                        }
                        .font-serif { font-family: 'Libre Baskerville', serif; }
                        @media print {
                            body { background: white; margin: 0; }
                            .cert-page { margin: 0; box-shadow: none; border: 12px double #000; }
                        }
                    </style>
                </head>
                <body>
                    <div class="cert-page">
                        <!-- Kop -->
                        <div class="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-10">
                            <div class="flex items-center gap-4">
                                <div style="background:#2563eb; color:white; width:60px; height:60px; display:flex; align-items:center; justify-content:center; border-radius:12px; font-weight:900; font-size:32px;">S</div>
                                <div>
                                    <h1 class="text-2xl font-black uppercase tracking-tighter">Koperasi Simultan</h1>
                                    <p class="text-[10px] uppercase font-bold text-blue-600 tracking-[0.3em]">Quality & Digital Traceability Center</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certificate ID</p>
                                <p class="font-mono font-bold text-lg">${lot.lot_code}</p>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="text-center mb-12">
                            <h2 class="text-5xl font-serif font-bold text-slate-800 mb-4">Certificate of Origin</h2>
                            <div class="w-32 h-1 bg-blue-600 mx-auto"></div>
                        </div>

                        <div class="grid grid-cols-2 gap-10 mb-12">
                            <div class="space-y-6">
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Description</p>
                                    <p class="text-xl font-bold">${lot.product_name}</p>
                                    <p class="text-xs text-slate-500">Certified Organic & Sustainable</p>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Technical QC Grade</p>
                                    <p class="text-xl font-bold text-green-600">${lot.qc_summary?.grade || 'Verified'}</p>
                                    <p class="text-[10px] text-slate-500">Moisture: ${lot.qc_summary?.moisture || '-'} • Count: ${lot.qc_summary?.bean_count || '-'}</p>
                                </div>
                            </div>
                            <div class="text-right space-y-6">
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Certified Net Weight</p>
                                    <p class="text-5xl font-black">${lot.total_weight} <span class="text-xl font-normal">KG</span></p>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                                    <p class="text-lg font-bold">${new Date(lot.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-12">
                            <h3 class="text-xs font-black uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2">Verification of Smallholder Contributors</h3>
                            <table style="width: 100%; text-align: left; font-size: 12px;">
                                <thead style="background: #f8fafc;">
                                    <tr>
                                        <th style="padding: 10px;">Farmer Name</th>
                                        <th style="padding: 10px;">Group ID</th>
                                        <th style="padding: 10px; text-align: right;">Region</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${farmerRows}
                                </tbody>
                            </table>
                        </div>

                        <!-- Footer -->
                        <div class="mt-auto pt-10 border-t border-slate-100 flex justify-between items-end">
                            <div class="flex items-center gap-4">
                                <img src="${qrCodeUrl}" style="width: 100px; height: 100px; border: 1px solid #ddd; padding: 2px;" />
                                <div>
                                    <p class="text-[9px] font-bold uppercase tracking-widest mb-1">Digital Audit</p>
                                    <p class="text-[8px] text-slate-400 leading-tight">Scan this QR code to verify<br/>the full supply chain data.</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black uppercase underline underline-offset-4 mb-4">Digitally Signed By ERP System</p>
                                <p class="text-[9px] text-slate-500 italic">Issued by Quality Assurance Unit<br/>Koperasi Simultan</p>
                            </div>
                        </div>
                        
                        <div class="absolute bottom-6 left-0 right-0 text-center">
                            <p class="text-[7px] text-slate-300 uppercase tracking-[0.4em]">Official Simultan Digital Document • Verified System Generated</p>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { 
                            setTimeout(function() { 
                                window.print(); 
                                // window.close(); // Uncomment if you want to auto-close after print
                            }, 1000); 
                        }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (loading) return <Layout><div className="p-20 text-center animate-pulse">Menarik data dari rantai pasok...</div></Layout>;

    const mapPolygons = farmers.map(f => ({
        coordinates: f.polygon,
        title: `<div class='text-center'><b>${f.name}</b><br/>${f.group}</div>`,
        label: `${f.name}`,
        color: '#2563eb'
    })).filter(p => p.coordinates);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20">
                {/* TOOLBAR */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/production/lots')} className="flex items-center text-slate-500 hover:text-slate-800 gap-2"><ArrowLeft size={16} /> Kembali</button>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <Printer size={16} /> Cetak Sertifikat
                        </button>
                        <button
                            onClick={() => setShowQrModal(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                        >
                            <QrCode size={16} /> QR Publik
                        </button>
                    </div>
                </div>

                {/* DASHBOARD VIEW */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-8 flex flex-col md:flex-row justify-between gap-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <Box className="text-blue-400" size={24} />
                                <h1 className="text-3xl font-black tracking-tight">{lot.lot_code}</h1>
                            </div>
                            <p className="text-slate-400 flex items-center gap-2 text-sm">
                                <Calendar size={14} /> Terdaftar: {new Date(lot.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex gap-10 relative z-10">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Status QC</p>
                                <p className="text-xl font-bold text-green-400">{lot.qc_summary?.grade || 'GRADE A'}</p>
                            </div>
                            <div className="text-right border-l border-white/10 pl-10">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Berat</p>
                                <p className="text-xl font-bold">{lot.total_weight} <span className="text-sm font-normal opacity-60">Kg</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-blue-600" /> Peta Sebaran Lahan</h3>
                            </div>
                            <div className="h-96 relative">
                                <MapViewer center={[-2.55, 120.1]} polygons={mapPolygons} fitBounds={true} />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Factory size={18} className="text-orange-500" /> Riwayat Batch Produksi</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {batches.map((b, idx) => (
                                    <div key={idx} className="p-5 hover:bg-slate-50 flex items-center justify-between transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">{idx + 1}</div>
                                            <div>
                                                <p className="font-mono font-bold text-slate-800 text-sm">{b.batch_code}</p>
                                                <p className="text-xs text-slate-400">Selesai: {new Date(b.end_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-slate-700">{b.output_weight} Kg</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                            <div className="p-5 bg-blue-600 text-white">
                                <h3 className="font-bold text-lg">Petani Penyedia</h3>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {farmers.map((f, idx) => (
                                    <div key={idx} className="p-5 border-b last:border-0 hover:bg-slate-50 transition-colors">
                                        <span className="font-bold text-slate-800 text-sm">{f.name}</span>
                                        <p className="text-xs text-slate-500">{f.group}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL QR */}
                {showQrModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
                            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><QrCode size={18} /> QR Traceability</h3>
                                <button onClick={() => setShowQrModal(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={20} /></button>
                            </div>
                            <div className="p-8 text-center bg-slate-50">
                                <div className="bg-white p-6 rounded-3xl shadow-inner border border-slate-200 inline-block mb-6 relative group">
                                    <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52 mx-auto mix-blend-multiply" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = qrCodeUrl;
                                            link.download = `QR-${lot.lot_code}.png`;
                                            link.click();
                                        }}
                                        className="flex-1 bg-white border border-slate-300 py-3 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100"
                                    >
                                        <Download size={14} /> Download
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(publicUrl);
                                            alert("Link publik berhasil disalin.");
                                        }}
                                        className="flex-1 bg-blue-600 py-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-blue-700"
                                    >
                                        <Share2 size={14} /> Salin Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
