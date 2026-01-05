
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { getAppConfig } from '../../lib/appConfig';
import { ArrowLeft, FileText, Printer, Scale, Eye, X } from 'lucide-react';

export const PurchaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [trx, setTrx] = useState<any>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const brand = getAppConfig();

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        if (!isConfigured()) {
            // Mock Data Fallback
            setTimeout(() => {
                setTrx({
                    id: '1',
                    transaction_code: 'TRX-DEMO-001',
                    transaction_date: new Date().toISOString(),
                    quantity: 98.5, // Netto
                    gross_weight: 100,
                    price_per_unit: 50000,
                    total_amount: 4925000,
                    tax_amount: 12312,
                    status: 'completed',
                    notes: 'Panen kualitas A',
                    ims_name: 'Budi (Petugas)',
                    farmers: { name: 'Budi Santoso', nik: '3201123456780001', address: 'Blok A, Desa Sukatani', username: '11.2001.01.001' },
                    products: { name: 'Biji Kakao Basah', unit: 'KG' },
                    shelters: { name: 'Shelter Pusat' }, // Mock Relation
                    quality_details: {
                        commodity_type: 'KAKAO_BASAH',
                        sacks_count: 2,
                        sack_weight: 0.5,
                        waste_percent: 2.0,
                        brix_level: 9,
                        deductions_log: ['Pot. Karung: 1 kg', 'Pot. Sampah: 0.5 kg']
                    }
                });
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('purchase_transactions')
                .select(`
                *,
                farmers (*),
                products (*),
                shelters (*) 
            `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setTrx(data);

            // Fetch Photo
            const { data: fileData } = await supabase
                .from('files')
                .select('*')
                .eq('related_id', id)
                .eq('related_table', 'purchase_transactions')
                .limit(1)
                .single();

            if (fileData) {
                const { data: signedData } = await supabase.storage
                    .from(fileData.bucket_path.split('/')[0] || 'images')
                    .createSignedUrl(fileData.file_name, 3600);

                if (signedData) setPhotoUrl(signedData.signedUrl);
            }

        } catch (err: any) {
            alert('Gagal memuat data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Layout><div className="p-8 text-center">Memuat data...</div></Layout>;
    if (!trx) return <Layout><div className="p-8 text-center text-red-500">Transaksi tidak ditemukan.</div></Layout>;

    const quality = trx.quality_details || {};
    const deductions = quality.deductions_log || [];
    const totalPrice = (trx.total_amount || 0);
    const taxPrice = (trx.tax_amount || 0);
    const finalPrice = totalPrice - taxPrice;

    // Receipt Content Component (Reusable for Print & Preview)
    const ReceiptContent = () => (
        <div className="bg-white text-black font-mono text-[12px] p-4 max-w-[320px] mx-auto border border-gray-200 shadow-sm print:shadow-none print:border-none">
            <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
                <h2 className="font-bold text-lg leading-tight uppercase">{brand.orgName}</h2>
                <p className="text-[10px]">{brand.address}</p>
                {brand.phone && <p className="text-[10px]">{brand.phone}</p>}
                <p className="text-[10px] mt-1 font-bold">BUKTI PEMBELIAN</p>
            </div>

            <div className="mb-2 space-y-1">
                <div className="flex justify-between"><span>No:</span><span>{trx.transaction_code}</span></div>
                <div className="flex justify-between"><span>Tgl:</span><span>{new Date(trx.transaction_date).toLocaleDateString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Petani:</span><span className="font-bold">{trx.farmers?.name}</span></div>
                <div className="flex justify-between"><span>ID:</span><span>{trx.farmers?.username || trx.farmers?.nik}</span></div>
            </div>

            <div className="border-t border-b border-black border-dashed py-2 mb-2 space-y-1">
                <p className="font-bold mb-1">{trx.products?.name}</p>

                <div className="flex justify-between pl-2">
                    <span>Berat Bruto:</span>
                    <span>{trx.gross_weight || trx.quantity} Kg</span>
                </div>

                {deductions.map((d: string, i: number) => (
                    <div key={i} className="flex justify-between pl-2 text-[10px] italic">
                        <span>- {d.split(':')[0]}</span>
                        <span>{d.split(':')[1]}</span>
                    </div>
                ))}

                <div className="flex justify-between pl-2 font-bold mt-1 pt-1 border-t border-black border-dotted text-sm">
                    <span>NETTO:</span>
                    <span>{trx.quantity} Kg</span>
                </div>
            </div>

            <div className="mb-4 space-y-1">
                <div className="flex justify-between">
                    <span>Harga/Kg:</span>
                    <span>{new Intl.NumberFormat('id-ID').format(trx.price_per_unit)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{new Intl.NumberFormat('id-ID').format(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span>Pajak (0.25%):</span>
                    <span>-{new Intl.NumberFormat('id-ID').format(taxPrice)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-black border-dashed pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>Rp {new Intl.NumberFormat('id-ID').format(finalPrice)}</span>
                </div>
            </div>

            <div className="mt-6 text-center text-[10px]">
                <p>Diterima Oleh: {trx.ims_name || 'Admin'}</p>
                <div className="h-8"></div>
                <p>( ........................ )</p>
                <p className="mt-2">Terima Kasih</p>
                <p>Simpan struk ini sebagai bukti.</p>
            </div>
        </div>
    );

    return (
        <>
            <Layout>
                <div className="max-w-6xl mx-auto animate-fade-in print:hidden">
                    <button
                        onClick={() => navigate('/purchases')}
                        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Kembali ke Daftar
                    </button>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Transaction Detail */}
                        <div className="flex-1 space-y-6">

                            {/* 1. Header Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider ${trx.status === 'posted' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {trx.status}
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900">{trx.transaction_code}</h1>
                                        <p className="text-sm text-slate-500">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Petani</p>
                                        <p className="font-medium text-slate-800">{trx.farmers?.name}</p>
                                        <p className="text-xs text-slate-500">{trx.farmers?.nik}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Shelter Penerima</p>
                                        <p className="font-medium text-slate-800">{trx.shelters?.name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Quality & Calculation Card */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
                                    <Scale size={18} className="text-orange-600" /> Penilaian Kualitas & Netto
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 mb-3">Parameter Kualitas</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-dashed pb-1">
                                                <span>Komoditas</span>
                                                <span className="font-medium">{quality.commodity_type || trx.products?.name}</span>
                                            </div>
                                            {quality.brix_level > 0 && (
                                                <div className="flex justify-between border-b border-dashed pb-1">
                                                    <span>Brix Level</span>
                                                    <span className="font-medium">{quality.brix_level}</span>
                                                </div>
                                            )}
                                            {quality.moisture_percent > 0 && (
                                                <div className="flex justify-between border-b border-dashed pb-1">
                                                    <span>Kadar Air</span>
                                                    <span className={`font-medium ${quality.moisture_percent > 7 ? 'text-red-600' : 'text-green-600'}`}>{quality.moisture_percent}%</span>
                                                </div>
                                            )}
                                            {quality.waste_percent > 0 && (
                                                <div className="flex justify-between border-b border-dashed pb-1">
                                                    <span>Sampah (Waste)</span>
                                                    <span className={`font-medium ${quality.waste_percent > 3 ? 'text-red-600' : 'text-slate-800'}`}>{quality.waste_percent}%</span>
                                                </div>
                                            )}
                                            {quality.sacks_count > 0 && (
                                                <div className="flex justify-between border-b border-dashed pb-1">
                                                    <span>Jml Karung</span>
                                                    <span className="font-medium">{quality.sacks_count} (@{quality.sack_weight}kg)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-500 mb-3">Perhitungan Berat</h4>
                                        <div className="flex justify-between mb-1">
                                            <span>Berat Bruto</span>
                                            <span className="font-bold">{trx.gross_weight || trx.quantity} Kg</span>
                                        </div>

                                        {deductions.map((d: string, i: number) => (
                                            <div key={i} className="flex justify-between text-xs text-red-500">
                                                <span>{d.split(':')[0]}</span>
                                                <span>{d.split(':')[1]}</span>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center border-t border-slate-200 mt-2 pt-2">
                                            <span className="font-bold text-blue-800">NETTO</span>
                                            <span className="font-bold text-xl text-blue-600">{trx.quantity} Kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Financial Summary */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-600">Harga Satuan</span>
                                    <span className="font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(trx.price_per_unit)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-600">Total (Sebelum Pajak)</span>
                                    <span className="font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(trx.total_amount)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2 text-red-500">
                                    <span>Pajak (0.25%)</span>
                                    <span className="font-mono">-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(trx.tax_amount || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                                    <span className="font-bold text-lg text-slate-800">Total Dibayarkan</span>
                                    <span className="font-bold text-2xl text-green-600 font-mono">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(finalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Evidence & Map */}
                        <div className="lg:w-80 space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
                                <p className="font-bold text-sm text-slate-700 mb-2">Bukti Foto</p>
                                {photoUrl ? <img src={photoUrl} className="w-full h-40 object-cover rounded" /> : <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No Photo</div>}
                            </div>

                            {/* Action Buttons */}
                            <button onClick={() => setShowPreview(true)} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors border border-slate-300">
                                <Eye size={18} /> Lihat Preview Struk
                            </button>
                            <button onClick={handlePrint} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors">
                                <Printer size={18} /> Cetak Struk
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal Preview */}
                {showPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-3 bg-slate-100 border-b flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Preview Cetak</h3>
                                <button onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-red-500"><X size={20} /></button>
                            </div>
                            <div className="overflow-y-auto p-4 bg-slate-200">
                                <ReceiptContent />
                            </div>
                            <div className="p-3 border-t bg-white">
                                <button onClick={handlePrint} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                                    <Printer size={16} /> Print Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Layout>

            {/* HIDDEN PRINT LAYOUT (Only visible to printer) */}
            <div id="receipt-print-area" className="hidden print:block">
                <style>{`
            @media print {
                body * { visibility: hidden; }
                #receipt-print-area, #receipt-print-area * { visibility: visible; }
                #receipt-print-area { position: absolute; left: 0; top: 0; width: 80mm; }
                @page { margin: 0; size: auto; }
            }
        `}</style>
                <ReceiptContent />
            </div>
        </>
    );
};
