
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Users, Trash2, Edit, Briefcase, Phone, Wallet } from 'lucide-react';
import { Staff } from '../../types/database';

export const StaffList = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    if (!isConfigured()) {
        setTimeout(() => {
            setStaff([
                { id: '1', full_name: 'Bpk. Ahmad Ketua (Demo)', position: 'Ketua Koperasi', phone: '081200001', status: 'active', basic_salary: 3500000, allowance: 500000, join_date: '2023-01-01' },
                { id: '2', full_name: 'Ibu Siti Admin (Demo)', position: 'Sekretaris', phone: '081200002', status: 'active', basic_salary: 2800000, allowance: 200000, join_date: '2023-03-01' }
            ]);
            setLoading(false);
        }, 300);
        return;
    }

    try {
        const { data, error } = await supabase.from('coop_staff').select('*').order('full_name');
        if (error) throw error;
        if (data) setStaff(data as Staff[]);
    } catch (err) {
        console.warn(err);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data pengurus ini?")) return;
    if (isConfigured()) {
        await supabase.from('coop_staff').delete().eq('id', id);
        fetchStaff();
    } else {
        setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  // Calculate Totals
  const totalBasic = staff.reduce((sum, s) => sum + (s.basic_salary || 0), 0);
  const totalAllowance = staff.reduce((sum, s) => sum + (s.allowance || 0), 0);
  const totalMonthly = totalBasic + totalAllowance;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengurus & Staff</h1>
          <p className="text-slate-500">Data personalia dan struktur gaji bulanan.</p>
        </div>
        <Link to="/staff/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700">
            <Plus size={16} /> Tambah Personil
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-sm font-medium mb-1">Total Personil</div>
              <div className="text-2xl font-bold text-slate-800">{staff.length} <span className="text-sm font-normal text-slate-400">Orang</span></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-sm font-medium mb-1">Total Beban Gaji (Bulanan)</div>
              <div className="text-2xl font-bold text-blue-600 font-mono">
                  {new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(totalMonthly)}
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-left text-sm text-slate-600">
             <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                     <th className="px-6 py-4">Nama Lengkap</th>
                     <th className="px-6 py-4">Jabatan</th>
                     <th className="px-6 py-4 text-right">Gaji Pokok</th>
                     <th className="px-6 py-4 text-right">Tunjangan</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Aksi</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                 {staff.map(s => (
                     <tr key={s.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                 {s.full_name.charAt(0)}
                             </div>
                             <div>
                                 <div>{s.full_name}</div>
                                 <div className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10}/> {s.phone || '-'}</div>
                             </div>
                         </td>
                         <td className="px-6 py-4">
                             <span className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded w-fit text-xs font-medium">
                                 <Briefcase size={12}/> {s.position}
                             </span>
                         </td>
                         <td className="px-6 py-4 text-right font-mono">
                             {new Intl.NumberFormat('id-ID').format(s.basic_salary || 0)}
                         </td>
                         <td className="px-6 py-4 text-right font-mono">
                             {new Intl.NumberFormat('id-ID').format(s.allowance || 0)}
                         </td>
                         <td className="px-6 py-4 text-center">
                             {s.status === 'active' ? (
                                 <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">Aktif</span>
                             ) : (
                                 <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs">Non-Aktif</span>
                             )}
                         </td>
                         <td className="px-6 py-4 text-right">
                             <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16}/></button>
                         </td>
                     </tr>
                 ))}
                 {staff.length === 0 && !loading && (
                     <tr><td colSpan={6} className="text-center p-8 text-slate-400">Belum ada data pengurus.</td></tr>
                 )}
             </tbody>
         </table>
      </div>
    </Layout>
  );
};
