
import React, { PropsWithChildren, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden lg:pl-0">
        
        {/* Mobile Header (Visible only on small screens) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between lg:hidden shrink-0 z-30">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               <Menu size={24} />
             </button>
             <span className="font-bold text-lg text-slate-800">SIMULTAN ERP</span>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
            A
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-6xl mx-auto pb-20 lg:pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
