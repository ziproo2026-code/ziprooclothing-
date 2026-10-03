import React, { useState } from 'react';
import type { CompanyUpdate, AdminUser } from '../types/index.js';
import { Calendar, Tag, Plus, Edit2, Trash2, CheckCircle2, Sparkles } from 'lucide-react';

interface OurStoryPageProps {
  updates: CompanyUpdate[];
  adminUser: AdminUser | null;
  onAddUpdate: (update: Omit<CompanyUpdate, 'id' | 'createdAt'>) => Promise<void>;
  onEditUpdate: (id: string, update: Partial<CompanyUpdate>) => Promise<void>;
  onDeleteUpdate: (id: string) => Promise<void>;
  onNavigateToShop: () => void;
}

export const OurStoryPage: React.FC<OurStoryPageProps> = ({
  updates,
  adminUser,
  onAddUpdate,
  onEditUpdate,
  onDeleteUpdate,
  onNavigateToShop,
}) => {
  // Modal / form states for admin
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<CompanyUpdate | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CompanyUpdate['category']>('Announcement');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaUploading, setMediaUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartPublish = () => {
    setTitle('');
    setContent('');
    setCategory('Announcement');
    setDate(new Date().toISOString().split('T')[0]);
    setImageUrl('');
    setVideoUrl('');
    setEditingUpdate(null);
    setIsPublishing(true);
  };

  const handleStartEdit = (item: CompanyUpdate) => {
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setDate(item.date);
    setImageUrl(item.imageUrl || '');
    setVideoUrl(item.videoUrl || '');
    setEditingUpdate(item);
    setIsPublishing(true);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    const reader = new FileReader();
    setMediaUploading(true);
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const token = localStorage.getItem('ziproo_admin_token') || sessionStorage.getItem('ziproo_admin_token');
        const res = await fetch('/api/upload-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          if (type === 'image') setImageUrl(data.url);
          else setVideoUrl(data.url);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setMediaUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingUpdate) {
        await onEditUpdate(editingUpdate.id, {
          title,
          content,
          category,
          date,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        });
      } else {
        await onAddUpdate({
          title,
          content,
          category,
          date,
          author: adminUser?.name || 'ZIPROO Team',
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        });
      }
      setIsPublishing(false);
      setEditingUpdate(null);
    } catch (err) {
      console.error('Failed to save update:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header kicker */}
        <div className="mb-12 pb-6 border-b border-zinc-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] font-mono text-[#7c3aed] block mb-2 font-semibold">
              Brand Archive · Est. 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-black font-display uppercase tracking-tight text-zinc-950">
              Our Story & Daily Chronicles
            </h1>
          </div>
          {adminUser && (
            <button
              onClick={handleStartPublish}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Daily Update</span>
            </button>
          )}
        </div>

        {/* 2-SECTION SPLIT LAYOUT AS REQUIRED */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16">
          {/* ================= LEFT SIDE: Daily ZIPROO Updates ================= */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                <span>Daily Atelier Updates & Dispatches</span>
                <span className="text-xs font-mono text-zinc-500 font-normal">
                  ({updates.length} records)
                </span>
              </h2>
            </div>

            {/* Updates Timeline Stream */}
            <div className="space-y-6">
              {updates.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-white border border-zinc-200 text-zinc-500 shadow-sm">
                  <p>No updates published yet.</p>
                </div>
              ) : (
                updates.map((update) => (
                  <article
                    key={update.id}
                    className="p-6 rounded-xl bg-white border border-zinc-200 hover:border-purple-300 transition-all space-y-3 relative group shadow-sm"
                  >
                    {/* Top metadata line: Date and Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-zinc-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" />
                        <span className="font-semibold text-zinc-700">{update.date}</span>
                        <span aria-hidden="true" className="text-zinc-300">·</span>
                        <span className="text-[#7c3aed] font-medium">{update.category}</span>
                      </div>

                      {/* Admin action buttons if logged in */}
                      {adminUser && (
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(update)}
                            className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                            title="Edit update"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(update.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete update"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Headline */}
                    <h3 className="text-lg font-bold text-zinc-950 group-hover:text-purple-700 transition-colors">
                      {update.title}
                    </h3>

                    {/* Content */}
                    <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                      {update.content}
                    </p>

                    {/* Image Attachment */}
                    {update.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-zinc-200 mt-3 max-h-96 bg-zinc-100">
                        <img
                          src={update.imageUrl}
                          alt={update.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-96 object-cover"
                        />
                      </div>
                    )}

                    {/* Video Attachment */}
                    {update.videoUrl && (
                      <div className="rounded-xl overflow-hidden border border-zinc-200 mt-3 bg-black">
                        {update.videoUrl.includes('youtube.com') || update.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={update.videoUrl.replace('watch?v=', 'embed/')}
                            title={update.title}
                            className="w-full aspect-video"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            src={update.videoUrl}
                            className="w-full max-h-96 bg-black"
                            preload="metadata"
                          />
                        )}
                      </div>
                    )}

                    {/* Author tag */}
                    <div className="pt-2 text-[11px] font-mono text-zinc-400">
                      Dispatched by {update.author}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: Large Manifesto & Brand Identity ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit space-y-8">
            <div className="p-8 sm:p-10 rounded-2xl bg-white border border-zinc-200 shadow-xl relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Required large text */}
              <div className="space-y-6">
                <span className="text-xs uppercase tracking-[0.3em] font-mono text-[#7c3aed] font-semibold">
                  ZIPROO Creed
                </span>

                <h2 className="text-4xl sm:text-5xl xl:text-6xl font-black font-display uppercase tracking-tight text-zinc-950 leading-[1.05] text-balance">
                  DON'T FOLLOW THE RULES.
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-purple-600 to-zinc-950">
                    CREATE IT.
                  </span>
                </h2>

                <div className="h-px w-20 bg-[#7c3aed]" />

                <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                  ZIPROO was founded in 2026 out of frustration with disposable, derivative fast-fashion and generic corporate streetwear.
                </p>

                <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                  We believe clothing is not an armor of conformity, but an architecture of sovereignty. Every cut is engineered with intentional proportions: heavyweight draped cotton, functional tension lines, and deep black aesthetics enriched with subtle electric violet codes.
                </p>

                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3 text-sm text-zinc-700">
                    <CheckCircle2 className="w-5 h-5 text-[#7c3aed] shrink-0 mt-0.5" />
                    <span>Pure 100% natural heavy fibers and Portuguese terry</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-700">
                    <CheckCircle2 className="w-5 h-5 text-[#7c3aed] shrink-0 mt-0.5" />
                    <span>Strict limited edition capsules engineered for permanence</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-700">
                    <CheckCircle2 className="w-5 h-5 text-[#7c3aed] shrink-0 mt-0.5" />
                    <span>Direct atelier transparency with daily dispatches</span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={onNavigateToShop}
                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-lg transition-all text-center shadow-xs"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Publish/Edit Modal */}
      {isPublishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <h3 className="text-lg font-bold uppercase font-display text-zinc-950">
                {editingUpdate ? 'Edit Daily Update' : 'Publish Daily Update'}
              </h3>
              <button
                onClick={() => setIsPublishing(false)}
                className="text-zinc-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-700 mb-1 font-semibold">
                  Update Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Capsule 02 Sourcing Milestone"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-700 mb-1 font-semibold">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  >
                    <option value="New Design">New Design</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Progress">Progress</option>
                    <option value="Behind The Scenes">Behind The Scenes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-zinc-700 mb-1 font-semibold">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-zinc-700 mb-1 font-semibold">
                  Content / Progress Report *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe latest design drafts, new releases, material tests, or company achievements..."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#7c3aed] focus:bg-white text-sm"
                />
              </div>

              {/* Media Attachments: Image and Video */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
                <span className="text-xs uppercase font-mono tracking-wider text-purple-700 font-bold block">
                  Media Attachments (Image & Video)
                </span>

                {/* Image Upload */}
                <div>
                  <label className="block text-[11px] font-mono text-zinc-600 mb-1 font-semibold">
                    Atelier Photo / Image (Upload or URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="/src/assets/images/... or https://..."
                      className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
                    />
                    <label className="cursor-pointer px-3 py-2 text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg transition-colors whitespace-nowrap shadow-xs">
                      <span>{mediaUploading ? 'Uploading...' : 'Browse Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'image');
                        }}
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-300">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-black/80 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-[11px] font-mono text-zinc-600 mb-1 font-semibold">
                    Atelier Video Reel / Clip (Upload Video File or Link)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="e.g. /uploads/clip.mp4 or YouTube / Vimeo URL"
                      className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
                    />
                    <label className="cursor-pointer px-3 py-2 text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg transition-colors whitespace-nowrap shadow-xs">
                      <span>{mediaUploading ? 'Uploading...' : 'Browse Video'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'video');
                        }}
                      />
                    </label>
                  </div>
                  {videoUrl && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
                      <span className="truncate max-w-[280px] text-zinc-800 font-mono">{videoUrl}</span>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="text-red-600 hover:text-red-700 font-bold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishing(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mediaUploading}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-all disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingUpdate ? 'Save Changes' : 'Publish Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Admin only) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold uppercase font-display text-zinc-950">
              Delete Daily Chronicle?
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              This update record and associated media will be permanently deleted from the atelier feed. This action is restricted to verified administrators.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletingId) {
                    await onDeleteUpdate(deletingId);
                    setDeletingId(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
