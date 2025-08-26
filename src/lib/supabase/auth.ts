import { supabase } from './index';

/**
 * 檢查用戶是否為管理員
 * @param userId 用戶ID
 * @returns 返回是否為管理員
 */
export async function isAdmin(userId: string | undefined) {
  if (!userId) return false;
  
  // 通過檢查特定的管理員表或標記來確定用戶是否為管理員
  // 這裡我們使用簡單的白名單方式，將來可以改為數據庫查詢
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  // 獲取用戶數據
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  return adminEmails.includes(user.email || '');
}

/**
 * 檢查管理員權限
 * 用於客戶端檢查是否有管理員權限
 * @returns 返回是否有管理員權限
 */
export async function checkAdminPermission() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    return await isAdmin(user.id);
  } catch (error) {
    console.error('檢查管理員權限錯誤:', error);
    return false;
  }
}

/**
 * 獲取當前用戶
 * @returns 返回當前用戶或null
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('獲取當前用戶錯誤:', error);
    return null;
  }
}

/**
 * 登出用戶
 * @returns 返回登出結果
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('登出錯誤:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (error) {
    console.error('登出錯誤:', error);
    return { success: false, error };
  }
}