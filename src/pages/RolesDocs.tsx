import React from 'react';
import { ShieldCheck, UserCog, Calculator } from 'lucide-react';

const RoleCard = ({ title, icon: Icon, description, color, permissions }: any) => (
  <div className={`border rounded-xl p-6 bg-white shadow-sm ${color}`}>
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
        <Icon size={24} className="text-slate-700" />
      </div>
      <div>
        <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">User Group</p>
      </div>
    </div>
    <p className="text-slate-600 text-sm mb-6 min-h-[40px]">{description}</p>
    
    <div>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hak Akses (Permissions)</h4>
      <ul className="space-y-2">
        {permissions.map((perm: string, idx: number) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
            {perm}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const RolesDocs = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Manajemen Role & Akses</h1>
        <p className="text-slate-600">Definisi 3 peran utama dalam sistem dan batasan akses (RLS Policy).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RoleCard 
          title="Admin"
          icon={ShieldCheck}
          color="border-purple-200 hover:border-purple-300"
          description="Superuser dengan akses penuh ke seluruh modul sistem dan konfigurasi."
          permissions={[
            "CRUD (Create, Read, Update, Delete) semua tabel.",
            "Manajemen User & Password.",
            "Override/Edit transaksi yang sudah dikunci.",
            "Akses penuh Dashboard Analytics."
          ]}
        />

        <RoleCard 
          title="Field Officer"
          icon={UserCog}
          color="border-green-200 hover:border-green-300"
          description="Petugas lapangan yang bertugas mengumpulkan data petani dan hasil panen."
          permissions={[
            "INSERT data Petani Baru.",
            "INSERT data Kebun & Polygon.",
            "INSERT Transaksi Pembelian (Receiving).",
            "READ Produk & Gudang.",
            "Hanya bisa melihat/edit data yang dibuat sendiri (RLS)."
          ]}
        />

        <RoleCard 
          title="Accountant"
          icon={Calculator}
          color="border-orange-200 hover:border-orange-300"
          description="Staff keuangan yang mengelola pembukuan dan validasi transaksi."
          permissions={[
            "READ Transaksi Pembelian (Read-Only).",
            "CRUD Chart of Accounts (COA).",
            "CRUD Jurnal Umum.",
            "Melihat Laporan Keuangan.",
            "Tidak bisa mengubah data operasional lapangan."
          ]}
        />
      </div>

      <div className="bg-slate-900 text-slate-400 p-6 rounded-xl text-sm">
        <h3 className="text-white font-bold mb-2">Implementasi RLS (Row Level Security)</h3>
        <p className="mb-4">Contoh logika Policy pada tabel <code>purchase_transactions</code>:</p>
        <pre className="font-mono bg-black/50 p-4 rounded text-green-400 overflow-x-auto">
{`-- Field Officer: Hanya bisa insert
CREATE POLICY "Officer Insert" ON purchase_transactions 
FOR INSERT WITH CHECK (auth.role() = 'field_officer');

-- Accountant: Hanya bisa baca
CREATE POLICY "Accountant View" ON purchase_transactions 
FOR SELECT USING (auth.role() = 'accountant');`}
        </pre>
      </div>
    </div>
  );
};