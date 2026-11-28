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
  Italic,
  Sparkles,
  Globe,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { LANGUAGES, LanguageCode } from '@/lib/translations';

interface LegalDoc {
  id?: number;
  slug: string;
  version: string;
  title: string;
  title_en?: string | null;
  title_zh?: string | null;
  title_ja?: string | null;
  title_ar?: string | null;
  content: string;
  content_en?: string | null;
  content_zh?: string | null;
  content_ja?: string | null;
  content_ar?: string | null;
  updated_at?: string;
}

type LangFieldMap = Record<LanguageCode, string>;

const EMPTY_LANG_MAP: LangFieldMap = {
  id: '',
  en: '',
  zh: '',
  ja: '',
  ar: '',
};

/**
 * Mengonversi teks biasa (plain text) menjadi HTML rapi secara otomatis.
 * Jika input sudah mengandung tag HTML (<p>, <h2>, <ul>, dll.), langsung dipertahankan.
 */
function autoFormatToHtml(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // Jika sudah berbentuk HTML, kembalikan langsung
  if (/<(p|h1|h2|h3|h4|ul|ol|li|div|section|br|table)\b[^>]*>/i.test(trimmed)) {
    return trimmed;
  }

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const formatInline = (str: string) => {
    let out = escapeHtml(str);
    // **teks tebal** -> <strong>teks tebal</strong>
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // *teks miring* -> <em>teks miring</em>
    out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // `kode` -> <code>kode</code>
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    return out;
  };

  const lines = trimmed.split(/\r?\n/);
  const htmlBlocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      htmlBlocks.push(`<ul>\n${listItems.join('\n')}\n</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Deteksi Subjudul: diawali "## " atau nomor bab seperti "1. Judul Bagian" (pendek tanpa titik akhir)
    if (/^#{1,3}\s+/.test(line)) {
      flushList();
      const headingText = line.replace(/^#{1,3}\s+/, '');
      htmlBlocks.push(`<h2>${formatInline(headingText)}</h2>`);
      continue;
    }

    if (/^\d+\.\s+[^\n]{3,90}$/.test(line) && !/[.!?。！？]$/.test(line)) {
      flushList();
      htmlBlocks.push(`<h2>${formatInline(line)}</h2>`);
      continue;
    }

    // Deteksi Daftar Poin: diawali "- ", "* ", atau "• "
    if (/^[-*•]\s+/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, '');
      // Jika formatnya "Judul Poin: penjelasan", tebalkan otomatis label sebelum titik dua
      const colonIdx = itemText.indexOf(':');
      if (colonIdx > 0 && colonIdx < 45 && !itemText.includes('**')) {
        const label = itemText.slice(0, colonIdx + 1);
        const rest = itemText.slice(colonIdx + 1);
        listItems.push(
          `  <li><strong>${escapeHtml(label)}</strong>${formatInline(rest)}</li>`
        );
      } else {
        listItems.push(`  <li>${formatInline(itemText)}</li>`);
      }
      continue;
    }

    // Paragraf biasa
    flushList();
    htmlBlocks.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();
  return htmlBlocks.join('\n\n');
}

/**
 * Mengonversi HTML tersimpan di database kembali ke teks bersih yang mudah dibaca/diedit admin
 * tanpa harus melihat tag HTML mentah.
 */
function htmlToEditablePlainText(html: string): string {
  const trimmed = (html || '').trim();
  if (!trimmed) return '';

  // Jika tidak ada tag HTML, kembalikan langsung
  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  let text = trimmed;
  text = text.replace(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, '\n\n## $1\n');
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  text = text.replace(/<[^>]+>/g, '');

  // Decode entitas HTML umum
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'");

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

export default function AdminLegalEditorPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  const [activeSlug, setActiveSlug] = useState<'privacy-policy' | 'terms-of-service'>(
    'privacy-policy'
  );
  const [activeLang, setActiveLang] = useState<LanguageCode>('id');

  const [docsMap, setDocsMap] = useState<Record<string, LegalDoc>>({});
  const [titles, setTitles] = useState<LangFieldMap>({ ...EMPTY_LANG_MAP });
  const [contents, setContents] = useState<LangFieldMap>({ ...EMPTY_LANG_MAP });
  const [version, setVersion] = useState<string>('1.0');
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

  const applyDocToForm = (
    slug: 'privacy-policy' | 'terms-of-service',
    doc?: LegalDoc
  ) => {
    if (doc) {
      setTitles({
        id: doc.title || '',
        en: doc.title_en || '',
        zh: doc.title_zh || '',
        ja: doc.title_ja || '',
        ar: doc.title_ar || '',
      });
      setContents({
        id: htmlToEditablePlainText(doc.content || ''),
        en: htmlToEditablePlainText(doc.content_en || ''),
        zh: htmlToEditablePlainText(doc.content_zh || ''),
        ja: htmlToEditablePlainText(doc.content_ja || ''),
        ar: htmlToEditablePlainText(doc.content_ar || ''),
      });
      setVersion(doc.version || '1.0');
      setLastUpdated(doc.updated_at || '');
    } else {
      setTitles({
        id:
          slug === 'privacy-policy'
            ? 'Kebijakan Privasi (Privacy Policy) — NTTStorePi'
            : 'Syarat & Ketentuan Layanan (Terms of Service) — NTTStorePi',
        en:
          slug === 'privacy-policy'
            ? 'Privacy Policy — NTTStorePi'
            : 'Terms of Service — NTTStorePi',
        zh:
          slug === 'privacy-policy'
            ? '隐私政策 (Privacy Policy) — NTTStorePi'
            : '服务条款 (Terms of Service) — NTTStorePi',
        ja:
          slug === 'privacy-policy'
            ? 'プライバシーポリシー — NTTStorePi'
            : '利用規約 — NTTStorePi',
        ar:
          slug === 'privacy-policy'
            ? 'سياسة الخصوصية — NTTStorePi'
            : 'شروط الخدمة — NTTStorePi',
      });
      setContents({ ...EMPTY_LANG_MAP });
      setVersion('1.0');
      setLastUpdated('');
    }
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
          applyDocToForm('privacy-policy', map['privacy-policy']);
        } else {
          applyDocToForm('privacy-policy');
        }
      } catch (err) {
        console.error('Gagal memuat dokumen admin:', err);
        applyDocToForm('privacy-policy');
      } finally {
        setLoading(false);
      }
    };

    fetchAllDocs();
  }, [API_BASE_URL]);

  const handleSelectTab = (slug: 'privacy-policy' | 'terms-of-service') => {
    setActiveSlug(slug);
    setPreviewMode(false);
    applyDocToForm(slug, docsMap[slug]);
  };

  // Helper sisipkan format teks sederhana (tanpa kode HTML mentah) pada posisi kursor
  const insertTextFormat = (prefix: string, placeholder: string, suffix = '') => {
    const el = textareaRef.current;
    const currentText = contents[activeLang] || '';

    if (!el) {
      setContents((prev) => ({
        ...prev,
        [activeLang]: `${currentText}\n${prefix}${placeholder}${suffix}`.trim(),
      }));
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = currentText.substring(start, end) || placeholder;
    const inserted = `${prefix}${selectedText}${suffix}`;
    const updated =
      currentText.substring(0, start) + inserted + currentText.substring(end);

    setContents((prev) => ({ ...prev, [activeLang]: updated }));

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 20);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titles.id.trim() || !contents.id.trim()) {
      Swal.fire(
        'Data Utama Belum Lengkap',
        'Judul dan isi dokumen Bahasa Indonesia (utama) wajib diisi.',
        'warning'
      );
      setActiveLang('id');
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

      const payload = {
        version: version.trim() || '1.0',
        title: titles.id.trim(),
        title_en: titles.en.trim() || null,
        title_zh: titles.zh.trim() || null,
        title_ja: titles.ja.trim() || null,
        title_ar: titles.ar.trim() || null,
        content: autoFormatToHtml(contents.id),
        content_en: contents.en.trim() ? autoFormatToHtml(contents.en) : null,
        content_zh: contents.zh.trim() ? autoFormatToHtml(contents.zh) : null,
        content_ja: contents.ja.trim() ? autoFormatToHtml(contents.ja) : null,
        content_ar: contents.ar.trim() ? autoFormatToHtml(contents.ar) : null,
      };

      const res = await fetch(`${API_BASE_URL}/admin/legal/${activeSlug}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
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
        text: 'Semua versi bahasa telah dikonversi rapi & aktif di halaman publik.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Gagal Menyimpan', err?.message || 'Periksa hak akses admin Anda.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeLangMeta = LANGUAGES.find((l) => l.code === activeLang) || LANGUAGES[1];
  const generatedPreviewHtml = autoFormatToHtml(contents[activeLang] || '');

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
              Ketik langsung teks biasa (tanpa kode HTML) dalam 5 bahasa — sistem otomatis memformatnya.
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
          {/* Tab Pilihan 5 Bahasa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gray-700">
                <Globe className="w-3.5 h-3.5 text-amber-600" /> Pilih Bahasa Dokumen (5 Bahasa)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Auto-HTML Aktif
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = activeLang === lang.code;
                const hasContent = Boolean(contents[lang.code]?.trim());
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveLang(lang.code)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {lang.code === 'id' && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Utama
                      </span>
                    )}
                    {hasContent && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-emerald-500'
                        }`}
                        title="Sudah terisi"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Judul Dokumen ({activeLangMeta.flag} {activeLangMeta.label}){' '}
                {activeLang === 'id' ? '*' : '(Opsional)'}
              </label>
              <input
                type="text"
                required={activeLang === 'id'}
                dir={activeLangMeta.dir}
                placeholder={`Masukkan judul dokumen dalam ${activeLangMeta.label}...`}
                value={titles[activeLang]}
                onChange={(e) =>
                  setTitles((prev) => ({ ...prev, [activeLang]: e.target.value }))
                }
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
                placeholder="Contoh: 2.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Toolbar Format Teks Mudah & Switch Edit / Pratinjau */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!previewMode ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertTextFormat('\n## ', 'Judul Bagian Baru', '\n')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Heading2 className="w-3.5 h-3.5" /> Subjudul
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTextFormat('\n- ', 'Poin Pertama: Keterangan lengkap', '\n- Poin Kedua: Keterangan lengkap\n')
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <List className="w-3.5 h-3.5" /> Daftar Poin
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextFormat('**', 'Teks Tebal', '**')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5" /> Tebal
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextFormat('*', 'Teks Miring', '*')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Italic className="w-3.5 h-3.5" /> Miring
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-700">
                  Pratinjau Hasil Otomatis ({activeLangMeta.flag} {activeLangMeta.label})
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
                  <Edit3 className="w-3.5 h-3.5" /> Tulis
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
              <div
                dir={activeLangMeta.dir}
                className="min-h-[380px] p-6 rounded-2xl border border-gray-200 bg-gray-50/50"
              >
                {generatedPreviewHtml ? (
                  <article
                    className="prose prose-sm max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-ul:list-disc prose-ul:pl-5"
                    dangerouslySetInnerHTML={{ __html: generatedPreviewHtml }}
                  />
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Belum ada teks pada bahasa {activeLangMeta.label}.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  ref={textareaRef}
                  rows={16}
                  required={activeLang === 'id'}
                  dir={activeLangMeta.dir}
                  placeholder={`Ketik langsung isi dokumen dalam bahasa ${activeLangMeta.label} tanpa perlu menulis kode HTML...\n\nContoh penulisan:\n1. Ketentuan Umum\nDengan mengakses NTTStorePi, pengguna menyetujui aturan layanan ini.\n\n- Pembayaran Pi: Menggunakan Pi SDK resmi.\n- Keamanan Data: Kami tidak pernah meminta 24-word passphrase.`}
                  value={contents[activeLang]}
                  onChange={(e) =>
                    setContents((prev) => ({ ...prev, [activeLang]: e.target.value }))
                  }
                  className="w-full p-4 rounded-2xl border border-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-gray-500">
                  Tips: Baris bernomor seperti <code>1. Judul Bagian</code> atau diawali{' '}
                  <code>## </code> otomatis menjadi subjudul, baris diawali <code>- </code>{' '}
                  otomatis menjadi daftar poin, dan baris kosong otomatis menjadi paragraf baru.
                </p>
              </div>
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
              <span>{saving ? 'Menyimpan...' : 'Simpan & Publikasikan 5 Bahasa'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
