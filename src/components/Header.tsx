'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientForBrowser } from '@/lib/supabase/index';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientForBrowser();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes
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
        console.error('Sign out error:', error);
        alert('Sign out failed. Please try again later.');
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Sign out failed. Please try again later.');
    }
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex justify-between items-center">
        <a href="/" className="text-lg font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors">
          VVMG
        </a>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded-lg"></div>
          ) : user ? (
            <>
              <a
                href="/admin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
              >
                Admin
              </a>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
