'use client';

import { useEffect, useState } from 'react';
import { createClientForBrowser } from '@/lib/supabase/index';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ALLOWED_EMAIL = 'cming2ring@gmail.com';
const PAGE_SIZE = 20;

interface HealthSummary {
  id: string;
  health_data: Record<string, unknown> | null;
  user_profile: Record<string, unknown> | null;
  custom_note: string | null;
  summary_result: Record<string, unknown>;
  device_id: string | null;
  remaining_credits: number | null;
  country_code: string | null;
  client_info: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminPicHealthSummary() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<HealthSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClientForBrowser();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user?.email === ALLOWED_EMAIL) {
          const { data, error } = await supabase
            .from('health_summary')
            .select('id, health_data, user_profile, custom_note, summary_result, device_id, remaining_credits, country_code, client_info, created_at')
            .order('created_at', { ascending: false });

          if (error) {
            setError(error.message);
          } else {
            setSummaries((data as HealthSummary[]) || []);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [supabase]);

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

  if (!user || user.email !== ALLOWED_EMAIL) {
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

  const totalPages = Math.ceil(summaries.length / PAGE_SIZE);
  const paged = summaries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PicHealth - Health Summaries</h1>
                <a href="/admin/pichealth" className="text-sm text-blue-600 hover:text-blue-500">
                  &larr; Back to Scans
                </a>
              </div>
              <span className="text-sm text-gray-500">{summaries.length} records</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {summaries.length === 0 && !error ? (
              <p className="text-gray-500 text-center py-8">No records found.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {paged.map((item, idx) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      <div
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400 w-8">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {item.device_id ? item.device_id.slice(0, 12) + '...' : 'Unknown device'}
                            </span>
                            <span className="text-sm text-gray-500 ml-3">
                              {item.country_code || '-'}
                            </span>
                            {item.remaining_credits !== null && (
                              <span className="text-xs text-gray-400 ml-3">
                                Credits: {item.remaining_credits}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                          <span className="text-gray-400">
                            {expandedId === item.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {expandedId === item.id && (
                        <div className="px-4 py-4 space-y-4 text-sm">
                          {item.custom_note && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Note</h4>
                              <p className="text-gray-600">{item.custom_note}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Health Data</h4>
                              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                                {item.health_data ? JSON.stringify(item.health_data, null, 2) : 'N/A'}
                              </pre>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">User Profile</h4>
                              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                                {item.user_profile ? JSON.stringify(item.user_profile, null, 2) : 'N/A'}
                              </pre>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Summary Result</h4>
                            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                              {JSON.stringify(item.summary_result, null, 2)}
                            </pre>
                          </div>

                          {item.client_info && Object.keys(item.client_info).length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-1">Client Info</h4>
                              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded">
                                {JSON.stringify(item.client_info, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
