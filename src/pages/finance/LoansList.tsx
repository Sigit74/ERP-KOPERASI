import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, HandCoins, Clock, CheckCircle, AlertCircle, Eye, XCircle, Trash2, Search, Filter, Banknote, Printer, FileUp, FileDown } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../../lib/excelUtils';
import { Loan } from '../../types/database';
import { NumberInput } from '../../components/ui/NumberInput';
import { getAppConfig } from '../../lib/appConfig';

// --- SUB-COMPONENTS ---

const LoanModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [farmers, setFarmers] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        farmer_id: '',
        amount_requested: 0,
        tenor_months: 12,
        interest_rate: 1.5,
        purpose: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!isConfigured()) {
                setGroups([{ id: 'g1', name: 'Kelompok Tidar' }, { id: 'g2', name: 'Kelompok Merapi' }]);
                setFarmers([
                    { id: '1', name: 'Budi Santoso', username: 'KT-001', group_id: 'g1' },
                    { id: '2', name: 'Siti Aminah', username: 'KM-002', group_id: 'g2' }
                ]);
                return;
            }
            const [groupsRes, farmersRes] = await Promise.all([
                supabase.from('farmer_groups').select('id, name'),
                supabase.from('farmers').select('id, name, username, group_id')
            ]);
            if (groupsRes.data) setGroups(groupsRes.data);
            if (farmersRes.data) setFarmers(farmersRes.data);
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!formData.farmer_id || formData.amount_requested <= 0) {
            alert("Mohon lengkapi data anggota dan jumlah pinjaman.");
            setLoading(false);
            return;
        }
        try {
            if (!isConfigured()) {
                setTimeout(() => { alert("Mode Demo: Pengajuan berhasil."); onSuccess(); }, 500);
                return;
            }
            const { error } = await supabase.from('loans').insert([{ ...formData, status: 'pending' }]);
            if (error) throw error;
            alert("Pengajuan pinjaman berhasil disimpan!");
            onSuccess();
        } catch (err: any) {
            alert("Gagal: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredFarmers = farmers.filter(f => {
        const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
            (f.username && f.username.toLowerCase().includes(search.toLowerCase()));
        const matchGroup = !selectedGroupId || f.group_id === selectedGroupId;
        return matchSearch && matchGroup;
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Ajukan Pinjaman Baru</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kelompok Tani</label>
                            <select
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                value={selectedGroupId}
                                onChange={e => setSelectedGroupId(e.target.value)}
                            >
                                <option value="">Semua Kelompok</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peminjam</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Cari Nama/ID..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setFormData({ ...formData, farmer_id: '' }); }}
                                />
                                {search && !formData.farmer_id && (
                                    <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filteredFarmers.map(f => (
                                            <li key={f.id}
                                                onClick={() => {
                                                    setFormData({ ...formData, farmer_id: f.id });
                                                    setSearch(`[${f.username || '-'}] ${f.name}`);
                                                }}
                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium border-b border-slate-50 last:border-0"
                                            >
                                                <span className="text-purple-600 font-mono mr-2">[{f.username || '-'}]</span>
                                                {f.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jumlah Pengajuan (Rp)</label>
                        <NumberInput
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-lg font-bold text-slate-800"
                            value={formData.amount_requested}
                            onChange={e => setFormData({ ...formData, amount_requested: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenor (Bulan)</label>
                            <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 font-bold" value={formData.tenor_months} onChange={e => setFormData({ ...formData, tenor_months: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bunga Flat (%)</label>
                            <input type="number" step="0.1" className="w-full border border-slate-200 rounded-lg px-3 py-2 font-bold" value={formData.interest_rate} onChange={e => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keperluan</label>
                        <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} placeholder="Contoh: Pupuk..." />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200">Batal</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 shadow-lg">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RepaymentModal = ({ loan, onClose, onSuccess }: { loan: any, onClose: () => void, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const principal = loan.amount_approved || loan.amount_requested;
    const totalInterest = (principal * (loan.interest_rate / 100)) * loan.tenor_months;
    const totalToPay = principal + totalInterest;
    const paidSoFar = loan.loan_repayments?.reduce((sum: number, r: any) => sum + r.amount_paid, 0) || 0;
    const remaining = totalToPay - paidSoFar;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (amount <= 0 || amount > remaining + 100) {
            alert("Jumlah tidak valid.");
            setLoading(false);
            return;
        }
        try {
            if (!isConfigured()) { alert("Mode Demo: Berhasil."); onSuccess(); return; }
            const { error: repayError } = await supabase.from('loan_repayments').insert([{ loan_id: loan.id, amount_paid: amount, payment_date: date, notes }]);
            if (repayError) throw repayError;
            if (amount >= remaining - 10) await supabase.from('loans').update({ status: 'paid' }).eq('id', loan.id);
            onSuccess();
        } catch (err: any) { alert("Gagal: " + err.message); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-slate-700 text-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold">Bayar Angsuran</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                </div>
                <div className="p-5 bg-purple-50 space-y-1">
                    <div className="flex justify-between font-bold"><span>Sisa Tagihan:</span> <span className="text-red-600">Rp {new Intl.NumberFormat('id-ID').format(remaining)}</span></div>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jumlah Bayar</label>
                        <NumberInput className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xl font-bold text-green-600" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
                        <button type="button" onClick={() => setAmount(remaining)} className="mt-2 text-[10px] bg-slate-100 px-2 py-1 rounded font-bold uppercase">Bayar Lunas</button>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Angsuran ke-..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 rounded-xl">Batal</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg ring-offset-2 hover:bg-green-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LoanDetailModal = ({ loan, onClose }: { loan: any, onClose: () => void }) => {
    const config = getAppConfig();
    const principal = loan.amount_approved || loan.amount_requested;
    const totalInterest = (principal * (loan.interest_rate / 100)) * loan.tenor_months;
    const totalToPay = principal + totalInterest;
    const repayments = loan.loan_repayments || [];
    const paidSoFar = repayments.reduce((sum: number, r: any) => sum + r.amount_paid, 0);

    const handlePrintReceipt = (repayment: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:5mm;font-size:12px;}.h{text-align:center;border-bottom:1px dashed #000;margin-bottom:10px;padding-bottom:10px;}.r{display:flex;justify-content:space-between;margin-bottom:4px;}.t{font-weight:bold;border-top:1px dashed #000;margin-top:10px;padding-top:10px;}</style></head><body><div class="h"><b>${config.orgName}</b><br>${config.address}</div><div style="text-align:center;font-weight:bold;margin-bottom:10px;">BUKTI ANGSURAN</div><div class="r"><span>Tgl:</span><span>${new Date(repayment.payment_date).toLocaleDateString('id-ID')}</span></div><div class="r"><span>Peminjam:</span><span>${loan.farmers?.name}</span></div><div class="r"><span>Keterangan:</span><span>${repayment.notes || '-'}</span></div><div class="r t"><span>JUMLAH:</span><span>Rp ${new Intl.NumberFormat('id-ID').format(repayment.amount_paid)}</span></div><div class="h" style="border:0;margin-top:20px;">Terima Kasih</div><script>window.print();setTimeout(()=>window.close(),500);</script></body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-slate-700">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[500px]">
                <div className="p-6 bg-slate-50 border-r border-slate-200 md:w-1/2 overflow-y-auto">
                    <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-slate-400">Ringkasan Pinjaman</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span>Peminjam:</span> <span className="font-bold text-slate-900">{loan.farmers?.name}</span></div>
                        <div className="border-t pt-2 space-y-1">
                            <div className="flex justify-between"><span>Pokok:</span> <span>Rp {new Intl.NumberFormat('id-ID').format(principal)}</span></div>
                            <div className="flex justify-between"><span>Bunga:</span> <span className="text-amber-600">+ Rp {new Intl.NumberFormat('id-ID').format(totalInterest)}</span></div>
                            <div className="flex justify-between font-bold border-t pt-1"><span>Total Tagihan:</span> <span className="text-purple-600">Rp {new Intl.NumberFormat('id-ID').format(totalToPay)}</span></div>
                            <div className="flex justify-between"><span>Telah Dibayar:</span> <span className="text-green-600">Rp {new Intl.NumberFormat('id-ID').format(paidSoFar)}</span></div>
                            <div className="flex justify-between font-bold"><span>Sisa:</span> <span className="text-red-500">Rp {new Intl.NumberFormat('id-ID').format(totalToPay - paidSoFar)}</span></div>
                        </div>
                    </div>
                </div>
                <div className="p-6 flex flex-col md:w-1/2 overflow-hidden bg-white">
                    <h3 className="font-bold mb-4 uppercase text-xs tracking-widest text-slate-400 flex justify-between">Riwayat Bayar <span>{repayments.length}</span></h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {repayments.map((r: any) => (
                            <div key={r.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group">
                                <div><p className="text-xs font-bold leading-none mb-1">{new Date(r.payment_date).toLocaleDateString('id-ID')}</p><p className="font-bold text-green-600">Rp {new Intl.NumberFormat('id-ID').format(r.amount_paid)}</p></div>
                                <button onClick={() => handlePrintReceipt(r)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-purple-600 hover:text-white transition-all"><Printer size={16} /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClose} className="mt-4 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg">Tutup</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const LoansList = () => {
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [repayModal, setRepayModal] = useState<{ show: boolean, loan: any }>({ show: false, loan: null });
    const [detailModal, setDetailModal] = useState<{ show: boolean, loan: any }>({ show: false, loan: null });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => { fetchLoans(); }, []);

    const fetchLoans = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setTimeout(() => {
                setLoans([
                    { id: '1', farmer_id: 'f1', amount_requested: 5000000, amount_approved: 5000000, status: 'active', tenor_months: 12, interest_rate: 1.5, farmers: { name: 'Budi Santoso' }, loan_repayments: [] },
                    { id: '2', farmer_id: 'f2', amount_requested: 2000000, status: 'pending', tenor_months: 6, interest_rate: 1.5, farmers: { name: 'Siti Aminah' }, loan_repayments: [] }
                ] as any);
                setLoading(false);
            }, 500);
            return;
        }
        try {
            const { data, error } = await supabase.from('loans').select('*, farmers(name), loan_repayments(*)').order('created_at', { ascending: false });
            if (error) {
                const { data: fallbackData } = await supabase.from('loans').select('*, farmers(name)').order('created_at', { ascending: false });
                if (fallbackData) setLoans(fallbackData as unknown as Loan[]);
            } else if (data) {
                setLoans(data as unknown as Loan[]);
            }
        } catch (err) { console.warn(err); } finally { setLoading(false); }
    };

    const handleExport = () => {
        const data = loans.map(l => ({
            'Peminjam': l.farmers?.name,
            'Jumlah Pengajuan': l.amount_requested,
            'Jumlah Disetujui': l.amount_approved || 0,
            'Tenor (Bulan)': l.tenor_months,
            'Bunga (%)': l.interest_rate,
            'Status': l.status.toUpperCase(),
            'Tgl Pengajuan': (l as any).created_at ? new Date((l as any).created_at).toLocaleDateString() : '-'
        }));
        exportToExcel(data, 'Daftar_Pinjaman_Anggota');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const jsonData = await importFromExcel(file);
            if (!jsonData || jsonData.length === 0) {
                alert("File kosong.");
                return;
            }

            if (!isConfigured()) {
                alert("Mode Demo: Simulasi import " + jsonData.length + " data pinjaman.");
                return;
            }

            setLoading(true);
            const { data: farmerPool } = await supabase.from('farmers').select('id, name');

            const payload = jsonData.map(row => {
                const farmer = farmerPool?.find(f => f.name.toLowerCase() === (row['Peminjam'] || '').toLowerCase());
                if (!farmer) return null;

                return {
                    farmer_id: farmer.id,
                    amount_requested: parseFloat(row['Jumlah Pengajuan'] || 0),
                    amount_approved: parseFloat(row['Jumlah Disetujui'] || row['Jumlah Pengajuan'] || 0),
                    tenor_months: parseInt(row['Tenor (Bulan)'] || 12),
                    interest_rate: parseFloat(row['Bunga (%)'] || 1.5),
                    status: (row['Status'] || 'pending').toLowerCase(),
                    purpose: row['Keperluan'] || 'Imported via Excel'
                };
            }).filter(Boolean);

            if (payload.length === 0) {
                alert("Tidak ada data valid yang bisa diimport (Nama Peminjam tidak cocok).");
                return;
            }

            const { error } = await supabase.from('loans').insert(payload);
            if (error) throw error;

            alert(`Berhasil mengimport ${payload.length} data pinjaman.`);
            fetchLoans();
        } catch (err: any) {
            alert("Gagal: " + err.message);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm("Yakin?")) return;
        if (!isConfigured()) { fetchLoans(); return; }
        await supabase.from('loans').update({ status: newStatus }).eq('id', id);
        fetchLoans();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">PENDING</span>;
            case 'approved': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">APPROVED</span>;
            case 'active': return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">ACTIVE</span>;
            case 'paid': return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">LUNAS</span>;
            default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{status}</span>;
        }
    };

    const filteredLoans = loans.filter(l => l.farmers?.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'all' || l.status === statusFilter));

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div><h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pinjaman Anggota</h1><p className="text-slate-500 text-sm">Monitor kredit dan penagihan angsuran.</p></div>
                <div className="flex w-full sm:w-auto gap-2">
                    <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <button onClick={handleExport} className="px-3 py-2 border-r hover:bg-slate-50 text-slate-600 flex items-center gap-1" title="Export Excel">
                            <FileDown size={18} />
                        </button>
                        <label className="px-3 py-2 hover:bg-slate-50 text-purple-600 flex items-center gap-1 cursor-pointer" title="Import Excel">
                            <FileUp size={18} />
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                        </label>
                    </div>
                    <button onClick={() => setShowModal(true)} className="flex-1 bg-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-purple-200 active:scale-95 transition-all outline-none">
                        <Plus size={18} /> Pinjaman Baru
                    </button>
                </div>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 mb-6">
                <div className="flex-1 relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" placeholder="Cari peminjam..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none" value={search} onChange={e => setSearch(e.target.value)} /></div>
                <select className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-slate-600 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="paid">Lunas</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase text-[10px] tracking-widest">
                        <tr><th className="px-6 py-4">Peminjam</th><th className="px-6 py-4 text-right">Jumlah</th><th className="px-6 py-4 text-center">Tenor</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {!loading && filteredLoans.map((loan) => (
                            <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{loan.farmers?.name}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">Rp {new Intl.NumberFormat('id-ID').format(loan.amount_requested)}</td>
                                <td className="px-6 py-4 text-center">{loan.tenor_months} Bln</td>
                                <td className="px-6 py-4"><div className="flex justify-center">{getStatusBadge(loan.status)}</div></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {loan.status === 'pending' && <button onClick={() => updateStatus(loan.id, 'approved')} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"><CheckCircle size={18} /></button>}
                                        {loan.status === 'approved' && <button onClick={() => updateStatus(loan.id, 'active')} className="bg-purple-600 text-white px-3 py-1 rounded-lg font-bold text-[10px]">CAIRKAN</button>}
                                        {loan.status === 'active' && <button onClick={() => setRepayModal({ show: true, loan })} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Banknote size={18} /></button>}
                                        <button onClick={() => setDetailModal({ show: true, loan })} className="p-2 text-slate-400 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"><Eye size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-20 text-center font-bold text-slate-300">Memuat Data...</div>}
            </div>

            {showModal && <LoanModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchLoans(); }} />}
            {repayModal.show && <RepaymentModal loan={repayModal.loan} onClose={() => setRepayModal({ show: false, loan: null })} onSuccess={() => { setRepayModal({ show: false, loan: null }); fetchLoans(); }} />}
            {detailModal.show && <LoanDetailModal loan={detailModal.loan} onClose={() => setDetailModal({ show: false, loan: null })} />}
        </Layout>
    );
};
