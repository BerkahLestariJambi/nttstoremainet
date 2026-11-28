'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Save,
  Eye,
  Edit3,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Heading2,
  List,
  Bold,
  Type,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface LegalDoc {
  id?: number;
  slug: string;
  title: string;
  version: string;
  content: string;
  updated_at?: string;
}

export default function AdminLegalEditorPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  const [activeSlug, setActiveSlug] = useState<'privacy-policy' | 'terms-of-service'>(
    'privacy-policy'
  );
  const [docsMap, setDocsMap] = useState<Record<string, LegalDoc>>({});
  const [title, setTitle] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0');
  const [content, setContent] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    for (const store of [window.localStorage, window.sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        const val = store.getItem(key);
        if (!val) continue;
        if (/^\d+\|[A-Za-z0-9]{20,}$/.test(val.trim()) || val.trim().startsWith('eyJ')) {
          return val.replace(/^Bearer\s+/i, '').trim();
        }
        if (val.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(val);
            const tok =
              parsed?.token ||
              parsed?.access_token ||
              parsed?.api_token ||
              parsed?.data?.token;
            if (typeof tok === 'string' && tok.length > 10) {
              return tok.replace(/^Bearer\s+/i, '').trim();
            }
          } catch {}
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchAllDocs = async () => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/admin/legal`, {
          headers,
          credentials: 'include',
        });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const map: Record<string, LegalDoc> = {};
          for (const item of json.data) {
            map[item.slug] = item;
          }
          setDocsMap(map);

          const initial = map['privacy-policy'];
          if (initial) {
            setTitle(initial.title);
            setVersion(initial.version);
            setContent(initial.content);
            setLastUpdated(initial.updated_at || '');
          }
        }
      } catch (err) {
        console.error('Gagal memuat dokumen admin:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDocs();
  }, [API_BASE_URL]);

  const handleSelectTab = (slug: 'privacy-policy' | 'terms-of-service') => {
    setActiveSlug(slug);
    setPreviewMode(false);
    const selected = docsMap[slug];
    if (selected) {
      setTitle(selected.title);
      setVersion(selected.version);
      setContent(selected.content);
      setLastUpdated(selected.updated_at || '');
    } else {
      setTitle(
        slug === 'privacy-policy'
          ? 'Kebijakan Privasi (Privacy Policy) — NTTStorePi'
          : 'Syarat & Ketentuan Layanan (Terms of Service) — NTTStorePi'
      );
      setVersion('1.0');
      setContent('');
      setLastUpdated('');
    }
  };

  // Helper sisipkan template HTML cepat pada posisi kursor textarea
  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}\n${snippet}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = content.substring(0, start) + snippet + content.substring(end);
    setContent(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 20);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      Swal.fire('Data Belum Lengkap', 'Judul dan isi dokumen wajib diisi.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/admin/legal/${activeSlug}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          version: version.trim() || '1.0',
          content,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal menyimpan perubahan.');
      }

      setDocsMap((prev) => ({
        ...prev,
        [activeSlug]: json.data,
      }));
      setLastUpdated(json.data?.updated_at || '');

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan!',
        text: 'Perubahan dokumen langsung aktif di halaman publik.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan', err?.message || 'Periksa hak akses admin Anda.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              Kelola Kebijakan Privasi &amp; Syarat Layanan
            </h1>
            <p className="text-xs text-gray-500">
              Perbarui dokumen kepatuhan Pi Network Mainnet &amp; UU PDP kapan saja.
            </p>
          </div>
        </div>

        <Link
          href={`/${activeSlug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold"
        >
          <span>Lihat Halaman Publik</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tab Pilihan Dokumen */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => handleSelectTab('privacy-policy')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
              activeSlug === 'privacy-policy'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Kebijakan Privasi (Privacy Policy)
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('terms-of-service')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
              activeSlug === 'terms-of-service'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Syarat &amp; Ketentuan (Terms)
          </button>
        </div>

        {lastUpdated && (
          <span className="text-[11px] text-gray-500 font-medium">
            Terakhir disimpan:{' '}
            {new Date(lastUpdated).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center gap-3 text-gray-500 border border-gray-100">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <p className="text-xs font-semibold">Memuat editor dokumen...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Judul Dokumen *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Versi Dokumen
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 1.1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Toolbar Format Cepat & Switch Edit / Pratinjau */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!previewMode ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertSnippet('\n<h2>Judul Bagian Baru</h2>\n')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Heading2 className="w-3.5 h-3.5" /> Subjudul
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('\n<p>Tulis paragraf di sini...</p>\n')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5" /> Paragraf
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '\n<ul>\n  <li><strong>Poin 1:</strong> Keterangan</li>\n  <li><strong>Poin 2:</strong> Keterangan</li>\n</ul>\n'
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <List className="w-3.5 h-3.5" /> Daftar Poin
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<strong>Teks Tebal</strong>')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5" /> Tebal
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-700">
                  Mode Pratinjau Tampilan Publik
                </span>
              )}

              <div className="flex gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    !previewMode ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    previewMode ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Pratinjau
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="min-h-[380px] p-6 rounded-2xl border border-gray-200 bg-gray-50/50">
                <article
                  className="prose prose-sm max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-ul:list-disc prose-ul:pl-5"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                rows={16}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 rounded-2xl border border-gray-200 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Menyimpan...' : 'Simpan & Publikasikan Sekarang'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
