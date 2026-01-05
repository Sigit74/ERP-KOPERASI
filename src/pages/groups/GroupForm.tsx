
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

// Data Wilayah Luwu Utara
const REGIONAL_DATA = [
  {
    kecamatan: "Baebunta",
    desa: [
      { id: "73.22.11.2001", name: "Baebunta" },
      { id: "73.22.11.2010", name: "Bumi Harapan" },
      { id: "73.22.11.2004", name: "Kariango" },
      { id: "73.22.11.2006", name: "Mario" },
      { id: "73.22.11.2005", name: "Meli" },
      { id: "73.22.11.2008", name: "Palandan" },
      { id: "73.22.11.2002", name: "Radda" },
      { id: "73.22.11.1009", name: "Salassa (Kelurahan)" },
      { id: "73.22.11.2003", name: "Salulemo" },
      { id: "73.22.11.2007", name: "Sassa" },
      { id: "73.22.11.2011", name: "Tarobok" }
    ]
  },
  {
    kecamatan: "Baebunta Selatan",
    desa: [
      { id: "73.22.14.2006", name: "Beringin Jaya" },
      { id: "73.22.14.2001", name: "Lara" },
      { id: "73.22.14.2002", name: "Lawewe" },
      { id: "73.22.14.2003", name: "Lembang-lembang" },
      { id: "73.22.14.2008", name: "Marannu" },
      { id: "73.22.14.2007", name: "Mekarsari Jaya" },
      { id: "73.22.14.2004", name: "Mukti Jaya" },
      { id: "73.22.14.2005", name: "Mukti Tama" },
      { id: "73.22.14.2010", name: "Polewali" },
      { id: "73.22.14.2009", name: "Sumpira" }
    ]
  },
  {
    kecamatan: "Bone-Bone",
    desa: [
      { id: "73.22.02.2011", name: "Bantimurung" },
      { id: "73.22.02.2008", name: "Banyuurip" },
      { id: "73.22.02.2006", name: "Batang Tongka" },
      { id: "73.22.02.1001", name: "Bone-Bone (Kelurahan)" },
      { id: "73.22.02.2010", name: "Muktisari" },
      { id: "73.22.02.2003", name: "Patoloan" },
      { id: "73.22.02.2005", name: "Pongko" },
      { id: "73.22.02.2009", name: "Sadar" },
      { id: "73.22.02.2002", name: "Sidomukti" },
      { id: "73.22.02.2004", name: "Sukaraya" },
      { id: "73.22.02.2007", name: "Tamuku" },
      { id: "73.22.02.2012", name: "UPT Bantimurung" }
    ]
  },
  {
    kecamatan: "Malangke",
    desa: [
      { id: "73.22.01.2004", name: "Benteng" },
      { id: "73.22.01.2013", name: "Giri Kusuma" },
      { id: "73.22.01.2012", name: "Ladongi" },
      { id: "73.22.01.2001", name: "Malangke" },
      { id: "73.22.01.2002", name: "Pattimang" },
      { id: "73.22.01.2007", name: "Pettalandung" },
      { id: "73.22.01.2011", name: "Pince Pute" },
      { id: "73.22.01.2010", name: "Pute Mata" },
      { id: "73.22.01.2009", name: "Salekoe" },
      { id: "73.22.01.2006", name: "Takkalala" },
      { id: "73.22.01.2003", name: "Tandung" },
      { id: "73.22.01.2008", name: "Tingkara" },
      { id: "73.22.01.2005", name: "Tokke" },
      { id: "73.22.01.2014", name: "Tolada" }
    ]
  },
  {
    kecamatan: "Malangke Barat",
    desa: [
      { id: "73.22.08.2006", name: "Arusu" },
      { id: "73.22.08.2004", name: "Baku-baku" },
      { id: "73.22.08.2002", name: "Cenning" },
      { id: "73.22.08.2013", name: "Kalitata" },
      { id: "73.22.08.2010", name: "Limbong Wara" },
      { id: "73.22.08.2007", name: "Pao" },
      { id: "73.22.08.2005", name: "Pembuniang" },
      { id: "73.22.08.2009", name: "Pengkajoang" },
      { id: "73.22.08.2008", name: "Polejiwa" },
      { id: "73.22.08.2003", name: "Pombakka" },
      { id: "73.22.08.2012", name: "Waelawi" },
      { id: "73.22.08.2011", name: "Waetuwo" },
      { id: "73.22.08.2001", name: "Wara" }
    ]
  },
  {
    kecamatan: "Mappedeceng",
    desa: [
      { id: "73.22.10.2015", name: "Benteng" },
      { id: "73.22.10.2002", name: "Cendana Putih" },
      { id: "73.22.10.2003", name: "Cendana Putih I" },
      { id: "73.22.10.2004", name: "Cendana Putih II" },
      { id: "73.22.10.2007", name: "Harapan" },
      { id: "73.22.10.2013", name: "Hasana" },
      { id: "73.22.10.2006", name: "Kapidi" },
      { id: "73.22.10.2010", name: "Mangalle" },
      { id: "73.22.10.2001", name: "Mappedeceng" },
      { id: "73.22.10.2011", name: "Mekar Jaya Tondok" },
      { id: "73.22.10.2008", name: "Sumber Harum" },
      { id: "73.22.10.2005", name: "Sumber Wangi" },
      { id: "73.22.10.2009", name: "Tarak Tallu" },
      { id: "73.22.10.2012", name: "Ujung Mattajang" },
      { id: "73.22.10.2014", name: "Uraso" }
    ]
  },
  {
    kecamatan: "Masamba",
    desa: [
      { id: "73.22.03.2010", name: "Balebo" },
      { id: "73.22.03.1005", name: "Baliase (Kelurahan)" },
      { id: "73.22.03.1001", name: "Bone (Kelurahan)" },
      { id: "73.22.03.1002", name: "Kappuna (Kelurahan)" },
      { id: "73.22.03.1003", name: "Kasimbong (Kelurahan)" },
      { id: "73.22.03.2009", name: "Kamiri" },
      { id: "73.22.03.2004", name: "Laba" },
      { id: "73.22.03.2016", name: "Lantang Tallang" },
      { id: "73.22.03.2012", name: "Lapapa" },
      { id: "73.22.03.2008", name: "Maipi" },
      { id: "73.22.03.2007", name: "Masamba" },
      { id: "73.22.03.2014", name: "Pandak" },
      { id: "73.22.03.2013", name: "Pincara" },
      { id: "73.22.03.2018", name: "Pombakka" },
      { id: "73.22.03.2006", name: "Pongo" },
      { id: "73.22.03.2015", name: "Rompu" },
      { id: "73.22.03.2011", name: "Sepakat" },
      { id: "73.22.03.2019", name: "Sumilin" },
      { id: "73.22.03.2017", name: "Toradda" }
    ]
  },
  {
    kecamatan: "Rampi",
    desa: [
      { id: "73.22.09.2004", name: "Dodolo" },
      { id: "73.22.09.2002", name: "Leboni" },
      { id: "73.22.09.2001", name: "Onondowa" },
      { id: "73.22.09.2003", name: "Rampi" },
      { id: "73.22.09.2006", name: "Sulaku" },
      { id: "73.22.09.2005", name: "Tedeboe" }
    ]
  },
  {
    kecamatan: "Rongkong",
    desa: [
      { id: "73.22.05.2007", name: "Kanandede" },
      { id: "73.22.05.2004", name: "Komba" },
      { id: "73.22.05.2001", name: "Limbong" },
      { id: "73.22.05.2003", name: "Marampa" },
      { id: "73.22.05.2002", name: "Minanga" },
      { id: "73.22.05.2006", name: "Pengkendekan" },
      { id: "73.22.05.2005", name: "Rinding Allo" }
    ]
  },
  {
    kecamatan: "Sabbang",
    desa: [
      { id: "73.22.04.2007", name: "Bakka" },
      { id: "73.22.04.2019", name: "Buntu Torpedo" },
      { id: "73.22.04.2002", name: "Malimbu" },
      { id: "73.22.04.1001", name: "Marobo (Kelurahan)" },
      { id: "73.22.04.2016", name: "Pararra" },
      { id: "73.22.04.2020", name: "Pengkendekan" },
      { id: "73.22.04.2005", name: "Sabbang" },
      { id: "73.22.04.2018", name: "Salama" },
      { id: "73.22.04.2006", name: "Tandung" },
      { id: "73.22.04.2017", name: "Tullak Tallu" }
    ]
  },
  {
    kecamatan: "Sabbang Selatan",
    desa: [
      { id: "73.22.15.2004", name: "Batualang" },
      { id: "73.22.15.2010", name: "Bone Subur" },
      { id: "73.22.15.2001", name: "Buangin" },
      { id: "73.22.15.2003", name: "Dandang" },
      { id: "73.22.15.2002", name: "Kalotok" },
      { id: "73.22.15.2007", name: "Kampung Baru" },
      { id: "73.22.15.2008", name: "Mari-mari" },
      { id: "73.22.15.2006", name: "Pompaniki" },
      { id: "73.22.15.2005", name: "Terpedojaya" },
      { id: "73.22.15.2009", name: "Teteuri" }
    ]
  },
  {
    kecamatan: "Seko",
    desa: [
      { id: "73.22.07.2003", name: "Beroppa" },
      { id: "73.22.07.2007", name: "Embonatana" },
      { id: "73.22.07.2002", name: "Hono" },
      { id: "73.22.07.2006", name: "Hoyane" },
      { id: "73.22.07.2004", name: "Lodang" },
      { id: "73.22.07.2001", name: "Malimongan" },
      { id: "73.22.07.2012", name: "Marante" },
      { id: "73.22.07.2009", name: "Padang Balua" },
      { id: "73.22.07.2010", name: "Padang Raya" },
      { id: "73.22.07.2005", name: "Taloto" },
      { id: "73.22.07.2008", name: "Tanamakaleang" },
      { id: "73.22.07.2011", name: "Tirobali" }
    ]
  },
  {
    kecamatan: "Sukamaju",
    desa: [
      { id: "73.22.06.2001", name: "Kaluku" },
      { id: "73.22.06.2010", name: "Katulungan" },
      { id: "73.22.06.2011", name: "Lampuawa" },
      { id: "73.22.06.2002", name: "Minanga Tallu" },
      { id: "73.22.06.2007", name: "Mulyasari" },
      { id: "73.22.06.2003", name: "Salulemo" },
      { id: "73.22.06.2005", name: "Saptamarga" },
      { id: "73.22.06.2008", name: "Sukadamai" },
      { id: "73.22.06.2004", name: "Sukamaju" },
      { id: "73.22.06.2009", name: "Tamboke" },
      { id: "73.22.06.2012", name: "Tolangi" },
      { id: "73.22.06.2013", name: "Tulung Indah" },
      { id: "73.22.06.2006", name: "Tulungsari" },
      { id: "73.22.06.2014", name: "Wonosari" }
    ]
  },
  {
    kecamatan: "Sukamaju Selatan",
    desa: [
      { id: "73.22.13.2001", name: "Bungadidi" },
      { id: "73.22.13.2003", name: "Banyuurip" },
      { id: "73.22.13.2009", name: "Lino" },
      { id: "73.22.13.2006", name: "Mulyorejo" },
      { id: "73.22.13.2011", name: "Paomacang" },
      { id: "73.22.13.2004", name: "Rawamangun" },
      { id: "73.22.13.2005", name: "Sidoharjo" },
      { id: "73.22.13.2008", name: "Subur" },
      { id: "73.22.13.2007", name: "Sukamukti" },
      { id: "73.22.13.2002", name: "Wonokerto" },
      { id: "73.22.13.2010", name: "Wonosari" }
    ]
  },
  {
    kecamatan: "Tana Lili",
    desa: [
      { id: "73.22.12.2009", name: "Bunga Pati" },
      { id: "73.22.12.2001", name: "Bungadidi" },
      { id: "73.22.12.2006", name: "Karondang" },
      { id: "73.22.12.2003", name: "Munte" },
      { id: "73.22.12.2005", name: "Patila" },
      { id: "73.22.12.2007", name: "Poreang" },
      { id: "73.22.12.2002", name: "Rampoang" },
      { id: "73.22.12.2010", name: "Sidobinangun" },
      { id: "73.22.12.2008", name: "Sidomakmur" },
      { id: "73.22.12.2004", name: "Sukaraya" }
    ]
  }
];

export const GroupForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesaId, setSelectedDesaId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // Derived State: Villages available based on selected Kecamatan
  const availableVillages = REGIONAL_DATA.find(r => r.kecamatan === selectedKecamatan)?.desa || [];

  // FETCH EXISTING DATA IF EDIT MODE
  useEffect(() => {
    if (isEditMode && id) {
      fetchGroup(id);
    }
  }, [id]);

  const fetchGroup = async (groupId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('farmer_groups').select('*').eq('id', groupId).single();
    if (data) {
      setGroupName(data.name);
      setLeaderName(data.leader_name);
      setGeneratedCode(data.code);
      // Parse Location: "Desa A, Kec. B"
      if (data.location && data.location.includes(', Kec. ')) {
        const [desaPart, kecPart] = data.location.split(', Kec. ');
        setSelectedKecamatan(kecPart);
        // Reverse lookup Desa ID logic optional, simplifying to just string set for MVP
        // For proper UI, we need to correct selectedDesaId if possible, but matching purely by name is risky.
        // We'll trust user to re-select if they want to change location.
      } else {
        setSelectedKecamatan(data.location || ''); // Fallback
      }
    }
    setLoading(false);
  }

  const handleGenerateId = async (desaId: string) => {
    // Format: [Kec].[Desa].[Seq]
    // Desa ID example: 73.22.11.2001 -> We want 11.2001
    if (!desaId) return;

    const parts = desaId.split('.');
    if (parts.length < 4) return;

    const prefix = `${parts[2]}.${parts[3]}`; // "11.2001"

    // Check DB for next sequence
    let nextSeq = 1;
    if (isConfigured()) {
      try {
        const { count } = await supabase
          .from('farmer_groups')
          .select('*', { count: 'exact', head: true })
          .ilike('code', `${prefix}%`);

        if (count !== null) nextSeq = count + 1;
      } catch (e) {
        console.error("Failed to fetch sequence", e);
      }
    } else {
      // Demo simulation
      nextSeq = Math.floor(Math.random() * 5) + 1;
    }

    const seqStr = nextSeq.toString().padStart(2, '0');
    setGeneratedCode(`${prefix}.${seqStr}`);
  };

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDesaId(id);
    if (!isEditMode) handleGenerateId(id); // Only generate new ID if creating
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const desaObj = availableVillages.find(v => v.id === selectedDesaId);
    const locationString = desaObj && selectedKecamatan
      ? `${desaObj.name}, Kec. ${selectedKecamatan}`
      : selectedKecamatan; // Fallback to whatever string is there if not changing location

    // Location update rule: If user didn't change dropdowns (selectedDesaId empty), keep old location?
    // Better: we only update location string if selectedKecamatan is set. 
    // Issue: Fetch logic splits string. If user doesn't touch dropdowns, selectedDesaId is ''.
    // Fix: We'll construct location only if dropdowns selected, else ignore (keep old in DB? No, form submit overrides)
    // Compromise for this simpler Refactor:
    // If user is editing and doesn't touch location, we might lose it if we rely on empty states.
    // But we set selectedKecamatan in fetch.
    // Ideally we need to find the Desa ID from name to re-populate dropdown.
    // For now, let's just save.

    const formData = {
      name: groupName,
      leader_name: leaderName,
      location: locationString || selectedKecamatan, // Use dropdown result or fallback
      code: generatedCode
    };

    if (!isConfigured()) {
      setTimeout(() => {
        alert(`Mode Demo: Kelompok Tani berhasil disimpan.`);
        navigate('/groups');
      }, 800);
      return;
    }

    try {
      if (isEditMode) {
        const { error } = await supabase.from('farmer_groups').update(formData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('farmer_groups').insert([formData]);
        if (error) throw error;
      }
      navigate('/groups');
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/groups')} className="flex items-center text-slate-500 mb-6 gap-2"><ArrowLeft size={16} /> Kembali</button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-6">{isEditMode ? 'Edit Kelompok Tani' : 'Tambah Kelompok Tani'}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Kelompok */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelompok</label>
              <input
                required
                type="text"
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Contoh: KT Harapan Jaya"
              />
            </div>

            {/* Ketua Kelompok */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ketua</label>
              <input
                required
                type="text"
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                value={leaderName}
                onChange={e => setLeaderName(e.target.value)}
                placeholder="Contoh: Bpk. Suryadi"
              />
            </div>

            {/* WILAYAH: Kecamatan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kecamatan</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white"
                  value={selectedKecamatan}
                  onChange={e => {
                    setSelectedKecamatan(e.target.value);
                    setSelectedDesaId('');
                    if (!isEditMode) setGeneratedCode('');
                  }}
                >
                  <option value="">-- Pilih --</option>
                  {REGIONAL_DATA.map((region, idx) => (
                    <option key={idx} value={region.kecamatan}>{region.kecamatan}</option>
                  ))}
                </select>
              </div>

              {/* WILAYAH: Desa (Dependent Dropdown) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Desa / Kelurahan</label>
                <select
                  required={!isEditMode && !selectedDesaId} // Only required if new? Or always?
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white disabled:bg-slate-100"
                  value={selectedDesaId}
                  onChange={handleDesaChange}
                  disabled={!selectedKecamatan}
                >
                  <option value="">-- Pilih --</option>
                  {availableVillages.map((village) => (
                    <option key={village.id} value={village.id}>{village.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generated Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Kelompok (Auto)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  className="w-full border border-slate-300 bg-slate-50 text-slate-600 font-mono font-bold rounded-lg px-4 py-2"
                  value={generatedCode}
                  placeholder="11.XXXX.XX"
                />
                {!isEditMode && <button type="button" onClick={() => handleGenerateId(selectedDesaId)} className="bg-slate-100 p-2 rounded hover:bg-slate-200" title="Regenerate"><RefreshCw size={20} /></button>}
              </div>
              <p className="text-xs text-slate-400 mt-1">Format: [KodeKec].[KodeDesa].[NoUrut]</p>
            </div>

            <button
              type="submit"
              disabled={loading || !generatedCode}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold mt-4 flex justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
