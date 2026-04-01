'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, createClientForBrowser } from '@/lib/supabase/index';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ALLOWED_EMAILS = ['cming2ring@gmail.com', 'ronny314159@gmail.com'];

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
        console.error('Sign out error:', error);
        alert('Sign out failed. Please try again later.');
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Sign out failed. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !ALLOWED_EMAILS.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops, this page is private</h1>
            <p className="text-gray-600">It looks like you don&apos;t have access here. If you think this is a mistake, reach out to the admin.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const email = user.email;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>

            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">User Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Sign In</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-700">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {email === 'cming2ring@gmail.com' && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">PicHealth</h3>
                      <p className="text-sm text-gray-600 mb-3">View health scan records</p>
                      <a href="/admin/pichealth" className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors text-center">
                        Open
                      </a>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">WaySplit</h3>
                      <p className="text-sm text-gray-600 mb-3">View split scan records</p>
                      <a href="/admin/split" className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors text-center">
                        Open
                      </a>
                    </div>
                  </>
                )}

                {email === 'ronny314159@gmail.com' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Videos</h3>
                    <p className="text-sm text-gray-600 mb-3">Browse video library</p>
                    <a href="/admin/nsfw" className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition-colors text-center">
                      Open
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}