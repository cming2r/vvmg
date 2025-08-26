import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 創建 Supabase 客戶端實例
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// 創建瀏覽器端 Supabase 客戶端實例 (支持 Auth 功能)
export function createClientForBrowser() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

// 向後兼容的導出
export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

// 從其他文件導入所有 Supabase 功能
import { 
  isAdmin, 
  checkAdminPermission,
  getCurrentUser,
  signOut
} from './auth';

// 重新導出所有函數
export {
  // 身份驗證和管理員功能
  isAdmin,
  checkAdminPermission,
  getCurrentUser,
  signOut
};