import { supabase } from './index';
import { HealthOCRResult } from '@/services/ocr/health-ocr';

/**
 * 健康掃描記錄介面
 */
export interface HealthScan {
  image_url: string;
  ocr_result: HealthOCRResult;
  country_code?: string | null;
  device_type?: string | null;
  add_from?: string | null;
  ip_address?: string | null;
}

/**
 * 將 OCR 結果記錄到 Supabase
 * @param log - 健康掃描記錄資料
 * @returns 插入結果
 */
export async function logOCRHealth(log: HealthScan) {
  try {
    const { data, error } = await supabase
      .from('health-scan')
      .insert({
        image_url: log.image_url,
        ocr_result: log.ocr_result,
        country_code: log.country_code || null,
        device_type: log.device_type || null,
        add_from: log.add_from || null,
        ip_address: log.ip_address || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase 插入錯誤:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('記錄 OCR 日誌失敗:', error);
    throw new Error('Failed to log OCR result to database');
  }
}
