
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { MapViewer } from '../../components/ui/MapViewer';
import { Search, Loader2 } from 'lucide-react';

export const FarmerMap = () => {
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    if (!isConfigured()) {
        // Mock Data for Demo
        setTimeout(() => {
            const mockFarms = [
                { 
                    id: 'f1', name: 'Kebun Utara', size_hectares: 1.5, farmer_name: 'Budi Santoso', group_name: 'KT Harapan Jaya',
                    polygon_json: { type: "Polygon", coordinates: [[[120.10, -2.55], [120.11, -2.55], [120.11, -2.56], [120.10, -2.56], [120.10, -2.55]]] }
                },
                { 
                    id: 'f2', name: 'Lahan Timur', size_hectares: 2.0, farmer_name: 'Siti Aminah', group_name: 'KT Sejahtera',
                    polygon_json: { type: "Polygon", coordinates: [[[120.12, -2.54], [120.13, -2.54], [120.13, -2.55], [120.12, -2.55], [120.12, -2.54]]] }
                }
            ];
            setFarms(mockFarms);
            setFilteredFarms(mockFarms);
            setLoading(false);
        }, 800);
        return;
    }

    try {
        // Fetch Farms joined with Farmers and Groups
        const { data, error } = await supabase
            .from('farms')
            .select(`
                *,
                farmers!inner (
                    name,
                    farmer_groups (name)
                )
            `);
        
        if (error) throw error;

        const formatted = data?.map((f: any) => ({
            ...f,
            farmer_name: f.farmers?.name,
            group_name: f.farmers?.farmer_groups?.name
        })) || [];

        setFarms(formatted);
        setFilteredFarms(formatted);
    } catch (err: any) {
        console.error("Map fetch error:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
      // Filtering Logic
      if (!search) {
          setFilteredFarms(farms);
      } else {
          const lowerQ = search.toLowerCase();
          const filtered = farms.filter(f => 
              (f.farmer_name || '').toLowerCase().includes(lowerQ) ||
              (f.group_name || '').toLowerCase().includes(lowerQ)
          );
          setFilteredFarms(filtered);
      }
  }, [search, farms]);

  // Prepare Map Polygons
  const mapPolygons = filteredFarms.map(f => ({
      coordinates: f.polygon_json,
      title: `<div class='text-center'><b>${f.farmer_name}</b><br/>${f.group_name}<br/>Luas: ${f.size_hectares} Ha</div>`,
      label: `${f.farmer_name}\n${f.size_hectares} Ha`,
      color: '#2563eb' // Blue
  })).filter(p => p.coordinates);

  return (
    <Layout>
      <div className="relative h-[80vh] w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
        
        {/* Floating Search Container - Lower Z-Index */}
        <div className="absolute top-4 left-4 z-10 w-full max-w-sm flex flex-col gap-2">
            
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex items-center overflow-hidden">
                <div className="pl-3 text-slate-400">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Cari Petani atau Kelompok..." 
                    className="flex-1 outline-none text-sm py-3 px-3 text-slate-700 placeholder:text-slate-400"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">✕</button>
                )}
            </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <span className="text-slate-600 font-semibold">Memuat Peta Sebaran...</span>
            </div>
        )}
        
        {/* Map Component */}
        <MapViewer 
            center={[-2.55, 120.10]} 
            zoom={11} 
            polygons={mapPolygons}
            markers={[]} // No markers as requested
            fitBounds={true} // Smart Zoom enabled
        />
      </div>
    </Layout>
  );
};
