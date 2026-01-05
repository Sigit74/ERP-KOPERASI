import { supabase, isConfigured } from './supabase';

export interface AppBrandConfig {
  appName: string;
  appShortName: string;
  orgName: string;
  address: string;
  phone: string;
  email: string;
  accentColor: string;
  logoUrl?: string;
  taxRate?: number;
  receiptFooter?: string;
}

const DEFAULT_CONFIG: AppBrandConfig = {
  appName: 'SIMULTAN',
  appShortName: 'ERP',
  orgName: 'KOPERASI PRODUSEN SIMULTAN',
  address: 'Jl. Raya Koperasi No. 1, Baebunta, Luwu Utara, Sul-Sel',
  phone: '+62 812-3456-7890',
  email: 'admin@simultan.id',
  accentColor: '#2563eb',
  logoUrl: '',
  taxRate: 11,
  receiptFooter: 'Terima Kasih atas kunjungan Anda.'
};

export const getAppConfig = (): AppBrandConfig => {
  const saved = localStorage.getItem('simultan_app_config');
  if (!saved) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    return DEFAULT_CONFIG;
  }
};

export const fetchAppConfigFromDB = async (): Promise<AppBrandConfig> => {
  if (!isConfigured()) return getAppConfig();

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'branding')
      .single();

    if (error) throw error;
    if (data && data.value) {
      localStorage.setItem('simultan_app_config', JSON.stringify(data.value));
      window.dispatchEvent(new Event('appConfigChanged'));
      return data.value as AppBrandConfig;
    }
  } catch (e) {
    console.warn('Failed to fetch config from DB, using local:', e);
  }
  return getAppConfig();
};

export const saveAppConfig = async (config: Partial<AppBrandConfig>) => {
  const current = getAppConfig();
  const updated = { ...current, ...config };

  // 1. Save to LocalStorage for instant UI feedback
  localStorage.setItem('simultan_app_config', JSON.stringify(updated));
  window.dispatchEvent(new Event('appConfigChanged'));

  // 2. Sync to Supabase if configured
  if (isConfigured()) {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'branding', value: updated });
      if (error) throw error;
    } catch (e) {
      console.error('Failed to sync config to DB:', e);
      throw e;
    }
  }
};
