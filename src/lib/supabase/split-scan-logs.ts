import { supabase } from './index';

export interface SplitScanLog {
  image_urls: string[];
  ocr_result: object;
  device_id?: string | null;
  country_code?: string | null;
  currency_code?: string | null;
  add_from?: string | null;
  ip_address?: string | null;
}

export async function logSplitScan(log: SplitScanLog) {
  try {
    const { data, error } = await supabase
      .from('split_scan')
      .insert({
        image_urls: log.image_urls,
        ocr_result: log.ocr_result,
        device_id: log.device_id || null,
        country_code: log.country_code || null,
        currency_code: log.currency_code || null,
        add_from: log.add_from || null,
        ip_address: log.ip_address || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Split Scan Log] Supabase 插入錯誤:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[Split Scan Log] 記錄失敗:', error);
  }
}
