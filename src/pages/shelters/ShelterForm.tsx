
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';
import { NumberInput } from '../../components/ui/NumberInput';

export const ShelterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    capacity_limit: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = { ...formData };
    if (!cleanData.capacity_limit) cleanData.capacity_limit = 0;

    const { error } = await supabase.from('shelters').insert([cleanData]);
    if (!error) navigate('/shelters');
    else alert(error.message);
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/shelters')} className="flex items-center text-slate-500 mb-6 gap-2"><ArrowLeft size={16} /> Kembali</button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-6">Input Shelter Baru</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kode Shelter</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="SH-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Shelter</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Shelter Utama" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
              <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas Maksimal (KG)</label>
              <NumberInput
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                value={formData.capacity_limit}
                onChange={e => setFormData({ ...formData, capacity_limit: Number(e.target.value) })}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold mt-4 flex justify-center gap-2"><Save size={18} /> Simpan</button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
