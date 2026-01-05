
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';
import { getAppConfig } from '../lib/appConfig';
import { Lock, Mail, Settings, Loader2, User, Database, CheckCircle, Smartphone } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(getAppConfig());
  const [mode, setMode] = useState<'staff' | 'member'>('staff');

  // Staff Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Member Auth
  const [memberName, setMemberName] = useState('');
  const [memberNik, setMemberNik] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setConfig(getAppConfig());
    window.addEventListener('appConfigChanged', handleUpdate);

    // Check DB Config persistence
    if (localStorage.getItem('simultan_sb_url')) {
      setDbConnected(isConfigured());
    }

    return () => window.removeEventListener('appConfigChanged', handleUpdate);
  }, []);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await (supabase.auth as any).signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        if (email === 'admin@demo.com' && password === 'demo') {
          localStorage.setItem('simultan_demo_mode', 'true');
          alert("Mode Demo Aktif: Data yang tampil adalah data dummy.");
          navigate('/dashboard');
          return;
        }
        throw authError;
      }

      if (data.user) {
        localStorage.removeItem('simultan_demo_mode');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('fetch') || err.message.includes('FetchError') || err.message.includes('failed to fetch'))) {
        setError('🌐 Gagal terhubung ke Database.\n\nKemungkinan penyebab:\n1. Project Supabase sedang PAUSED (Silakan Restore di Supabase Dashboard).\n2. Konfigurasi URL/Key di menu Settings salah.\n3. Koneksi internet terganggu.');
      } else {
        setError(err.message || 'Gagal login. Periksa email & password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Cari petani berdasarkan NIK (Case insensitive search logic could be added but exact match is faster)
      const { data, error } = await supabase
        .from('farmers')
        .select('id, name, group_id')
        .eq('nik', memberNik.trim())
        .ilike('name', `%${memberName.trim()}%`)
        .single();

      if (error || !data) {
        throw new Error("Data anggota tidak ditemukan. Pastikan NIK dan Nama sesuai.");
      }

      // Sukses Login Anggota
      localStorage.setItem('simultan_member_session', JSON.stringify(data));
      alert(`Selamat datang, ${data.name}!`);
      navigate('/dashboard'); // Nanti bisa diarahkan ke dashboard khusus member
    } catch (err: any) {
      setError(err.message || "Gagal login anggota.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
      });

      if (resetError) throw resetError;
      setSuccess('Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk (atau spam).');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim permintaan reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full -ml-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full -mr-48 -mb-48 blur-3xl"></div>

      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-in border border-white/20 relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
            ) : (
              <div className="bg-blue-600 w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-blue-900/30">
                <span className="text-white font-black text-xl uppercase">{config.appShortName.charAt(0)}</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{config.appName}</h1>

          {dbConnected ? (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-green-600 bg-green-50 w-fit mx-auto px-3 py-1 rounded-full">
              <CheckCircle size={10} className="stroke-[3]" />
              <span className="text-[9px] font-black uppercase tracking-widest">Database Terhubung</span>
            </div>
          ) : (
            <p className="text-slate-400 mt-2 font-bold uppercase text-[9px] tracking-[0.2em]">Sistem Manajemen Terpadu</p>
          )}

          {isForgotMode && (
            <div className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Mode Reset Kata Sandi
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
          <button
            onClick={() => setMode('staff')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${mode === 'staff' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Lock size={14} /> Staff Admin
          </button>
          <button
            onClick={() => setMode('member')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${mode === 'member' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Smartphone size={14} /> Anggota
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-bold mb-6 border border-red-100 flex items-center gap-3 animate-shake">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-[10px] font-bold mb-6 border border-green-100 flex items-center gap-3 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0"></div>
            {success}
          </div>
        )}

        {mode === 'staff' ? (
          isForgotMode ? (
            <form onSubmit={handleResetRequest} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-700"
                    placeholder="nama@koperasi.org"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20 uppercase text-[10px] tracking-[0.2em] active:scale-95 flex justify-center items-center gap-2"
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> Mengirim...</> : 'Kirim Tautan Reset'}
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setSuccess(''); setError(''); }}
                className="w-full text-slate-400 font-black py-2 rounded-2xl transition-all uppercase text-[9px] tracking-[0.2em] active:scale-95 flex justify-center items-center gap-2"
              >
                Kembali ke Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Staff</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-700"
                    placeholder="nama@koperasi.org"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(true); setSuccess(''); setError(''); }}
                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20 uppercase text-[10px] tracking-[0.2em] active:scale-95 flex justify-center items-center gap-2"
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> Verifikasi...</> : 'Masuk Dashboard'}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleMemberLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-300" size={18} />
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-700"
                  placeholder="Sesuai KTP..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nomor Induk (NIK)</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-3.5 text-slate-300" size={18} />
                <input
                  type="text"
                  value={memberNik}
                  onChange={(e) => setMemberNik(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-700"
                  placeholder="16 Digit NIK"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-blue-600/30 uppercase text-[10px] tracking-[0.2em] active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? <><Loader2 className="animate-spin" size={16} /> Mencari Data...</> : 'Akses Anggota'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            <Settings size={14} /> Konfigurasi Server
          </button>
        </div>
      </div>
      <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};