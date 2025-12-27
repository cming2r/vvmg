import { supabase } from './index';
import { HealthOCRResult } from '@/services/ocr/health-ocr';

/**
 * 健康掃描記錄介面
 */
export interface HealthScan {
  image_url: string;
  ocr_result: HealthOCRResult;
  device_id?: string | null;
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
/**
 * 客戶端資訊介面
 */
export interface ClientInfo {
  os?: string;
  device?: string;
  browser?: string;
  [key: string]: unknown;
}

/**
 * 健康摘要記錄介面
 */
export interface HealthSummaryLog {
  // 輸入
  health_data?: object | null;
  user_profile?: object | null;
  custom_note?: string | null;
  // 輸出
  summary_result: object;
  // 用戶資料
  device_id?: string | null;
  remaining_credits?: number | null;
  ip_address?: string | null;
  country_code?: string | null;
  client_info?: ClientInfo | null;
}

/**
 * 將健康摘要結果記錄到 Supabase
 * @param log - 健康摘要記錄資料
 * @returns 插入結果
 */
export async function logHealthSummary(log: HealthSummaryLog) {
  try {
    const { data, error } = await supabase
      .from('pichealth_summary')
      .insert({
        health_data: log.health_data || null,
        user_profile: log.user_profile || null,
        custom_note: log.custom_note || null,
        summary_result: log.summary_result,
        device_id: log.device_id || null,
        remaining_credits: log.remaining_credits ?? null,
        ip_address: log.ip_address || null,
        country_code: log.country_code || null,
        client_info: log.client_info || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase 插入錯誤 (健康摘要):', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('記錄健康摘要失敗:', error);
    throw new Error('Failed to log health summary to database');
  }
}

export async function logOCRHealth(log: HealthScan) {
  try {
    const { data, error } = await supabase
      .from('health_scan')
      .insert({
        image_url: log.image_url,
        ocr_result: log.ocr_result,
        device_id: log.device_id || null,
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
