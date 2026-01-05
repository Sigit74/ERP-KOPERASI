
import { createClient } from '@supabase/supabase-js';

/**
 * DATA DARI DASHBOARD ANDA (Berdasarkan Screenshot):
 */
// 1. URL Proyek Anda (Sudah saya isi sesuai ID di browser Anda)
// 1. Cek local storage terlebih dahulu
const storedUrl = localStorage.getItem('simultan_sb_url');
const storedKey = localStorage.getItem('simultan_sb_key');

// 2. Default data (Fallback jika Settings belum diisi)
const DEFAULT_URL = 'https://prrtyuwfylbayyybmdqs.supabase.co';
const DEFAULT_KEY = 'sb_publishable_NbyB_duJem3zV5ZU-YdJ_w_-emrkRQI';

const SUPABASE_URL = storedUrl || DEFAULT_URL;
const SUPABASE_ANON_KEY = storedKey || DEFAULT_KEY;

// Inisialisasi koneksi (Gunakan try-catch agar tidak crash jika URL invalid)
let client;
try {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("Invalid Supabase URL, fallback to default");
  client = createClient(DEFAULT_URL, DEFAULT_KEY);
}

export const supabase = client;

/**
 * Mengecek apakah user sudah memasukkan kunci asli
 */
export const isConfigured = () => {
  return !SUPABASE_ANON_KEY.includes('PASTE_KODE');
};

/**
 * Fungsi Logout Aman
 */
export const logout = async () => {
  try {
    await (supabase.auth as any).signOut();

    // Bersihkan data lokal
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('simultan')) {
        localStorage.removeItem(key);
      }
    });

    window.location.hash = '/';
    window.location.reload();
  } catch (err) {
    console.error("Logout Error:", err);
    window.location.hash = '/';
    window.location.reload();
  }
};

// Update via menu settings di dalam app jika perlu
export const updateSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('simultan_sb_url', url);
  localStorage.setItem('simultan_sb_key', key);
};
