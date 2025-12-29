import { supabase } from './index';

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
 * 意見回饋訊息介面
 */
export interface ContactMessage {
  // 回饋內容
  category: 'bug' | 'feature' | 'question' | 'other';
  subject?: string | null;
  message: string;
  notes?: string | null;
  contact_email?: string | null;
  // 來源資訊
  device_id: string;
  app_from: string;
  ip_address?: string | null;
  country_code?: string | null;
  client_info?: ClientInfo | null;
}

/**
 * 將意見回饋儲存到 Supabase
 * @param contact - 意見回饋資料
 * @returns 插入結果
 */
export async function saveContactMessage(contact: ContactMessage) {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        category: contact.category,
        subject: contact.subject || null,
        message: contact.message,
        notes: contact.notes || null,
        contact_email: contact.contact_email || null,
        device_id: contact.device_id,
        app_from: contact.app_from,
        ip_address: contact.ip_address || null,
        country_code: contact.country_code || null,
        client_info: contact.client_info || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase 插入錯誤 (contact_messages):', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('儲存意見回饋失敗:', error);
    throw new Error('Failed to save contact message to database');
  }
}
