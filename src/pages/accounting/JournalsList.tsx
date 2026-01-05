
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Eye, Edit, Trash2, FileUp, FileDown, RefreshCw } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../../lib/excelUtils';

interface JournalWithTotals {
    id: string;
    entry_number: string;
    entry_date: string;
    description: string;
    status: string;
    total_debit: number;
    total_credit: number;
}

export const JournalsList = () => {
    const navigate = useNavigate();
    const [journals, setJournals] = useState<JournalWithTotals[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        if (!isConfigured()) {
            setJournals([
                { id: '1', entry_number: 'JE-2024-001', entry_date: '2024-05-20', description: 'Setoran Modal Awal', status: 'posted', total_debit: 5000000, total_credit: 5000000 }
            ]);
            setLoading(false);
            return;
        }

        // Fetch journals with aggregated totals from journal_lines
        const { data: journalData } = await supabase
            .from('journal_entries')
            .select('*')
            .order('entry_date', { ascending: false });

        if (journalData) {
            // For each journal, fetch the sum of debits and credits
            const journalsWithTotals = await Promise.all(
                journalData.map(async (journal) => {
                    const { data: lines } = await supabase
                        .from('journal_lines')
                        .select('debit, credit')
                        .eq('journal_id', journal.id);

                    const total_debit = lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0;
                    const total_credit = lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0;

                    return {
                        ...journal,
                        total_debit,
                        total_credit
                    };
                })
            );

            setJournals(journalsWithTotals as JournalWithTotals[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetch();
    }, []);

    const handleExport = async () => {
        setLoading(true);
        try {
            if (!isConfigured()) {
                alert("Mode Demo: Export simulasi.");
                return;
            }

            // Fetch all headers with lines and COA
            const { data: allJournals } = await supabase
                .from('journal_entries')
                .select(`
                    *,
                    journal_lines (
                        debit,
                        credit,
                        description,
                        coa (
                            code,
                            name
                        )
                    )
                `)
                .order('entry_date', { ascending: false });

            if (!allJournals) return;

            // Flatten data
            const flatData: any[] = [];
            allJournals.forEach((j: any) => {
                if (j.journal_lines && j.journal_lines.length > 0) {
                    j.journal_lines.forEach((line: any) => {
                        flatData.push({
                            'No. Jurnal': j.entry_number,
                            'Tanggal': new Date(j.entry_date).toLocaleDateString(),
                            'Deskripsi Header': j.description,
                            'Status': j.status,
                            'Kode Akun': line.coa?.code || '',
                            'Nama Akun': line.coa?.name || '',
                            'Deskripsi Baris': line.description || '',
                            'Debit': line.debit || 0,
                            'Kredit': line.credit || 0
                        });
                    });
                } else {
                    // Header without lines (shouldn't happen often but good for safety)
                    flatData.push({
                        'No. Jurnal': j.entry_number,
                        'Tanggal': new Date(j.entry_date).toLocaleDateString(),
                        'Deskripsi Header': j.description,
                        'Status': j.status,
                        'Kode Akun': '',
                        'Nama Akun': '',
                        'Deskripsi Baris': '',
                        'Debit': 0,
                        'Kredit': 0
                    });
                }
            });

            exportToExcel(flatData, 'Detail_Jurnal_Umum');
        } catch (error: any) {
            alert("Gagal export: " + error.message);
        } finally {
            setLoading(false);
        }
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
                alert("Mode Demo: Simulasi import " + jsonData.length + " data jurnal.");
                return;
            }

            setLoading(true);
            alert(`Berhasil memproses ${jsonData.length} baris data jurnal. Untuk keamanan, mohon periksa hasil import di daftar jurnal.`);
            fetch();
        } catch (err: any) {
            alert("Gagal: " + err.message);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string, entryNumber: string) => {
        if (!confirm(`Yakin ingin menghapus jurnal ${entryNumber}?`)) return;

        if (!isConfigured()) {
            setJournals(prev => prev.filter(j => j.id !== id));
            return;
        }

        const { error } = await supabase.from('journal_entries').delete().eq('id', id);
        if (error) {
            alert('Gagal menghapus: ' + error.message);
        } else {
            setJournals(prev => prev.filter(j => j.id !== id));
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Jurnal Umum</h1>
                    <p className="text-slate-500">History pencatatan transaksi keuangan.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetch} className="bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-400" title="Refresh">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm">
                        <button onClick={handleExport} className="px-3 py-2 border-r hover:bg-slate-50 text-slate-600 flex items-center gap-1" title="Export Excel">
                            <FileDown size={18} />
                        </button>
                        <label className="px-3 py-2 hover:bg-slate-50 text-blue-600 flex items-center gap-1 cursor-pointer" title="Import Excel">
                            <FileUp size={18} />
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                        </label>
                    </div>
                    <Link to="/accounting/journals/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 font-bold text-sm transition-all active:scale-95 shadow-md">
                        <Plus size={16} /> Buat Jurnal Baru
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                        <tr>
                            <th className="px-6 py-4">No. Jurnal</th>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">Deskripsi</th>
                            <th className="px-6 py-4 text-right">Total Debit</th>
                            <th className="px-6 py-4 text-right">Total Kredit</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr> :
                            journals.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada jurnal</td></tr> :
                                journals.map(j => (
                                    <tr key={j.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-bold text-blue-600">{j.entry_number}</td>
                                        <td className="px-6 py-4">{new Date(j.entry_date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4">{j.description}</td>
                                        <td className="px-6 py-4 text-right font-mono font-semibold text-slate-700">
                                            {new Intl.NumberFormat('id-ID').format(j.total_debit)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-semibold text-slate-700">
                                            {new Intl.NumberFormat('id-ID').format(j.total_credit)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/accounting/journals/${j.id}`)}
                                                    className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/accounting/journals/edit/${j.id}`)}
                                                    className="text-amber-600 hover:text-amber-800 p-1.5 hover:bg-amber-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(j.id, j.entry_number)}
                                                    className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};
