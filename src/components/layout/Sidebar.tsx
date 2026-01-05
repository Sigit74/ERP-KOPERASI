
import React, { useState } from 'react';
/* NavLink and useLocation are essential for routing and active state tracking */
import { NavLink, useLocation } from 'react-router-dom';
/* Importing used icons from lucide-react library */
import {
  LayoutDashboard, Users, ShoppingCart, Package,
  Warehouse, FileText, Settings as SettingsIcon, LogOut,
  ChevronRight, Map, Factory, CreditCard, ShieldCheck,
  Smartphone, Terminal, Database, BookOpen, Scale, Truck, UserCircle,
  MapPin, HandCoins, RefreshCw, ChevronDown, Wallet, Building
} from 'lucide-react';
import { logout } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/* Sidebar component for centralized navigation */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  // Initialize with localStorage or default open groups
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar_open_groups');
    return saved ? JSON.parse(saved) : ['Menu Utama', 'Keuangan & HR'];
  });

  // Save to localStorage whenever openGroups changes
  React.useEffect(() => {
    localStorage.setItem('sidebar_open_groups', JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => {
      const newGroups = prev.includes(groupTitle)
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle];
      return newGroups;
    });
  };

  /* Configuration for sidebar menu grouping */
  const menuGroups = [
    {
      title: 'Menu Utama',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Peta Sebaran', path: '/map/farmers', icon: Map },
        { name: 'Deployment', path: '/docs/overview', icon: Database },
      ]
    },
    {
      title: 'Operasional',
      items: [
        { name: 'Data Petani', path: '/farmers', icon: Users },
        { name: 'Kelompok Tani', path: '/groups', icon: UserCircle },
        { name: 'Data Wilayah', path: '/master/regional', icon: MapPin },
        { name: 'Pembelian Panen', path: '/purchases', icon: ShoppingCart },
        { name: 'Produksi (Batch)', path: '/production', icon: Factory },
      ]
    },
    {
      title: 'Inventory & Sales',
      items: [
        { name: 'Kartu Stok', path: '/inventory', icon: Package },
        { name: 'Master Produk', path: '/products', icon: BookOpen },
        { name: 'Unit Shelter', path: '/shelters', icon: Warehouse },
        { name: 'Toko Retail', path: '/sales/retail', icon: ShoppingCart },
        { name: 'Penjualan B2B', path: '/sales/commodity', icon: Truck },
        { name: 'Kelola Lot', path: '/production/lots', icon: Package },
      ]
    },
    {
      title: 'Keuangan & HR',
      items: [
        { name: 'Simpanan Anggota', path: '/finance/savings', icon: CreditCard },
        { name: 'Pinjaman Anggota', path: '/finance/loans', icon: HandCoins },
        { name: 'Biaya & Operasional', path: '/finance/operational', icon: Wallet },
        { name: 'Aset Tetap & Inventaris', path: '/inventory/fixed-assets', icon: Building },
        { name: 'Staff & Pengurus', path: '/staff', icon: Users },
        { name: 'Chart of Accounts', path: '/accounting/coa', icon: BookOpen },
        { name: 'Jurnal Umum', path: '/accounting/journals', icon: Scale },
        { name: 'Buku Besar', path: '/accounting/ledger', icon: BookOpen },
        { name: 'Laba Rugi', path: '/accounting/income-statement', icon: FileText },
        { name: 'Neraca', path: '/accounting/balance-sheet', icon: Scale },
        { name: 'Arus Kas', path: '/accounting/cash-flow', icon: RefreshCw },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { name: 'Konfigurasi', path: '/settings', icon: SettingsIcon },
        { name: 'SQL Script', path: '/docs/database', icon: ShieldCheck },
        { name: 'Android Blueprint', path: '/docs/mobile-logic', icon: Smartphone },
        { name: 'User & Otoritas', path: '/staff/users', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="h-full flex flex-col">
        <div className="p-4 flex items-center gap-3 shrink-0 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/50">
            S
          </div>
          <div>
            <h1 className="text-white font-black tracking-tighter text-xl leading-none">SIMULTAN</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cooperative ERP</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
          {menuGroups.map((group, idx) => {
            const isOpen = openGroups.includes(group.title);
            return (
              <div key={idx} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    size={14}
                    className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-0.5 mt-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                        className={({ isActive }) => `
                          flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all
                          ${isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon size={16} />
                          <span>{item.name}</span>
                        </div>
                        {location.pathname === item.path && <ChevronRight size={12} />}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
