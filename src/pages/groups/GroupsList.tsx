
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { Plus, Users, Trash2, Edit, Eye } from 'lucide-react';

const MOCK_GROUPS = [
    { id: '1', name: 'Tani Makmur (Demo)', leader_name: 'Bpk. Budi', location: 'Desa A' },
    { id: '2', name: 'Tani Sejahtera (Demo)', leader_name: 'Ibu Siti', location: 'Desa B' },
];

export const GroupsList = () => {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

    useEffect(() => {
        const fetch = async () => {
            if (!isConfigured()) {
                setGroups(MOCK_GROUPS);
                return;
            }
            try {
                const { data, error } = await supabase.from('farmer_groups').select('*');
                if (error) throw error;
                if (data) setGroups(data);
            } catch (err) {
                console.warn(err);
                setGroups(MOCK_GROUPS);
            }
        }
        fetch();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus kelompok ini?")) return;
        if (!isConfigured()) {
            setGroups(prev => prev.filter(g => g.id !== id));
            return;
        }
        await supabase.from('farmer_groups').delete().eq('id', id);
        window.location.reload();
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Kelompok Tani</h1>
                <Link to="/groups/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center">
                    <Plus size={16} /> Tambah Kelompok
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Nama Kelompok</th>
                            <th className="px-6 py-4">Ketua</th>
                            <th className="px-6 py-4">Lokasi</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {groups.map(g => (
                            <tr key={g.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                    <Users size={16} className="text-blue-500" /> {g.name}
                                </td>
                                <td className="px-6 py-4">{g.leader_name}</td>
                                <td className="px-6 py-4">{g.location}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => setSelectedGroup(g)} className="text-slate-500 p-2 hover:bg-slate-100 rounded" title="Lihat"><Eye size={16} /></button>
                                    <Link to={`/groups/edit/${g.id}`} className="text-blue-500 p-2 hover:bg-blue-50 rounded" title="Edit"><Edit size={16} /></Link>
                                    <button onClick={() => handleDelete(g.id)} className="text-red-500 p-2 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DETAIL MODAL */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{selectedGroup.name}</h3>
                                <p className="text-sm text-slate-500 font-mono">{selectedGroup.code || 'No Code'}</p>
                            </div>
                            <button onClick={() => setSelectedGroup(null)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ketua Kelompok</p>
                                <p className="font-bold text-slate-700">{selectedGroup.leader_name}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Lokasi / Wilayah</p>
                                <p className="font-bold text-slate-700">{selectedGroup.location}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setSelectedGroup(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
