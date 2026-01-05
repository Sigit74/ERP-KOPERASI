
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { 
  ShieldCheck, UserPlus, Trash2, Mail, 
  Loader2, X, Save, RefreshCw, AlertTriangle,
  ArrowRight, WifiOff, ShieldAlert, Building, User, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../lib/supabase';

export const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDemoAccount, setIsDemoAccount] = useState(false);
  
  const [dbStatus, setDbStatus] = useState({
      connected: false,
      tablesReady: false,
      checking: true,
      errorMsg: ''
  });

  const [formData, setFormData] = useState({
      email: '',
      password: '',
      full_name: '',
      role_id: '',
      shelter_id: '',
  });

  useEffect(() => {
    const checkUser = async () => {
        // Fix: Property 'getUser' does not exist on type 'SupabaseAuthClient'
        const { data } = await (supabase.auth as any).getUser();
        if (!data?.user) setIsDemoAccount(true);
    };
    checkUser();
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
      setDbStatus(prev => ({ ...prev, checking: true, errorMsg: '' }));
      
      if (!isConfigured()) {
          setDbStatus({ connected: false, tablesReady: false, checking: false, errorMsg: 'Konfigurasi tidak lengkap.' });
          setLoading(false);
          return;
      }

      try {
          const { error } = await supabase.from('roles').select('id').limit(1);
          
          if (error) {
              setDbStatus({ connected: true, tablesReady: false, checking: false, errorMsg: '' });
          } else {
              setDbStatus({ connected: true, tablesReady: true, checking: false, errorMsg: '' });
              fetchInitialData();
              fetchUsers();
          }
      } catch (e: any) {
          setDbStatus({ connected: false, tablesReady: false, checking: false, errorMsg: e.message });
      } finally {
          setLoading(false);
      }
  };

  const fetchInitialData = async () => {
      const { data: rData } = await supabase.from('roles').select('*');
      const { data: sData } = await supabase.from('shelters').select('*');
      if (rData) setRoles(rData);
      if (sData) setShelters(sData);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select(`
                user_id, 
                users (email, full_name), 
                roles (name), 
                shelters (name)
            `);
        
        if (data) {
            setUsers(data.map((u: any) => ({
                id: u.user_id,
                email: u.users?.email || 'Unknown',
                name: u.users?.full_name || 'Tanpa Nama',
                role: u.roles?.name || 'No Role',
                shelter_name: u.shelters?.name || 'Akses Global'
            })));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
          // Fix: Property 'signUp' does not exist on type 'SupabaseAuthClient'
          const { data: authData, error: authError } = await (supabase.auth as any).signUp({
              email: formData.email,
              password: formData.password,
              options: { data: { full_name: formData.full_name } }
          });
          if (authError) throw authError;

          if (authData.user) {
              await new Promise(resolve => setTimeout(resolve, 2000)); 
              await supabase.from('user_roles').insert([{
                  user_id: authData.user.id,
                  role_id: formData.role_id,
                  shelter_id: formData.shelter_id || null
              }]);
          }

          alert("SUKSES! Akun staff asli telah didaftarkan ke Supabase Anda.");
          setShowAddModal(false);
          setFormData({ email: '', password: '', full_name: '', role_id: '', shelter_id: '' });
          fetchUsers();
      } catch (err: any) {
          alert("Gagal: " + err.message);
      } finally {
          setSaving(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Hapus hak akses user ini?")) return;
      await supabase.from('user_roles').delete().eq('user_id', id);
      fetchUsers();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-20">
        {isDemoAccount && (
            <div className="mb-10 bg-slate-900 border-2 border-blue-500 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldCheck size={200}/></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-blue-400" size={24}/>
                        <h2 className="text-xl font-black uppercase">Anda dalam Mode Demo</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-6 max-w-2xl leading-relaxed">
                        Daftar staff di bawah ini <b>masih kosong</b> karena Anda login sebagai User Demo. 
                        Untuk menguji database Supabase Anda, silakan <b>Tambah Staff</b> di bawah, lalu gunakan email tersebut untuk login.
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                        >
                            Buat Akun Staff Asli
                        </button>
                        <button 
                            onClick={() => logout()}
                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            Log Out Demo
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center gap-4 mb-10">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">User & Otoritas</h1>
                <p className="text-sm text-slate-500 font-medium">Data user asli yang tersimpan di database Supabase Anda.</p>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={fetchUsers} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all hover:shadow-md">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
                </button>
                {dbStatus.tablesReady && (
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                    >
                        <UserPlus size={18}/> Tambah Staff
                    </button>
                )}
            </div>
        </div>

        <div className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all ${!dbStatus.tablesReady ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Data Staff (Database Asli)</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Jabatan</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Lokasi</th>
                            <th className="px-8 py-5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="py-24 text-center">
                                <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32}/>
                                <p className="font-black text-slate-300 uppercase text-xs tracking-widest">Sinkronisasi...</p>
                            </td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="py-24 text-center px-10">
                                <div className="max-w-md mx-auto">
                                    <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <ShieldAlert className="text-slate-300" size={24}/>
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-sm mb-1">Belum Ada Akun Terdaftar</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Database Anda masih bersih. Silakan mendaftarkan staff baru menggunakan tombol di pojok kanan atas.
                                    </p>
                                </div>
                            </td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-slate-200 group-hover:bg-blue-600 transition-colors uppercase">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 tracking-tight">{u.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                        {u.role?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-8 py-6 font-bold text-sm text-slate-600">
                                    <div className="flex items-center gap-2 uppercase tracking-tighter">
                                        <Building size={14} className="text-slate-300"/>
                                        {u.shelter_name}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20"><UserPlus size={24}/></div>
                          <div>
                            <h3 className="font-black uppercase tracking-widest text-sm">Registrasi Staff Baru</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Menambah User Baru ke Database Supabase</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  
                  <form onSubmit={handleCreateUser} className="p-10 space-y-6">
                      <div className="space-y-4">
                          <div className="relative">
                            <User className="absolute left-4 top-4 text-slate-300" size={18}/>
                            <input 
                                type="text" required placeholder="Nama Lengkap Staff"
                                className="w-full border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-blue-600 font-bold"
                                value={formData.full_name}
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-4 top-4 text-slate-300" size={18}/>
                            <input 
                                type="email" required placeholder="Email Login (Harus Unik)"
                                className="w-full border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-blue-600 font-bold"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <X className="absolute left-4 top-4 text-slate-300" size={18}/>
                            <input 
                                type="password" required minLength={6} placeholder="Password (Min. 6 Karakter)"
                                className="w-full border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-blue-600 font-bold"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jabatan Otoritas</label>
                                <select 
                                    required
                                    className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl outline-none focus:border-blue-600 text-xs font-black uppercase appearance-none"
                                    value={formData.role_id}
                                    onChange={e => setFormData({...formData, role_id: e.target.value})}
                                >
                                    <option value="">Pilih Role</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unit Penempatan</label>
                                <select 
                                    className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl outline-none focus:border-blue-600 text-xs font-black uppercase appearance-none"
                                    value={formData.shelter_id}
                                    onChange={e => setFormData({...formData, shelter_id: e.target.value})}
                                >
                                    <option value="">Akses Global</option>
                                    {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                          </div>
                      </div>
                      <button 
                          disabled={saving}
                          className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] flex justify-center items-center gap-4 shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                      >
                          {saving ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Daftarkan Akun Staff</>}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </Layout>
  );
};