
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Map, Plus, Trash2, MapPin, ChevronRight, Save, X, AlertCircle, RefreshCw } from 'lucide-react';
import { District, Village } from '../../types/database';

export const RegionalData = () => {
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // Forms State
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillage, setNewVillage] = useState({ id: '', name: '' });

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      fetchVillages(selectedDistrict.id);
    } else {
      setVillages([]);
    }
  }, [selectedDistrict]);

  const fetchDistricts = async () => {
    setLoading(true);
    if (!isConfigured()) {
       setDistricts([
           { id: 'd1', name: 'Baebunta (Demo)' },
           { id: 'd2', name: 'Sabbang (Demo)' }
       ]);
       setLoading(false);
       return;
    }

    try {
        const { data, error } = await supabase.from('districts').select('*').order('name');
        if (data) setDistricts(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const fetchVillages = async (districtId: string) => {
    if (!isConfigured()) {
        const demoVillages: any = {
            'd1': [{id: '73.22.11.2001', name: 'Baebunta', district_id: 'd1'}],
            'd2': [{id: '73.22.04.2005', name: 'Sabbang', district_id: 'd2'}]
        };
        setVillages(demoVillages[districtId] || []);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('villages')
            .select('*')
            .eq('district_id', districtId)
            .order('id');
        if (data) setVillages(data);
    } catch (e) {
        console.error(e);
    }
  };

  const handleAddDistrict = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isConfigured()) {
          alert("Mode Demo: Data tidak disimpan ke database.");
          setShowAddDistrict(false);
          return;
      }

      const { error } = await supabase.from('districts').insert([{ name: newDistrictName }]);
      if (error) alert("Gagal: " + error.message);
      else {
          fetchDistricts();
          setNewDistrictName('');
          setShowAddDistrict(false);
      }
  };

  const handleAddVillage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDistrict) return;

      if (!isConfigured()) {
          alert("Mode Demo: Data tidak disimpan.");
          setShowAddVillage(false);
          return;
      }

      const { error } = await supabase.from('villages').insert([{
          id: newVillage.id,
          name: newVillage.name,
          district_id: selectedDistrict.id
      }]);

      if (error) alert("Gagal: " + error.message);
      else {
          fetchVillages(selectedDistrict.id);
          setNewVillage({ id: '', name: '' });
          setShowAddVillage(false);
      }
  };

  const handleDeleteVillage = async (id: string) => {
      if(!confirm("Hapus desa ini?")) return;
      if (isConfigured()) {
          await supabase.from('villages').delete().eq('id', id);
          if (selectedDistrict) fetchVillages(selectedDistrict.id);
      } else {
          setVillages(prev => prev.filter(v => v.id !== id));
      }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Data Wilayah</h1>
           <p className="text-sm text-slate-500 font-medium">Pengaturan hirarki administratif Kecamatan & Desa.</p>
        </div>
        <button onClick={fetchDistricts} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KECAMATAN */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Map size={16} className="text-blue-600"/> Daftar Kecamatan
                  </h3>
                  <button onClick={() => setShowAddDistrict(true)} className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                      <Plus size={18}/>
                  </button>
              </div>
              
              {showAddDistrict && (
                  <form onSubmit={handleAddDistrict} className="p-4 bg-blue-50 border-b border-blue-100 animate-slide-up">
                      <input 
                        autoFocus placeholder="Nama Kecamatan..." 
                        className="w-full border-2 border-white rounded-xl px-4 py-2 mb-2 outline-none focus:border-blue-600 font-bold text-sm"
                        value={newDistrictName} onChange={e => setNewDistrictName(e.target.value)} required
                      />
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowAddDistrict(false)} className="text-[10px] font-black uppercase text-slate-400">Batal</button>
                          <button type="submit" className="text-[10px] font-black uppercase text-blue-600">Simpan</button>
                      </div>
                  </form>
              )}

              <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
                  {districts.map(d => (
                      <div 
                        key={d.id} onClick={() => setSelectedDistrict(d)}
                        className={`p-4 rounded-2xl cursor-pointer flex justify-between items-center group transition-all ${
                            selectedDistrict?.id === d.id ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                          <span className="font-bold text-sm">{d.name}</span>
                          <ChevronRight size={16} className={selectedDistrict?.id === d.id ? 'text-blue-400' : 'text-slate-300'} />
                      </div>
                  ))}
              </div>
          </div>

          {/* DESA */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <MapPin size={16} className="text-orange-600"/> 
                      {selectedDistrict ? `Desa di ${selectedDistrict.name}` : 'Pilih Kecamatan'}
                  </h3>
                  {selectedDistrict && (
                    <button onClick={() => setShowAddVillage(true)} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-200 transition-all">
                        <Plus size={14}/> Tambah Desa
                    </button>
                  )}
              </div>

              {!selectedDistrict ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50">
                      <Map size={64} className="mb-4"/>
                      <p className="font-bold uppercase tracking-widest text-xs">Pilih kecamatan di kiri</p>
                  </div>
              ) : (
                  <>
                    {showAddVillage && (
                        <form onSubmit={handleAddVillage} className="p-6 bg-orange-50 border-b border-orange-100 animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input 
                                placeholder="Kode (73.22...)" 
                                className="border-2 border-white rounded-xl px-4 py-2 outline-none focus:border-orange-500 font-mono text-xs"
                                value={newVillage.id} onChange={e => setNewVillage({...newVillage, id: e.target.value})} required
                            />
                            <input 
                                placeholder="Nama Desa..." 
                                className="border-2 border-white rounded-xl px-4 py-2 outline-none focus:border-orange-500 font-bold text-sm"
                                value={newVillage.name} onChange={e => setNewVillage({...newVillage, name: e.target.value})} required
                            />
                            <div className="flex items-center gap-4">
                                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Simpan</button>
                                <button type="button" onClick={() => setShowAddVillage(false)} className="text-[10px] font-black uppercase text-slate-400">Batal</button>
                            </div>
                        </form>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kode BPS</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Desa</th>
                                    <th className="px-8 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {villages.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-8 py-4 font-mono text-xs text-slate-400">{v.id}</td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-700">{v.name}</td>
                                        <td className="px-8 py-4 text-right">
                                            <button onClick={() => handleDeleteVillage(v.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </>
              )}
          </div>
      </div>
    </Layout>
  );
};
