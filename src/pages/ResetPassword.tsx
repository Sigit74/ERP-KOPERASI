
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getAppConfig } from '../lib/appConfig';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const config = getAppConfig();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if we have a session (Supabase handles the recovery link automatically by logging the user in)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Tautan reset tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.');
            }
        };
        checkSession();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Konfirmasi kata sandi tidak cocok.');
        }
        if (password.length < 6) {
            return setError('Kata sandi minimal 6 karakter.');
        }

        setLoading(true);
        setError('');

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Gagal memperbarui kata sandi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full -ml-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full -mr-48 -mb-48 blur-3xl"></div>

            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20 relative z-10">
                <div className="text-center mb-8">
                    <div className="bg-blue-600 w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-blue-900/30 mx-auto mb-4">
                        <ShieldCheck className="text-white" size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Setel Ulang Kata Sandi</h1>
                    <p className="text-slate-400 mt-2 font-bold uppercase text-[9px] tracking-[0.2em]">{config.appName}</p>
                </div>

                {success ? (
                    <div className="text-center py-8 animate-fade-in">
                        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-600" size={40} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">Berhasil!</h2>
                        <p className="text-slate-500 text-sm font-medium mb-8">Kata sandi Anda telah diperbarui. Mengalihkan ke halaman login...</p>
                        <button
                            onClick={() => navigate('/')}
                            className="text-blue-600 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={14} /> Ke Halaman Login Sekarang
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-bold border border-red-100 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kata Sandi Baru</label>
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

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konfirmasi Kata Sandi</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {loading ? <><Loader2 className="animate-spin" size={16} /> Sedang Menyimpan...</> : 'Simpan Kata Sandi'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full text-slate-400 font-black py-2 rounded-2xl transition-all uppercase text-[9px] tracking-[0.2em] active:scale-95 flex justify-center items-center gap-2"
                        >
                            Batal
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
