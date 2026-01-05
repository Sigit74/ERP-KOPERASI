
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase, isConfigured } from '../../lib/supabase';
import { ArrowLeft, Save, User, DollarSign } from 'lucide-react';
import { NumberInput } from '../../components/ui/NumberInput';

export const StaffForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        position: '',
        phone: '',
        address: '',
        status: 'active',
        basic_salary: 0,
        allowance: 0,
        join_date: new Date().toISOString().slice(0, 10)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!isConfigured()) {
            setTimeout(() => {
                alert("Mode Demo: Data tersimpan.");
                navigate('/staff');
            }, 500);
            return;
        }

        try {
            const { error } = await supabase.from('coop_staff').insert([formData]);
            if (error) throw error;
            navigate('/staff');
        } catch (err: any) {
            alert("Gagal: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
        }));
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/staff')} className="flex items-center text-slate-500 mb-6 gap-2"><ArrowLeft size={16} /> Kembali</button>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200">
                        <h1 className="text-xl font-bold text-slate-800">Tambah Pengurus / Staff</h1>
                        <p className="text-sm text-slate-500">Input data personalia dan gaji.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Profil Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><User size={16} /> Profil Pegawai</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                    <input required name="full_name" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.full_name} onChange={handleChange} placeholder="Nama Lengkap" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan / Posisi</label>
                                    <input required name="position" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.position} onChange={handleChange} placeholder="Contoh: Ketua, Admin" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">No. HP / WA</label>
                                    <input name="phone" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Domisili</label>
                                    <textarea name="address" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.address} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Bergabung</label>
                                    <input type="date" name="join_date" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={formData.join_date} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select name="status" className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white" value={formData.status} onChange={handleChange}>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Salary Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><DollarSign size={16} /> Komponen Gaji (Bulanan)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gaji Pokok (IDR)</label>
                                    <NumberInput required name="basic_salary" className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-lg font-bold text-slate-700" value={formData.basic_salary || ''} placeholder="0" onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tunjangan Tetap (IDR)</label>
                                    <NumberInput name="allowance" className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-lg font-bold text-slate-700" value={formData.allowance || ''} placeholder="0" onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center text-blue-900">
                                <span className="font-bold text-sm">Total Take Home Pay:</span>
                                <span className="font-mono text-xl font-bold">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format((formData.basic_salary || 0) + (formData.allowance || 0))}
                                </span>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4 flex justify-center gap-2 hover:bg-blue-700 transition-colors">
                            <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Data Pegawai'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};
