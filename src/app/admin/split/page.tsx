'use client';

import { useEffect, useState } from 'react';
import { createClientForBrowser } from '@/lib/supabase/index';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ALLOWED_EMAIL = 'cming2ring@gmail.com';
const PAGE_SIZE = 20;

interface SplitScan {
  id: string;
  image_urls: string[];
  ocr_result: Record<string, unknown>;
  device_id: string | null;
  country_code: string | null;
  currency_code: string | null;
  add_from: string | null;
  created_at: string;
}

export default function AdminSplit() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<SplitScan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const supabase = createClientForBrowser();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user?.email === ALLOWED_EMAIL) {
          const { data, error } = await supabase
            .from('split_scan')
            .select('id, image_urls, ocr_result, device_id, country_code, currency_code, add_from, created_at')
            .order('created_at', { ascending: false });

          if (error) {
            setError(error.message);
          } else {
            setScans((data as SplitScan[]) || []);
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

  const totalPages = Math.ceil(scans.length / PAGE_SIZE);
  const paged = scans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">WaySplit - Split Scans</h1>
              <span className="text-sm text-gray-500">{scans.length} records</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {scans.length === 0 && !error ? (
              <p className="text-gray-500 text-center py-8">No records found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OCR Result</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paged.map((scan, idx) => (
                        <tr key={scan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="p-0">
                            {scan.image_urls?.length > 0 ? (
                              <div className="flex gap-1 p-1">
                                {scan.image_urls.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 flex-shrink-0">
                                    <img
                                      src={url}
                                      alt={`scan ${i + 1}`}
                                      className="w-full h-full object-cover rounded border"
                                    />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm px-4">No image</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                              {JSON.stringify(scan.ocr_result, null, 2)}
                            </pre>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {scan.country_code || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {scan.currency_code || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {scan.add_from || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {new Date(scan.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
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
