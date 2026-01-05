
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, User, Map, Sprout, FileText, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { FileUpload } from '../../components/ui/FileUpload';
import { NumberInput } from '../../components/ui/NumberInput';

type TabType = 'profile' | 'farm' | 'agronomy' | 'production' | 'files';

export const FarmerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [groups, setGroups] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    group_id: '',
    gender: 'L',
    nik: '',
    birth_date: '',
    status: 'active',
    membership_status: 'Anggota',
    mother_name: '',
    address: '',
    village: '',
    district: '',
    phone: '',
    farm_count: 1,
    total_farm_area_ha: 0,
    coordinates: '',
    productive_area_ha: 0,
    natural_ecosystem_area_ha: 0,
    conservation_area_ha: 0,
    farm_recommendation: '',
    primary_crop: '',
    secondary_crop: '',
    crop_age: 0,
    productive_trees_count: 0,
    unproductive_trees_count: 0,
    cocoa_pests: '',
    cocoa_diseases: '',
    clones: '',
    fungicides_used: '',
    insecticides_used: '',
    herbicides_used: '',
    fertilizers_used: '',
    shade_trees_type: '',
    shade_trees_count: 0,
    worker_names: '',
    male_workers_count: 0,
    female_workers_count: 0,
    sales_commitment_kg: 0,
    last_year_production_kg: 0,
    current_year_production_kg: 0,
    quota_kg: 0,
    surveyor_name: '',
    photo_url: '',
    farm_photo_url: '',
    signature_photo_url: ''
  });

  useEffect(() => {
    fetchGroups();
    if (isEditMode) fetchFarmerData(id);
  }, [id]);

  useEffect(() => {
    if (!isEditMode && formData.group_id && groups.length > 0) {
      generateFarmerID(formData.group_id);
    }
  }, [formData.group_id, groups, isEditMode]);

  const generateFarmerID = async (groupId: string) => {
    if (!groupId) return;

    try {
      // 1. Get Group Code
      const selectedGroup = groups.find(g => g.id === groupId);
      if (!selectedGroup || !selectedGroup.code) return;

      // 2. Count existing farmers in this group to get numeric sequence
      const { count, error } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (error) throw error;

      // 3. Format ID: GroupCode.SequentialNumber (001, 002, etc.)
      const nextSequence = (count || 0) + 1;
      const formattedSequence = String(nextSequence).padStart(3, '0');
      const newID = `${selectedGroup.code}.${formattedSequence}`;

      setFormData(prev => ({ ...prev, username: newID }));
    } catch (err) {
      console.error('Error generating Farmer ID:', err);
    }
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from('farmer_groups').select('id, name, code');
    if (data) setGroups(data);
  };

  const fetchFarmerData = async (farmerId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('farmers').select('*').eq('id', farmerId).single();
    if (!error && data) setFormData(prev => ({ ...prev, ...data }));
    setLoading(false);
  };

  const checkNikExists = async (nik: string, currentFarmerId?: string): Promise<boolean> => {
    if (!nik || nik.trim() === '') return false;

    const { data, error } = await supabase
      .from('farmers')
      .select('id, nik')
      .eq('nik', nik)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is good (NIK doesn't exist)
      console.error('Error checking NIK:', error);
      return false;
    }

    // If we're editing, allow the same NIK for the current farmer
    if (data && currentFarmerId && data.id === currentFarmerId) {
      return false; // Not a duplicate, it's the same farmer
    }

    return !!data; // Returns true if NIK exists for a different farmer
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate NIK before submission
      if (formData.nik && formData.nik.trim() !== '') {
        const nikExists = await checkNikExists(formData.nik, isEditMode ? id : undefined);
        if (nikExists) {
          alert('❌ NIK sudah terdaftar!\n\nNIK "' + formData.nik + '" sudah digunakan oleh petani lain.\nSilakan gunakan NIK yang berbeda atau periksa kembali data.');
          setLoading(false);
          return;
        }
      }

      // SANITIZE DATA: Convert empty strings to null for UUID/Numeric fields
      const sanitizedData = { ...formData };
      if (!sanitizedData.group_id) (sanitizedData as any).group_id = null;
      if (!sanitizedData.birth_date) (sanitizedData as any).birth_date = null;

      // IMPORTANT: Convert empty NIK to NULL to allow multiple farmers without NIK
      // Database UNIQUE constraint allows multiple NULL values but not multiple empty strings
      if (!sanitizedData.nik || sanitizedData.nik.trim() === '') {
        (sanitizedData as any).nik = null;
      }

      // Ensure numeric fields are numbers
      ['total_farm_area_ha', 'productive_area_ha', 'conservation_area_ha', 'natural_ecosystem_area_ha',
        'farm_count', 'crop_age', 'shade_trees_count', 'male_workers_count', 'female_workers_count',
        'sales_commitment_kg', 'last_year_production_kg', 'current_year_production_kg', 'quota_kg',
        'productive_trees_count', 'unproductive_trees_count'].forEach(field => {
          if ((sanitizedData as any)[field] === '') (sanitizedData as any)[field] = 0;
        });

      if (isEditMode) {
        const { error } = await supabase.from('farmers').update(sanitizedData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('farmers').insert([sanitizedData]);
        if (error) throw error;
      }
      alert("✅ Data berhasil disimpan ke database!");
      navigate('/farmers');
    } catch (err: any) {
      // Friendly error messages
      let errorMessage = 'Gagal menyimpan data:\n\n';

      if (err.message.includes('farmers_nik_key') || err.message.includes('duplicate key')) {
        errorMessage += '❌ NIK sudah terdaftar di database.\nSilakan gunakan NIK yang berbeda.';
      } else if (err.message.includes('violates')) {
        errorMessage += '❌ Data tidak valid: ' + err.message;
      } else {
        errorMessage += err.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === id
        ? 'border-blue-600 text-blue-600 bg-blue-50'
        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate('/farmers')} className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-all">
            <ArrowLeft size={18} /> Kembali
          </button>
          <div className="flex items-center gap-4">
            {isEditMode && <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic">Editing Mode</span>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Simpan Data Petani</>}
            </button>
          </div>
        </div>

        <form className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 custom-scrollbar">
            <TabButton id="profile" label="Profil Identitas" icon={User} />
            <TabButton id="farm" label="Geo & Lahan" icon={Map} />
            <TabButton id="agronomy" label="Agronomi" icon={Sprout} />
            <TabButton id="production" label="Data Produksi" icon={FileText} />
            <TabButton id="files" label="Berkas Lampiran" icon={CheckCircle} />
          </div>

          <div className="p-10">
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kelompok Tani</label>
                    <select name="group_id" value={formData.group_id} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold outline-none focus:border-blue-600">
                      <option value="">Pilih Kelompok</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ID Anggota</label>
                    <input name="username" value={formData.username} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-mono font-bold text-blue-600" placeholder="Otomatis atau Manual" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NIK (KTP)</label>
                    <input name="nik" required value={formData.nik} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" placeholder="16 Digit NIK" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Petani</label>
                    <select name="membership_status" value={formData.membership_status} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold outline-none focus:border-blue-600">
                      <option value="Anggota">Anggota</option>
                      <option value="Non Anggota">Non Anggota</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap Sesuai KTP</label>
                    <input name="name" required value={formData.name} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jenis Kelamin</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Lahir</label>
                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Ibu Kandung</label>
                    <input name="mother_name" value={formData.mother_name} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">No. HP / WhatsApp</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Domisili Lengkap</label>
                    <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desa</label>
                    <input name="village" value={formData.village} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kecamatan</label>
                    <input name="district" value={formData.district} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'farm' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                <div className="space-y-6">
                  <h3 className="font-black text-xs text-blue-600 uppercase tracking-[0.2em] mb-4">Metrik Lahan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jml Petak Lahan</label>
                      <NumberInput name="farm_count" value={formData.farm_count} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Total Luas (Ha)</label>
                      <NumberInput step="0.01" name="total_farm_area_ha" value={formData.total_farm_area_ha} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-black text-blue-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Produktif</label>
                      <NumberInput step="0.01" name="productive_area_ha" value={formData.productive_area_ha} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Konservasi</label>
                      <NumberInput step="0.01" name="conservation_area_ha" value={formData.conservation_area_ha} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Ekosistem</label>
                      <NumberInput step="0.01" name="natural_ecosystem_area_ha" value={formData.natural_ecosystem_area_ha} onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="font-black text-xs text-orange-600 uppercase tracking-[0.2em] mb-4">Lokasi Geospasial</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Koordinat Tengah (GPS)</label>
                    <input name="coordinates" value={formData.coordinates} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-mono text-sm font-bold" placeholder="-2.555, 120.111" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Rekomendasi Petugas</label>
                    <textarea name="farm_recommendation" rows={4} value={formData.farm_recommendation} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-medium text-sm" placeholder="Catatan kondisi lahan..." />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agronomy' && (
              <div className="animate-fade-in space-y-8">
                {/* DATA TANAMAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="font-black text-xs text-green-600 uppercase tracking-[0.2em] mb-4">Profil Tanaman</h3>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Komoditas Utama</label>
                      <input name="primary_crop" value={formData.primary_crop} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Misal: Kakao" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Komoditas Sekunder</label>
                        <input name="secondary_crop" value={formData.secondary_crop} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Umur Tanaman (Thn)</label>
                        <NumberInput name="crop_age" value={formData.crop_age} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pohon Produktif</label>
                        <NumberInput name="productive_trees_count" value={formData.productive_trees_count} onChange={handleChange} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pohon Tidak Produktif</label>
                        <NumberInput name="unproductive_trees_count" value={formData.unproductive_trees_count} onChange={handleChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jenis Klon</label>
                      <input name="clones" value={formData.clones} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" placeholder="MCC 02, Sulawesi 1, dll" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-black text-xs text-red-600 uppercase tracking-[0.2em] mb-4">Hama & Penyakit</h3>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Hama Utama</label>
                      <textarea name="cocoa_pests" rows={2} value={formData.cocoa_pests} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-medium text-sm" placeholder="PBK, Penggerek Batang..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Penyakit Utama</label>
                      <textarea name="cocoa_diseases" rows={2} value={formData.cocoa_diseases} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-medium text-sm" placeholder="VSD, Busuk Buah..." />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 border-dashed" />

                {/* INPUT PERTANIAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="font-black text-xs text-purple-600 uppercase tracking-[0.2em] mb-4">Penggunaan Input</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pupuk</label>
                        <input name="fertilizers_used" value={formData.fertilizers_used} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Fungisida</label>
                        <input name="fungicides_used" value={formData.fungicides_used} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Insektisida</label>
                        <input name="insecticides_used" value={formData.insecticides_used} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Herbisida</label>
                        <input name="herbicides_used" value={formData.herbicides_used} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-black text-xs text-amber-600 uppercase tracking-[0.2em] mb-4">Pohon Penaung & Tenaga Kerja</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jenis Penaung</label>
                        <input name="shade_trees_type" value={formData.shade_trees_type} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jml Penaung</label>
                        <NumberInput name="shade_trees_count" value={formData.shade_trees_count} onChange={handleChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama Pekerja</label>
                      <input name="worker_names" value={formData.worker_names} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold" placeholder="Pisahkan dengan koma" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pekerja Pria</label>
                        <NumberInput name="male_workers_count" value={formData.male_workers_count} onChange={handleChange} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pekerja Wanita</label>
                        <NumberInput name="female_workers_count" value={formData.female_workers_count} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'production' && (
              <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="font-black text-xs text-blue-600 uppercase tracking-[0.2em] mb-4">Historis Produksi</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Produksi Tahun Lalu (KG)</label>
                    <NumberInput name="last_year_production_kg" value={formData.last_year_production_kg} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold text-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Produksi Tahun Ini (KG)</label>
                    <NumberInput name="current_year_production_kg" value={formData.current_year_production_kg} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold text-lg" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-black text-xs text-orange-600 uppercase tracking-[0.2em] mb-4">Target & Komitmen</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Komitmen Penjualan (KG)</label>
                    <NumberInput name="sales_commitment_kg" value={formData.sales_commitment_kg} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-black text-2xl text-orange-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Kuota Tersedia (KG)</label>
                    <NumberInput name="quota_kg" value={formData.quota_kg} onChange={handleChange} className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl font-bold text-lg text-slate-500" />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'files' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                <FileUpload bucketName="images" label="Foto Wajah Petani" currentImage={formData.photo_url} onUploadComplete={(_, url) => setFormData(p => ({ ...p, photo_url: url }))} />
                <FileUpload bucketName="images" label="Foto Bentang Lahan" currentImage={formData.farm_photo_url} onUploadComplete={(_, url) => setFormData(p => ({ ...p, farm_photo_url: url }))} />
                <FileUpload bucketName="images" label="Foto Tanda Tangan" currentImage={formData.signature_photo_url} onUploadComplete={(_, url) => setFormData(p => ({ ...p, signature_photo_url: url }))} />
              </div>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};
