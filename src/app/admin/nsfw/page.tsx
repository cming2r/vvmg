'use client';

import { useEffect, useState, useRef } from 'react';
import { createClientForBrowser } from '@/lib/supabase/index';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ALLOWED_EMAIL = 'ronny314159@gmail.com';
const TABS = ['biru', 'monami'] as const;
type TabKey = (typeof TABS)[number];
const TAB_LABELS: Record<TabKey, string> = { biru: 'Biru', monami: 'Monami' };

interface BunnyVideo {
  guid: string;
  title: string;
  thumbnailUrl: string;
  embedUrl: string;
  length: number;
  status: number;
  dateUploaded: string;
  tags: string[];
}

interface BunnyCollection {
  guid: string;
  name: string;
  videoCount: number;
}

export default function AdminNSFW() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<BunnyVideo[]>([]);
  const [collections, setCollections] = useState<BunnyCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<BunnyVideo | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('biru');
  const [page, setPage] = useState(1);
  const [videosLoading, setVideosLoading] = useState(false);
  const [sortBy, setSortBy] = useState('title_desc');
  const [editingTagVideo, setEditingTagVideo] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tagSaving, setTagSaving] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientForBrowser();

  const PAGE_SIZE = 20;

  // Collect all unique tags from videos
  const allTags = [...new Set(videos.flatMap((v) => v.tags))].sort();

  const fetchCollections = async (lib: TabKey) => {
    try {
      const res = await fetch(`/api/bunny/collections?lib=${lib}`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data.items || []);
      }
    } catch {
      // optional
    }
  };

  const fetchVideos = async (lib: TabKey, collection?: string) => {
    setError(null);
    setVideos([]);
    setActiveVideo(null);
    setPage(1);
    setSelectedTag('');
    setVideosLoading(true);

    try {
      const collectionParam = collection ? `&collection=${collection}` : '';
      const res = await fetch(`/api/bunny/videos?lib=${lib}${collectionParam}`);
      if (!res.ok) {
        setError('Failed to fetch videos');
        return;
      }
      const data = await res.json();
      setVideos(data.items || []);
    } catch {
      setError('Failed to load videos.');
    } finally {
      setVideosLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user?.email === ALLOWED_EMAIL) {
          await Promise.all([fetchVideos('biru'), fetchCollections('biru')]);
        }
      } catch {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editingTagVideo && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [editingTagVideo]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedCollection('');
    setSelectedTag('');
    fetchVideos(tab);
    fetchCollections(tab);
  };

  const handleCollectionChange = (collectionGuid: string) => {
    setSelectedCollection(collectionGuid);
    setSelectedTag('');
    fetchVideos(activeTab, collectionGuid || undefined);
  };

  const handleAddTag = async (video: BunnyVideo) => {
    const newTag = tagInput.trim().toLowerCase();
    if (!newTag || video.tags.includes(newTag)) {
      setTagInput('');
      return;
    }

    setTagSaving(true);
    const newTags = [...video.tags, newTag];

    try {
      const res = await fetch('/api/bunny/videos/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lib: activeTab, videoId: video.guid, tags: newTags }),
      });

      if (res.ok) {
        const updated = { ...video, tags: newTags };
        setVideos((prev) => prev.map((v) => (v.guid === video.guid ? updated : v)));
        if (activeVideo?.guid === video.guid) setActiveVideo(updated);
        setTagInput('');
        setEditingTagVideo(null);
      }
    } catch {
      // ignore
    } finally {
      setTagSaving(false);
    }
  };

  const handleRemoveTag = async (video: BunnyVideo, tagToRemove: string) => {
    const newTags = video.tags.filter((t) => t !== tagToRemove);
    setTagSaving(true);

    try {
      const res = await fetch('/api/bunny/videos/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lib: activeTab, videoId: video.guid, tags: newTags }),
      });

      if (res.ok) {
        const updated = { ...video, tags: newTags };
        setVideos((prev) => prev.map((v) => (v.guid === video.guid ? updated : v)));
        if (activeVideo?.guid === video.guid) setActiveVideo(updated);
      }
    } catch {
      // ignore
    } finally {
      setTagSaving(false);
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

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filtered = selectedTag
    ? videos.filter((v) => v.tags.includes(selectedTag))
    : videos;

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.dateUploaded).getTime() - new Date(b.dateUploaded).getTime();
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      default:
        return new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime();
    }
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-3 self-center pb-2">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="date_desc">Date (Newest)</option>
                  <option value="date_asc">Date (Oldest)</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                </select>
                <span className="text-sm text-gray-500">{filtered.length} videos</span>
              </div>
            </div>

            {/* Collection Filter */}
            {collections.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleCollectionChange('')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCollection === ''
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {collections.map((c) => (
                  <button
                    key={c.guid}
                    onClick={() => handleCollectionChange(c.guid)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCollection === c.guid
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.name} ({c.videoCount})
                  </button>
                ))}
              </div>
            )}

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs text-gray-400">Tags:</span>
                <button
                  onClick={() => { setSelectedTag(''); setPage(1); }}
                  className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                    selectedTag === ''
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(tag); setPage(1); }}
                    className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                      selectedTag === tag
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Video Player */}
            {activeVideo && (
              <div className="mb-8">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`${activeVideo.embedUrl}?autoplay=true`}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setActiveVideo(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close player
                  </button>
                  {/* Tags for active video */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeVideo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700"
                      >
                        {tag}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveTag(activeVideo, tag); }}
                          className="hover:text-red-500"
                          disabled={tagSaving}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {editingTagVideo === activeVideo.guid ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleAddTag(activeVideo); }}
                        className="inline-flex"
                      >
                        <input
                          ref={tagInputRef}
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onBlur={() => setTimeout(() => { setEditingTagVideo(null); setTagInput(''); }, 200)}
                          placeholder="add tag"
                          disabled={tagSaving}
                          className="w-20 text-xs border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </form>
                    ) : (
                      <button
                        onClick={() => setEditingTagVideo(activeVideo.guid)}
                        className="text-xs text-gray-400 hover:text-green-600 px-1.5 py-0.5 rounded-full border border-dashed border-gray-300 hover:border-green-400"
                      >
                        + tag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {videosLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : sorted.length === 0 && !error ? (
              <p className="text-gray-500 text-center py-8">No videos found.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paged.map((video) => (
                    <div
                      key={video.guid}
                      className="rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                    >
                      <div
                        className="relative cursor-pointer"
                        onClick={() => setActiveVideo(video)}
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full aspect-video object-cover bg-gray-100"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.length)}
                        </span>
                      </div>
                      <div className="p-2">
                        <p
                          className="text-sm font-medium text-gray-900 truncate cursor-pointer"
                          onClick={() => setActiveVideo(video)}
                        >
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(video.dateUploaded).toLocaleDateString()}
                        </p>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {video.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0 text-[10px] rounded-full bg-green-100 text-green-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
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
