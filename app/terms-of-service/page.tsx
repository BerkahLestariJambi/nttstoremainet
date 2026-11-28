'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Calendar, ShieldCheck, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageCode } from '@/lib/translations';

interface LegalDoc {
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
  localized_lang?: string;
  localized_title?: string;
  localized_content?: string;
  updated_at: string;
}

const LOCALE_MAP: Record<LanguageCode, string> = {
  id: 'id-ID',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ar: 'ar-SA',
};

export default function TermsOfServicePage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  const langCtx: any = useLanguage();
  const { t } = langCtx;
  const rawLang = String(
    langCtx?.language || langCtx?.lang || langCtx?.locale || 'id'
  )
    .toLowerCase()
    .slice(0, 2);

  const activeLang: LanguageCode = (['en', 'id', 'zh', 'ja', 'ar'].includes(rawLang)
    ? rawLang
    : 'id') as LanguageCode;
  const isRtl = activeLang === 'ar';

  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/legal/terms-of-service?lang=${activeLang}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': activeLang,
      },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.data) {
          setDoc(json.data);
        } else {
          setDoc(null);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat Terms of Service dari database:', err);
        setDoc(null);
      })
      .finally(() => setLoading(false));
  }, [API_BASE_URL, activeLang]);

  const localizedDoc = useMemo(() => {
    if (!doc) return null;

    // 1. Prioritaskan langsung hasil localized_content dari API tabel legal_documents
    if (doc.localized_content && doc.localized_content.trim().length > 0) {
      return {
        title: doc.localized_title?.trim() || doc.title,
        content: doc.localized_content,
      };
    }

    // 2. Ambil langsung dari kolom bahasa masing-masing di tabel legal_documents
    const titleByLang: Record<LanguageCode, string | null | undefined> = {
      id: doc.title,
      en: doc.title_en,
      zh: doc.title_zh,
      ja: doc.title_ja,
      ar: doc.title_ar,
    };

    const contentByLang: Record<LanguageCode, string | null | undefined> = {
      id: doc.content,
      en: doc.content_en,
      zh: doc.content_zh,
      ja: doc.content_ja,
      ar: doc.content_ar,
    };

    const selectedContent = contentByLang[activeLang]?.trim();
    const selectedTitle = titleByLang[activeLang]?.trim();

    if (selectedContent && selectedContent.length > 0) {
      return {
        title: selectedTitle || doc.title_en?.trim() || doc.title,
        content: selectedContent,
      };
    }

    // 3. Fallback tetap mengambil isi dari tabel database (content_en atau content utama)
    return {
      title: doc.title_en?.trim() || doc.title,
      content: doc.content_en?.trim() || doc.content,
    };
  }, [doc, activeLang]);

  const formattedDate = doc?.updated_at
    ? new Date(doc.updated_at).toLocaleDateString(LOCALE_MAP[activeLang], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="py-2 sm:py-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-amber-600"
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{t('backToHome')}</span>
          </Link>

          <Link
            href="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('privacyPolicyTab')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">{t('loadingTermsOfService')}</p>
            </div>
          ) : doc && localizedDoc ? (
            <>
              <div className="border-b border-gray-100 pb-6 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold">
                    <FileText className="w-4 h-4" />
                    <span>{t('termsOfServiceBadge')}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase">
                    <Globe className="w-3.5 h-3.5" /> {activeLang.toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                  {localizedDoc.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {t('lastUpdatedLabel')} {formattedDate}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
                    {t('versionLabel')} {doc.version}
                  </span>
                </div>
              </div>

              <article
                dir={isRtl ? 'rtl' : 'ltr'}
                className="prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: localizedDoc.content }}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">
              {t('termsOfServiceNotAvailable')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
