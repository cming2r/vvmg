'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientForBrowser } from '@/lib/supabase/index';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientForBrowser();

  useEffect(() => {
    // 獲取當前用戶
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出錯誤:', error);
        alert('登出失敗，請稍後再試');
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('登出錯誤:', error);
      alert('登出失敗，請稍後再試');
    }
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <header className="bg-gray-100 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">VVMG</h1>
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/admin'}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
              >
                管理頁面
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            >
              登入
            </button>
          )}
        </div>
      </div>
    </header>
  );
}