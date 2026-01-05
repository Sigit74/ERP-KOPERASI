
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { 
    ArrowLeft, Printer, Truck, Calendar, User, FileText, 
    DollarSign, Package, CheckCircle, Info, Building, MapPin, 
    CreditCard, Download, Share2, ExternalLink, Box, Tag
} from 'lucide-react';

export const CommoditySaleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sale, setSale] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetchSaleDetail();
    }, [id]);

    const fetchSaleDetail = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setSale({
                    id: '1',
                    transaction_code: 'B2B-170125001',
                    transaction_date: '2024-05-22T09:00:00Z',
                    customer_name: 'PT. Exportir Kopi Nusantara',
                    customer_address: 'Kawasan Industri Makassar (KIMA) Kav. 15, Sulawesi Selatan',
                    reference_number: 'PO/2024/EXP/881',
                    total_amount: 172050000,
                    tax_amount: 17050000,
                    shipping_cost: 0,
                    payment_method: 'TRANSFER',
                    status: 'completed',
                    vehicle_number: 'DD 8122 XY',
                    driver_name: 'Pak Syamsul',
                    shelters: { name: 'Shelter Pusat' },
                    notes: 'Kualitas Grade A export ready.'
                });
                setItems([
                    { id: 'item1', product_name: 'Greenbean Arabika specialty', lot_code: 'LOT-2024-A01', quantity: 1500, price_per_unit: 90000, subtotal: 135000000, unit: 'KG' },
                    { id: 'item2', product_name: 'Greenbean Robusta Premium', lot_code: 'LOT-2024-R12', quantity: 500, price_per_unit: 40000, subtotal: 20000000, unit: 'KG' }
                ]);
                setLoading(false);
            }, 600);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('sales_transactions')
                .select('*, shelters(name)')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            setSale(data);

            const { data: itemData } = await supabase
                .from('sales_items')
                .select('*, products(name, unit), product_lots(lot_code)')
                .eq('sale_id', id);
            
            if (itemData) {
                setItems(itemData.map(i => ({
                    ...i,
                    product_name: i.products?.name,
                    unit: i.products?.unit,
                    lot_code: i.product_lots?.lot_code
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintInvoice = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=1200');
        if (!printWindow) return alert('Popup terblokir!');

        const subtotal = items.reduce((a, b) => a + b.subtotal, 0);
        const itemRows = items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <b>${item.product_name}</b><br/><small style="color:#888">Lot: ${item.lot_code || '-'}</small>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${new Intl.NumberFormat('id-ID').format(item.quantity)} ${item.unit}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(item.price_per_unit)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">Rp ${new Intl.NumberFormat('id-ID').format(item.subtotal)}</td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Invoice - ${sale.transaction_code}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>@media print { body { background: white; margin: 0; padding: 0; } }</style>
                </head>
                <body class="bg-slate-50 p-10">
                    <div class="bg-white p-12 max-w-4xl mx-auto shadow-2xl border border-slate-100 rounded-xl">
                        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
                            <div>
                                <h1 class="text-3xl font-black uppercase text-slate-900 tracking-tighter">Koperasi Simultan</h1>
                                <p class="text-xs text-slate-500">Jl. Raya Koperasi No. 1, Luwu Utara, Sul-Sel<br/>admin@simultan.id | +62 471 123456</p>
                            </div>
                            <div class="text-right">
                                <h2 class="text-5xl font-black text-slate-200 mb-4 tracking-tighter">INVOICE</h2>
                                <p class="font-mono font-bold text-slate-900">${sale.transaction_code}</p>
                                <p class="text-sm text-slate-500">${new Date(sale.transaction_date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-10 mb-10">
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ditagihkan Kepada:</p>
                                <p class="text-lg font-bold text-slate-900">${sale.customer_name}</p>
                                <p class="text-xs text-slate-500 whitespace-pre-wrap">${sale.customer_address || '-'}</p>
                                <p class="text-xs font-bold text-slate-800 mt-2">Ref/PO: ${sale.reference_number || '-'}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Informasi Pembayaran:</p>
                                <p class="text-sm font-bold text-slate-800">BANK BRI CAB. MASAMBA</p>
                                <p class="text-sm text-slate-600 font-mono">Acc: 0231-01-000555-30-1</p>
                                <p class="text-sm text-slate-600">A/N: KOPERASI PRODUSEN SIMULTAN</p>
                            </div>
                        </div>

                        <table class="w-full text-left mb-6">
                            <thead class="bg-slate-900 text-white">
                                <tr>
                                    <th class="p-3 text-xs uppercase tracking-widest">Deskripsi Produk</th>
                                    <th class="p-3 text-xs uppercase tracking-widest text-right">Qty</th>
                                    <th class="p-3 text-xs uppercase tracking-widest text-right">Harga</th>
                                    <th class="p-3 text-xs uppercase tracking-widest text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody class="text-slate-700">${itemRows}</tbody>
                        </table>

                        <div class="w-full max-w-xs ml-auto space-y-2 mb-10">
                            <div class="flex justify-between text-sm"><span>Subtotal</span><span>Rp ${subtotal.toLocaleString()}</span></div>
                            <div class="flex justify-between text-sm"><span>PPN 11%</span><span>Rp ${sale.tax_amount?.toLocaleString() || '0'}</span></div>
                            <div class="flex justify-between text-xl font-black text-blue-600 border-t pt-2">
                                <span>TOTAL</span><span>Rp ${sale.total_amount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="mt-20 flex justify-between items-end">
                            <div class="text-center"><p class="text-xs text-slate-400 mb-16">Penerima,</p><div class="w-32 h-px bg-slate-300"></div></div>
                            <div class="text-center"><p class="text-xs text-slate-400 mb-16 italic">Hormat Kami,</p><div class="w-40 h-px bg-slate-900"></div><p class="text-[10px] font-bold mt-2 uppercase text-slate-800">Bag. Keuangan</p></div>
                        </div>
                    </div>
                    <script>window.onload = () => window.print();</script>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handlePrintSuratJalan = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=1200');
        if (!printWindow) return;

        const itemRows = items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #000; font-weight: bold;">${item.product_name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #000; font-family: mono;">${item.lot_code || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #000; text-align: center; font-size: 20px; font-weight: 900;">${item.quantity} ${item.unit}</td>
                <td style="padding: 12px; border-bottom: 1px solid #000;"></td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <title>Surat Jalan - ${sale.transaction_code}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="p-10 font-sans">
                    <div class="max-w-4xl mx-auto border-4 border-black p-8">
                        <div class="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
                            <div>
                                <h1 class="text-2xl font-black uppercase">Koperasi Simultan</h1>
                                <p class="text-xs font-bold uppercase">Surat Jalan / Delivery Order</p>
                            </div>
                            <div class="text-right">
                                <p class="font-mono text-lg font-bold">${sale.transaction_code}</p>
                                <p class="text-xs">${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-10 mb-8">
                            <div>
                                <p class="text-[10px] font-bold uppercase text-slate-500 mb-1">Tujuan Pengiriman:</p>
                                <p class="font-bold">${sale.customer_name}</p>
                                <p class="text-xs">${sale.customer_address || '-'}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold uppercase text-slate-500 mb-1">Data Armada:</p>
                                <p class="text-sm">Kendaraan: <b>${sale.vehicle_number || '-'}</b></p>
                                <p class="text-sm">Driver: <b>${sale.driver_name || '-'}</b></p>
                                <p class="text-sm">Ref Kontrak: <b>${sale.reference_number || '-'}</b></p>
                            </div>
                        </div>

                        <table class="w-full text-left mb-10 border-collapse">
                            <thead class="bg-slate-100 border-y-2 border-black">
                                <tr>
                                    <th class="p-3 uppercase text-xs">Nama Barang</th>
                                    <th class="p-3 uppercase text-xs">Batch/Lot</th>
                                    <th class="p-3 uppercase text-xs text-center">Jumlah</th>
                                    <th class="p-3 uppercase text-xs">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>${itemRows}</tbody>
                        </table>

                        <div class="grid grid-cols-3 gap-4 text-center mt-20">
                            <div><p class="text-xs mb-16">Penerima Barang,</p><p class="text-xs font-bold">( ............................ )</p></div>
                            <div><p class="text-xs mb-16">Sopir,</p><p class="text-xs font-bold">( ${sale.driver_name || '............................'} )</p></div>
                            <div><p class="text-xs mb-16">Petugas Gudang,</p><p class="text-xs font-bold">( ............................ )</p></div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
    };

    if (loading) return <Layout><div className="p-20 text-center animate-pulse">Memuat detail transaksi B2B...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/sales/commodity')} className="flex items-center text-slate-500 hover:text-slate-800 gap-2 transition-colors">
                        <ArrowLeft size={16}/> Kembali ke Daftar
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handlePrintSuratJalan} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                            <Truck size={16}/> Cetak Surat Jalan
                        </button>
                        <button onClick={handlePrintInvoice} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                            <Printer size={16}/> Cetak Invoice
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Building className="text-purple-400" size={24}/>
                                        <h1 className="text-3xl font-black tracking-tight">{sale.transaction_code}</h1>
                                    </div>
                                    <p className="text-slate-400 text-sm flex items-center gap-2">
                                        <Calendar size={14}/> {new Date(sale.transaction_date).toLocaleDateString('id-ID', {year:'numeric', month:'long', day:'numeric'})}
                                        <span className="opacity-30">|</span>
                                        <Tag size={14}/> {sale.reference_number || 'No Reference'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Status Pembayaran</p>
                                    <span className="text-xl font-bold text-green-400 flex items-center gap-2 justify-end">
                                        <CheckCircle size={20}/> PAID / LUNAS
                                    </span>
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Rincian Barang Keluar</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-slate-500 font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 text-left">Produk & Lot ID</th>
                                                <th className="p-4 text-right">Quantity</th>
                                                <th className="p-4 text-right">Harga</th>
                                                <th className="p-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-800">{item.product_name}</p>
                                                        <p className="text-xs font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded w-fit mt-1">Lot: {item.lot_code || '-'}</p>
                                                    </td>
                                                    <td className="p-4 text-right font-medium">{item.quantity} {item.unit}</td>
                                                    <td className="p-4 text-right font-mono">Rp {item.price_per_unit.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-black">Rp {item.subtotal.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={3} className="p-4 text-right font-bold text-slate-500 uppercase text-[10px]">PPN 11%</td>
                                                <td className="p-4 text-right font-bold text-red-500">Rp {sale.tax_amount?.toLocaleString() || '0'}</td>
                                            </tr>
                                            <tr className="bg-blue-50/50">
                                                <td colSpan={3} className="p-4 text-right font-black text-blue-900 uppercase text-xs tracking-widest">Grand Total Tagihan</td>
                                                <td className="p-4 text-right font-black text-xl text-blue-700">Rp {sale.total_amount.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Truck size={18} className="text-blue-500"/> Informasi Pengiriman
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">No. Kendaraan</p><p className="font-bold font-mono">{sale.vehicle_number || '-'}</p></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Nama Sopir</p><p className="font-bold">{sale.driver_name || '-'}</p></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Biaya Kirim</p><p className="font-bold">Rp {sale.shipping_cost?.toLocaleString() || '0'}</p></div>
                                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Lokasi Asal</p><p className="font-bold">{sale.shelters?.name}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 bg-purple-600 text-white flex items-center gap-3">
                                <Building size={20}/>
                                <h3 className="font-bold">Informasi Pembeli</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Buyer</p>
                                    <p className="font-bold text-slate-800">{sale.customer_name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5"/>
                                    <p className="text-xs text-slate-600 leading-relaxed">{sale.customer_address || 'Alamat tidak diinput.'}</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg">
                            <Share2 size={18}/> Bagikan Dokumen
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
