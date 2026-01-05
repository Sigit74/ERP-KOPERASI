
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Calendar, FileText, Edit } from 'lucide-react';

interface JournalLine {
    id: string;
    coa_id: string;
    debit: number;
    credit: number;
    description?: string;
    coa?: {
        code: string;
        name: string;
    };
}

interface JournalDetail {
    id: string;
    entry_number: string;
    entry_date: string;
    description: string;
    status: string;
    lines: JournalLine[];
}

export const JournalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [journal, setJournal] = useState<JournalDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJournal();
    }, [id]);

    const fetchJournal = async () => {
        if (!isConfigured()) {
            setJournal({
                id: '1',
                entry_number: 'JE-2024-001',
                entry_date: '2024-05-20',
                description: 'Setoran Modal Awal',
                status: 'posted',
                lines: [
                    { id: '1', coa_id: '1', debit: 5000000, credit: 0, coa: { code: '1-1001', name: 'Kas Besar' } },
                    { id: '2', coa_id: '2', debit: 0, credit: 5000000, coa: { code: '3-1001', name: 'Modal Awal' } }
                ]
            });
            setLoading(false);
            return;
        }

        try {
            const { data: journalData, error: journalError } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('id', id)
                .single();

            if (journalError) throw journalError;

            const { data: linesData, error: linesError } = await supabase
                .from('journal_lines')
                .select('*, coa:coa_id(code, name)')
                .eq('journal_id', id);

            if (linesError) throw linesError;

            setJournal({
                ...journalData,
                lines: linesData || []
            });
        } catch (err: any) {
            alert('Error: ' + err.message);
            navigate('/accounting/journals');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="p-6 text-center">Loading...</div></Layout>;
    if (!journal) return <Layout><div className="p-6 text-center">Jurnal tidak ditemukan</div></Layout>;

    const totalDebit = journal.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = journal.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/accounting/journals')} className="flex items-center text-slate-500 gap-2 hover:text-blue-600">
                        <ArrowLeft size={16} /> Kembali
                    </button>
                    <button
                        onClick={() => navigate(`/accounting/journals/edit/${id}`)}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-amber-700"
                    >
                        <Edit size={16} /> Edit Jurnal
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 text-white p-6">
                        <h1 className="text-2xl font-bold mb-2">{journal.entry_number}</h1>
                        <div className="flex gap-6 text-sm opacity-90">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {new Date(journal.entry_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText size={14} />
                                Status: {journal.status === 'posted' ? 'Sudah Posting' : 'Draft'}
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Deskripsi</label>
                            <p className="text-slate-800 text-lg">{journal.description}</p>
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Detail Baris Jurnal</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-y border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Kode</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Nama Akun</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Debit</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Kredit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {journal.lines.map((line, idx) => (
                                        <tr key={line.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{line.coa?.code}</td>
                                            <td className="px-4 py-3 text-slate-700">{line.coa?.name}</td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {line.debit > 0 ? new Intl.NumberFormat('id-ID').format(line.debit) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {line.credit > 0 ? new Intl.NumberFormat('id-ID').format(line.credit) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                                    <tr className="font-bold">
                                        <td colSpan={2} className="px-4 py-3 text-right text-slate-700">TOTAL</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-900">
                                            {new Intl.NumberFormat('id-ID').format(totalDebit)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-900">
                                            {new Intl.NumberFormat('id-ID').format(totalCredit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className={`mt-6 p-4 rounded-lg text-center font-bold ${Math.abs(totalDebit - totalCredit) < 0.01
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ BALANCE (Seimbang)' : '✗ TIDAK BALANCE'}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
