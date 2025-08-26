'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, createClientForBrowser } from '@/lib/supabase/index';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientForBrowser();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 首先嘗試使用我們的函數
        let currentUser = await getCurrentUser();
        console.log('Admin page - getCurrentUser result:', currentUser);
        
        // 如果失敗，直接使用 supabase 客戶端
        if (!currentUser) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUser = user;
          console.log('Admin page - Direct supabase result:', currentUser);
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Admin page - Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出錯誤:', error);
        alert('登出失敗，請稍後再試');
      } else {
        console.log('登出成功');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('登出錯誤:', error);
      alert('登出失敗，請稍後再試');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">管理面板</h1>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                登出
              </button>
            </div>

            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">用戶資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">電子郵件</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.email || '未設置電子郵件'}
                  </p>
                  {!user?.email && (
                    <p className="mt-1 text-xs text-red-500">
                      調試: user object = {JSON.stringify(user, null, 2)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">用戶ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">註冊時間</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleString('zh-TW') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">最後登入</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-TW') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-700">管理功能</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">用戶管理</h3>
                  <p className="text-sm text-gray-600 mb-3">管理系統用戶</p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors">
                    進入管理
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">系統設定</h3>
                  <p className="text-sm text-gray-600 mb-3">配置系統參數</p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors">
                    進入設定
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">日誌查看</h3>
                  <p className="text-sm text-gray-600 mb-3">查看系統日誌</p>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors">
                    查看日誌
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}