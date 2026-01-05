
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Search, Trash2, RefreshCw, MapPin, Ruler, Eye, FileUp, FileDown } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../../lib/excelUtils';
import { Farmer } from '../../types/database';

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const getRandomColor = (name: string) => {
  const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const MOCK_FARMERS: any[] = [
  {
    id: '1',
    name: 'Budi Santoso (Demo)',
    nik: '320100010001',
    username: '11.2001.01.001',
    phone: '08123456789',
    status: 'active',
    village: 'Sukatani',
    district: 'Baebunta',
    total_farm_area_ha: 1.5,
    farm_count: 2,
    farmer_groups: { name: 'KT Harapan Jaya' }
  },
  {
    id: '2',
    name: 'Siti Aminah (Demo)',
    nik: '320100010002',
    username: '11.2001.01.002',
    phone: '08198765432',
    status: 'active',
    village: 'Sukawangi',
    district: 'Sabbang',
    total_farm_area_ha: 0.8,
    farm_count: 1,
    farmer_groups: { name: 'KT Sejahtera' }
  },
];

export const FarmersList = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFarmers = useCallback(async (query: string = '') => {
    setLoading(true);

    if (!isConfigured()) {
      setTimeout(() => {
        let filtered = MOCK_FARMERS;
        // Search logic: Name OR Group Name
        if (query) {
          const lowerQ = query.toLowerCase();
          filtered = MOCK_FARMERS.filter(f =>
            f.name.toLowerCase().includes(lowerQ) ||
            (f.farmer_groups?.name || '').toLowerCase().includes(lowerQ)
          );
        }
        setFarmers(filtered as unknown as Farmer[]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      let dbQuery = supabase.from('farmers').select('*, farmer_groups(name)').order('created_at', { ascending: false });

      if (query) {
        // Note: Deep filtering on joined tables (farmer_groups.name) requires !inner join syntax in Supabase
        // For stability in this view, we primarily filter by Farmer Name. 
        // Advanced filtering would require a different query structure.
        dbQuery = dbQuery.ilike('name', `%${query}%`);
      }

      const { data, error } = await dbQuery;

      if (data) setFarmers(data as unknown as Farmer[]);
    } catch (err) {
      setFarmers(MOCK_FARMERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFarmers(); }, [fetchFarmers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setTimeout(() => fetchFarmers(val), 500);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus data petani ini?')) return;
    if (isConfigured()) await supabase.from('farmers').delete().eq('id', id);
    fetchFarmers(search);
  };

  const handleExport = () => {
    const dataToExport = farmers.map(f => ({
      // Identity
      'Nama Petani': f.name,
      'NIK': f.nik || '',
      'ID Anggota': f.username || '',
      'No. HP': f.phone || '',
      'Jenis Kelamin': f.gender === 'L' ? 'Laki-laki' : f.gender === 'P' ? 'Perempuan' : '',
      'Tanggal Lahir': f.birth_date || '',
      'Nama Ibu Kandung': f.mother_name || '',

      // Location
      'Desa': f.village || '',
      'Kecamatan': f.district || '',
      'Alamat Lengkap': f.address || '',
      'Kelompok Tani': (f as any).farmer_groups?.name || '',

      // Farm Assets
      'Total Luas Lahan (Ha)': f.total_farm_area_ha || 0,
      'Jumlah Kebun': f.farm_count || 0,
      'Luas Produktif (Ha)': f.productive_area_ha || 0,
      'Luas Konservasi (Ha)': f.conservation_area_ha || 0,
      'Luas Ekosistem Alami (Ha)': f.natural_ecosystem_area_ha || 0,

      // Crops & Production
      'Komoditas Utama': f.primary_crop || '',
      'Komoditas Sekunder': f.secondary_crop || '',
      'Jumlah Pohon Produktif': f.productive_trees_count || 0,
      'Jumlah Pohon Non-Produktif': f.unproductive_trees_count || 0,
      'Estimasi Produksi (Kg)': f.current_year_production_kg || 0,
      'Produksi Tahun Lalu (Kg)': f.last_year_production_kg || 0,
      'Target Penjualan (Kg)': f.sales_commitment_kg || 0,

      // Agronomy
      'Jenis Klone': f.clones || '',
      'Jenis Pupuk': f.fertilizers_used || '',
      'Pestisida': f.insecticides_used || '',
      'Fungisida': f.fungicides_used || '',
      'Herbisida': f.herbicides_used || '',
      'Pohon Pelindung': f.shade_trees_type || '',

      // Status
      'Status Keanggotaan': f.membership_status || 'Anggota',
      'Status Akun': f.status === 'active' ? 'Aktif' : 'Non-Aktif',

      // File Links (URLs)
      'Foto Profil': f.photo_url || '',
      'Foto Lahan': f.farm_photo_url || '',
      'Foto Tanda Tangan': f.signature_photo_url || ''
    }));
    exportToExcel(dataToExport, 'Database_Petani_Lengkap');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const jsonData = await importFromExcel(file);
      if (!jsonData || jsonData.length === 0) {
        alert("File kosong atau format tidak sesuai.");
        return;
      }

      if (!isConfigured()) {
        alert(`Mode Demo: Simulasi import ${jsonData.length} data.`);
        return;
      }

      setLoading(true);
      const payload = jsonData.map(row => ({
        // Map Excel columns to DB fields
        name: row['Nama Petani'] || row['name'],
        nik: row['NIK'] || row['nik'] || undefined, // undefined if empty to avoid unique constraint if not provided, though NIK usually required
        username: row['ID Anggota'] || row['username'],
        phone: row['No. HP'] || row['phone'],
        gender: row['Jenis Kelamin'] === 'Laki-laki' ? 'L' : row['Jenis Kelamin'] === 'Perempuan' ? 'P' : undefined,
        village: row['Desa'] || row['village'],
        district: row['Kecamatan'] || row['district'],
        address: row['Alamat Lengkap'] || row['address'],

        total_farm_area_ha: parseFloat(row['Total Luas Lahan (Ha)'] || row['total_farm_area_ha'] || 0),
        productive_area_ha: parseFloat(row['Luas Produktif (Ha)'] || row['productive_area_ha'] || 0),

        status: (row['Status Akun'] || row['status']) === 'Aktif' ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
        // Note: For new records, created_at is auto. For updates, we don't change it.
      }));

      // Upsert: Insert if new, Update if NIK exists
      const { error } = await supabase.from('farmers').upsert(payload, {
        onConflict: 'nik',
        ignoreDuplicates: false
      });

      if (error) throw error;

      alert(`Berhasil import/update ${jsonData.length} data petani.`);
      fetchFarmers();
    } catch (err: any) {
      alert("Gagal import: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Petani</h1>
          <p className="text-slate-500">Database lengkap anggota dan lahan.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <button onClick={() => fetchFarmers(search)} className="bg-white border px-3 py-2 rounded-lg hover:bg-slate-50 shadow-sm" title="Refresh"><RefreshCw size={18} /></button>

          <div className="flex bg-white border rounded-lg shadow-sm">
            <button onClick={handleExport} className="px-3 py-2 border-r hover:bg-slate-50 text-slate-600 flex items-center gap-1" title="Export Excel">
              <FileDown size={18} />
              <span className="hidden md:inline text-xs font-bold uppercase">Export</span>
            </button>
            <label className="px-3 py-2 hover:bg-slate-50 text-blue-600 flex items-center gap-1 cursor-pointer" title="Import Excel">
              <FileUp size={18} />
              <span className="hidden md:inline text-xs font-bold uppercase">Import</span>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
            </label>
          </div>

          <Link to="/farmers/new" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all active:scale-95">
            <Plus size={16} /> Tambah Anggota
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari Nama Petani atau Kelompok Tani..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600 min-w-[1000px]">
            <thead className="bg-white text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Profil Anggota</th>
                <th className="px-6 py-4">Lokasi & Kelompok</th>
                <th className="px-6 py-4">Data Lahan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {farmers.map((farmer, idx) => (
                <tr key={farmer.id || idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/farmers/${farmer.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getRandomColor(farmer.name)}`}>
                        {getInitials(farmer.name)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{farmer.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{farmer.username || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-800">{farmer.farmer_groups?.name || 'Umum'}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} /> {farmer.village || '-'}, {farmer.district || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Ruler size={16} className="text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-800">{farmer.total_farm_area_ha || 0} Ha</p>
                        <p className="text-xs text-slate-400">{farmer.farm_count || 1} Kebun</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold items-center gap-1 ${farmer.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${farmer.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {farmer.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/farmers/${farmer.id}`)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors text-xs font-medium" title="Lihat Detail Lengkap">
                        <Eye size={14} /> Detail
                      </button>
                      <button onClick={() => handleDelete(farmer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
