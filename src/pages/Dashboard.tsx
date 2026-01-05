
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { KpiCard } from '../components/ui/Card';
import {
  Users, ShoppingCart, TrendingUp, Warehouse, ArrowRight,
  Activity, ShieldCheck, AlertTriangle, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getAppConfig } from '../lib/appConfig';
import { Link, useNavigate } from 'react-router-dom';

const SimpleBarChart = () => {
  const data = [35, 60, 45, 72, 50, 85, 95];
  const months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between gap-2 h-48 mt-4">
      {data.map((value, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
          <div className="relative w-full flex justify-end flex-col items-center">
            <div className="w-full max-w-[40px] bg-blue-100 rounded-t-md group-hover:bg-blue-600 transition-all duration-300 relative" style={{ height: `${(value / max) * 100}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">{value}T</div>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{months[i]}</span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(getAppConfig());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ farmers: 0, transactions: 0, volume: 0, shelters: 0 });
  const [recentTrx, setRecentTrx] = useState<any[]>([]);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // Fix: Property 'getUser' does not exist on type 'SupabaseAuthClient'
      const { data } = await (supabase.auth as any).getUser();
      if (!data?.user) setIsDemoAccount(true);
    };
    checkUser();

    const handleUpdate = () => setConfig(getAppConfig());
    window.addEventListener('appConfigChanged', handleUpdate);
    fetchStats();
    return () => window.removeEventListener('appConfigChanged', handleUpdate);
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    // DEMO MODE CHECK
    const isDemo = localStorage.getItem('simultan_demo_mode') === 'true';
    if (isDemo || isDemoAccount) {
      // FAKE DATA FOR DEMO
      setTimeout(() => {
        setStats({ farmers: 125, transactions: 842, volume: 15420, shelters: 5 });
        setRecentTrx([
          { id: 1, quantity: 45, farmers: { name: 'Budi Santoso' }, products: { name: 'Biji Kakao Basah' } },
          { id: 2, quantity: 20, farmers: { name: 'Wayan Gede' }, products: { name: 'Biji Kakao Kering' } },
          { id: 3, quantity: 150, farmers: { name: 'Siti Aminah' }, products: { name: 'Biji Kakao Fermentasi' } },
        ]);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const [farmersRes, trxRes, shelterRes, recentRes] = await Promise.all([
        supabase.from('farmers').select('*', { count: 'exact', head: true }),
        supabase.from('purchase_transactions').select('quantity'),
        supabase.from('shelters').select('*', { count: 'exact', head: true }),
        supabase.from('purchase_transactions').select('*, farmers(name), products(name)').order('transaction_date', { ascending: false }).limit(5)
      ]);

      if (farmersRes.error) throw farmersRes.error;

      const totalVolume = trxRes.data?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0;
      setStats({
        farmers: farmersRes.count || 0,
        transactions: trxRes.data?.length || 0,
        volume: totalVolume,
        shelters: shelterRes.count || 0
      });
      if (recentRes.data) setRecentTrx(recentRes.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // Fallback jika error (misal belum setup DB) -> Kosong atau Mock
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {isDemoAccount && (
        <div className="mb-8 bg-amber-600 text-white p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="shrink-0" />
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Perhatian: Mode Demo Aktif</p>
              <p className="text-xs opacity-90">Anda menggunakan akun demo. Data asli tidak akan muncul sampai Anda mendaftarkan akun staff baru.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/staff/users')}
            className="bg-white text-amber-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 transition-all"
          >
            Buat Akun Asli Sekarang
          </button>
        </div>
      )}

      <div className="mb-8 pt-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Panel Utama</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">ERP SIMULTAN v1.0</p>
        </div>
        <Link
          to="/staff/users"
          className="hidden md:flex items-center gap-3 bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg"
        >
          <ShieldCheck size={16} /> Otoritas User
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Anggota Petani" value={loading ? "..." : stats.farmers} icon={Users} color="blue" />
        <KpiCard title="Total Transaksi" value={loading ? "..." : stats.transactions} icon={ShoppingCart} color="green" />
        <KpiCard title="Volume Masuk (KG)" value={loading ? "..." : stats.volume.toLocaleString('id-ID')} icon={TrendingUp} color="purple" />
        <KpiCard title="Unit Shelter" value={loading ? "..." : stats.shelters} icon={Warehouse} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Analisis Penerimaan Bulanan</h3>
          </div>
          <SimpleBarChart />
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Aktivitas Terbaru</h3>
          <div className="space-y-6 flex-1">
            {loading ? (
              <div className="animate-pulse space-y-4"><div className="h-10 bg-slate-100 rounded-xl"></div><div className="h-10 bg-slate-100 rounded-xl"></div></div>
            ) : recentTrx.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <Activity size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Belum ada transaksi</p>
              </div>
            ) : (
              recentTrx.map((trx) => (
                <div key={trx.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0 border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-all"><Users size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{trx.farmers?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{trx.products?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{trx.quantity}kg</p>
                    <p className="text-[9px] text-slate-400 font-bold">SUCCESS</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/purchases/new" className="mt-8 w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95">
            Input Transaksi <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Layout>
  );
};