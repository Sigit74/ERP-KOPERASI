import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Search, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2, History, Edit, Save, X, FileUp, FileDown } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../../lib/excelUtils';
import { NumberInput } from '../../components/ui/NumberInput';

interface TransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialType?: string;
  initialFarmerId?: string;
  initialFarmerName?: string;
}

const TransactionModal = ({ onClose, onSuccess, initialType = 'DEPOSIT', initialFarmerId = '', initialFarmerName = '' }: TransactionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState(initialType === 'WITHDRAW' ? 'SUKARELA' : 'WAJIB');
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(initialFarmerId);
  const [search, setSearch] = useState(initialFarmerName);

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

    if (!amount || amount <= 0) {
      alert("Jumlah harus lebih dari 0");
      setLoading(false);
      return;
    }

    if (!selectedFarmerId) {
      alert("Pilih anggota terlebih dahulu");
      setLoading(false);
      return;
    }

    const payload = {
      farmer_id: selectedFarmerId,
      transaction_type: type,
      saving_category: category,
      amount: amount,
      description: 'Manual Transaction'
    };

    if (!isConfigured()) {
      setTimeout(() => {
        alert("Mode Demo: Transaksi berhasil dicatat.");
        onSuccess();
      }, 500);
      return;
    }

    try {
      const { error } = await supabase.from('savings_transactions').insert([payload]);
      if (error) throw error;
      alert("Transaksi berhasil disimpan!");
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
    const matchGroup = !selectedGroupId || (f as any).group_id === selectedGroupId;
    return matchSearch && matchGroup;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Transaksi Simpanan Baru</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {/* Group Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Kelompok Tani</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
                disabled={!!initialFarmerId}
              >
                <option value="">Semua Kelompok</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Member Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Anggota</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Cari Nama/ID..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedFarmerId(''); }}
                  disabled={!!initialFarmerId}
                />
                {search && !selectedFarmerId && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredFarmers.map(f => (
                      <li key={f.id}
                        onClick={() => { setSelectedFarmerId(f.id); setSearch(`[${f.username || '-'}] ${f.name}`); }}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium"
                      >
                        <span className="text-blue-600 font-mono mr-2">[{f.username || '-'}]</span>
                        {f.name}
                      </li>
                    ))}
                    {filteredFarmers.length === 0 && <li className="px-4 py-2 text-slate-400 text-xs text-center">Tidak ditemukan</li>}
                  </ul>
                )}
              </div>
              {selectedFarmerId && <p className="text-[10px] text-green-600 mt-1 font-bold italic">✓ Anggota Terpilih</p>}
            </div>
          </div>

          {/* Transaction Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jenis Transaksi</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="DEPOSIT">Setoran (+)</option>
                <option value="WITHDRAW">Penarikan (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="WAJIB">Simpanan Wajib</option>
                <option value="POKOK">Simpanan Pokok</option>
                <option value="SUKARELA">Simpanan Sukarela</option>
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nominal (Rp)</label>
            <NumberInput
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold text-slate-800"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30">
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryModal = ({ farmerId, farmerName, onClose, onSuccess }: { farmerId: string, farmerName: string, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: 0, category: '' });

  useEffect(() => {
    fetchTransactions();
  }, [farmerId]);

  const fetchTransactions = async () => {
    setLoading(true);
    if (!isConfigured()) {
      setTransactions([
        { id: 't1', transaction_date: new Date().toISOString(), transaction_type: 'DEPOSIT', saving_category: 'WAJIB', amount: 100000, description: 'Simulasi' },
        { id: 't2', transaction_date: new Date().toISOString(), transaction_type: 'WITHDRAW', saving_category: 'SUKARELA', amount: 50000, description: 'Simulasi' }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      alert("Gagal memuat transaksi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setEditForm({ amount: t.amount, category: t.saving_category });
  };

  const handleSave = async (id: string) => {
    if (!isConfigured()) {
      alert("Mode Demo: Perubahan disimpan.");
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('savings_transactions')
        .update({ amount: editForm.amount, saving_category: editForm.category })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchTransactions();
      onSuccess();
    } catch (err: any) {
      alert("Gagal update: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;

    if (!isConfigured()) {
      setTransactions(transactions.filter(t => t.id !== id));
      onSuccess();
      return;
    }

    try {
      const { error } = await supabase
        .from('savings_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTransactions();
      onSuccess();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Riwayat Simpanan</h3>
            <p className="text-xs text-blue-600 font-bold uppercase mt-0.5">{farmerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center py-10 text-slate-400 italic">Memuat riwayat...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center py-10 text-slate-400">Belum ada riwayat transaksi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b">
                  <th className="pb-3 text-left">Tanggal</th>
                  <th className="pb-3 text-left">Jenis</th>
                  <th className="pb-3 text-left">Kategori</th>
                  <th className="pb-3 text-right">Nominal</th>
                  <th className="pb-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-slate-600 tabular-nums">{new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.transaction_type === 'DEPOSIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.transaction_type === 'DEPOSIT' ? 'SETOR' : 'TARIK'}
                      </span>
                    </td>
                    <td className="py-3">
                      {editingId === t.id ? (
                        <select
                          className="border rounded px-1 py-0.5 text-xs"
                          value={editForm.category}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          <option value="WAJIB">WAJIB</option>
                          <option value="POKOK">POKOK</option>
                          <option value="SUKARELA">SUKARELA</option>
                        </select>
                      ) : (
                        <span className="text-slate-500 font-medium">{t.saving_category}</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-700">
                      {editingId === t.id ? (
                        <input
                          type="number"
                          className="border rounded px-1 py-0.5 text-right w-24 text-blue-600"
                          value={editForm.amount}
                          onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                        />
                      ) : (
                        <span>Rp {new Intl.NumberFormat('id-ID').format(t.amount)}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {editingId === t.id ? (
                          <button onClick={() => handleSave(t.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Simpan"><Save size={16} /></button>
                        ) : (
                          <button onClick={() => handleEdit(t)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit size={16} /></button>
                        )}
                        <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-300 transition-colors">Tutup</button>
        </div>
      </div>
    </div>
  );
};

export const SavingsList = () => {
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalConfig, setModalConfig] = useState<{ show: boolean, type: string, farmerId: string, farmerName: string }>({
    show: false,
    type: 'DEPOSIT',
    farmerId: '',
    farmerName: ''
  });

  const [historyConfig, setHistoryConfig] = useState<{ show: boolean, farmerId: string, farmerName: string }>({
    show: false,
    farmerId: '',
    farmerName: ''
  });

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    setLoading(true);
    if (!isConfigured()) {
      setTimeout(() => {
        setSavings([
          { id: '1', farmer_name: 'Budi Santoso', group_name: 'Kelompok Tidar', pokok: 500000, wajib: 1200000, sukarela: 2500000 },
          { id: '2', farmer_name: 'Siti Aminah', group_name: 'Kelompok Merapi', pokok: 500000, wajib: 800000, sukarela: 150000 }
        ]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.from('farmers').select(`
            id, name, farmer_groups(name),
            savings_transactions (amount, transaction_type, saving_category)
        `);

      if (data) {
        const formatted = data
          .filter((f: any) => f.savings_transactions && f.savings_transactions.length > 0)
          .map((f: any) => {
            const sums = { pokok: 0, wajib: 0, sukarela: 0 };
            f.savings_transactions.forEach((t: any) => {
              const factor = t.transaction_type === 'DEPOSIT' ? 1 : -1;
              const cat = t.saving_category.toLowerCase();
              if (cat in sums) (sums as any)[cat] += (t.amount * factor);
            });
            return {
              id: f.id,
              farmer_name: f.name,
              group_name: f.farmer_groups?.name || 'Umum',
              ...sums
            };
          });
        setSavings(formatted);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllTransactions = async (farmerId: string, farmerName: string) => {
    if (!confirm(`Hapus SEMUA riwayat transaksi simpanan untuk ${farmerName}? Tindakan ini tidak dapat dibatalkan.`)) return;

    if (!isConfigured()) {
      alert("Mode Demo: Data dihapus.");
      setSavings(savings.filter(s => s.id !== farmerId));
      return;
    }

    try {
      const { error } = await supabase
        .from('savings_transactions')
        .delete()
        .eq('farmer_id', farmerId);

      if (error) throw error;
      alert("Data simpanan anggota berhasil dihapus.");
      fetchSavings();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleExport = () => {
    const data = savings.map(s => ({
      'Nama Anggota': s.farmer_name,
      'Kelompok': s.group_name,
      'Simpanan Pokok': s.pokok,
      'Simpanan Wajib': s.wajib,
      'Simpanan Sukarela': s.sukarela,
      'Total Saldo': s.pokok + s.wajib + s.sukarela
    }));
    exportToExcel(data, 'Daftar_Simpanan_Anggota');
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
        alert("Mode Demo: Simulasi import " + jsonData.length + " transaksi simpanan.");
        return;
      }

      setLoading(true);
      const { data: farmerPool } = await supabase.from('farmers').select('id, name');

      const payload = jsonData.map(row => {
        const farmer = farmerPool?.find(f => f.name.toLowerCase() === (row['Nama Anggota'] || '').toLowerCase());
        if (!farmer) return null;

        return {
          farmer_id: farmer.id,
          transaction_type: (row['Jenis'] || 'DEPOSIT').toUpperCase(),
          saving_category: (row['Kategori'] || 'WAJIB').toUpperCase(),
          amount: parseFloat(row['Nominal'] || 0),
          transaction_date: row['Tanggal'] || new Date().toISOString(),
          description: row['Keterangan'] || 'Imported via Excel'
        };
      }).filter(Boolean);

      if (payload.length === 0) {
        alert("Tidak ada data valid yang bisa diimport (Nama Anggota tidak cocok).");
        return;
      }

      const { error } = await supabase.from('savings_transactions').insert(payload);
      if (error) throw error;

      alert(`Berhasil mengimport ${payload.length} transaksi simpanan.`);
      fetchSavings();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const openModal = (type: string, farmerId: string = '', farmerName: string = '') => {
    setModalConfig({ show: true, type, farmerId, farmerName });
  };

  const filtered = savings.filter(s =>
    s.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.group_name && s.group_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Simpanan Anggota</h1>
          <p className="text-slate-500">Rekapitulasi saldo simpanan pokok, wajib, dan sukarela.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-2">
          <div className="flex bg-white border rounded-lg shadow-sm">
            <button onClick={handleExport} className="px-3 py-2 border-r hover:bg-slate-50 text-slate-600 flex items-center gap-1" title="Export Excel">
              <FileDown size={18} />
              <span className="hidden md:inline text-xs font-bold">Export</span>
            </button>
            <label className="px-3 py-2 hover:bg-slate-50 text-blue-600 flex items-center gap-1 cursor-pointer" title="Import Excel">
              <FileUp size={18} />
              <span className="hidden md:inline text-xs font-bold">Import</span>
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
            </label>
          </div>
          <button onClick={() => openModal('DEPOSIT')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-colors">
            <Plus size={16} /> Transaksi Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Seluruh Simpanan</p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              Rp {new Intl.NumberFormat('id-ID').format(savings.reduce((a, b) => a + b.pokok + b.wajib + b.sukarela, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Anggota</th>
                <th className="px-6 py-4">Kelompok</th>
                <th className="px-6 py-4 text-right">S. Pokok</th>
                <th className="px-6 py-4 text-right">S. Wajib</th>
                <th className="px-6 py-4 text-right">S. Sukarela</th>
                <th className="px-6 py-4 text-right font-bold">Total Saldo</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic">Memuat data simpanan...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Data tidak ditemukan.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{s.farmer_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{s.group_name}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">{new Intl.NumberFormat('id-ID').format(s.pokok)}</td>
                  <td className="px-6 py-4 text-right font-mono">{new Intl.NumberFormat('id-ID').format(s.wajib)}</td>
                  <td className="px-6 py-4 text-right font-mono text-blue-600">{new Intl.NumberFormat('id-ID').format(s.sukarela)}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{new Intl.NumberFormat('id-ID').format(s.pokok + s.wajib + s.sukarela)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openModal('DEPOSIT', s.id, s.farmer_name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Setor"><ArrowDownCircle size={18} /></button>
                      <button onClick={() => openModal('WITHDRAW', s.id, s.farmer_name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Tarik"><ArrowUpCircle size={18} /></button>
                      <button onClick={() => setHistoryConfig({ show: true, farmerId: s.id, farmerName: s.farmer_name })} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Riwayat/Edit"><History size={18} /></button>
                      <button onClick={() => handleDeleteAllTransactions(s.id, s.farmer_name)} className="p-1.5 text-slate-300 hover:text-red-700 hover:bg-red-50 rounded ml-2" title="Hapus Semua Transaksi"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalConfig.show && (
        <TransactionModal
          onClose={() => setModalConfig({ ...modalConfig, show: false })}
          onSuccess={() => { setModalConfig({ ...modalConfig, show: false }); fetchSavings(); }}
          initialType={modalConfig.type}
          initialFarmerId={modalConfig.farmerId}
          initialFarmerName={modalConfig.farmerName}
        />
      )}
      {historyConfig.show && (
        <HistoryModal
          farmerId={historyConfig.farmerId}
          farmerName={historyConfig.farmerName}
          onClose={() => setHistoryConfig({ ...historyConfig, show: false })}
          onSuccess={fetchSavings}
        />
      )}
    </Layout>
  );
};
