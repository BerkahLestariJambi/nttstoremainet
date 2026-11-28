'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Calendar, ShieldCheck, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface LegalDoc {
  slug: string;
  title: string;
  title_en?: string | null;
  version: string;
  content: string;
  content_en?: string | null;
  updated_at: string;
}

const DEFAULT_TERMS_EN = `
<h2>1. General Terms</h2>
<p>By accessing and transacting on <strong>NTTStorePi</strong> (<code>https://nttstorepi.mejatika.com</code>), Users (Buyers and Sellers) agree to be bound by these Terms of Service, the <strong>Pi Network Mainnet</strong> ecosystem policies, and the applicable laws of the Republic of Indonesia.</p>

<h2>2. Transactions &amp; Pi (π) Coin Payments</h2>
<ul>
  <li>All transactions within the platform are conducted using <strong>Pi (π)</strong> cryptocurrency through the official Pi SDK protocol.</li>
  <li>Users must ensure sufficient Pi balance and verify product details and shipping addresses before approving transactions in their Pi Wallet.</li>
  <li>Transactions confirmed on the Pi Mainnet Blockchain are final in accordance with blockchain technology mechanics.</li>
</ul>

<h2>3. Obligations of Sellers (MSMEs) &amp; Buyers</h2>
<ul>
  <li>Sellers must accurately display product descriptions, prices in Pi (π), and stock availability, and ship orders on time.</li>
  <li>Sellers and Buyers are strictly prohibited from trading illegal goods or services under Indonesian law or Pi Network policies.</li>
  <li>During <em>Live Shopping</em> and <em>Join Live</em> sessions, all users must maintain respectful communication and are prohibited from spreading unlawful or fraudulent content.</li>
</ul>

<h2>4. Dispute Resolution</h2>
<p>In the event of shipping issues or product discrepancies, Buyers and Sellers may request mediation through NTTStorePi Admin Support by providing order details and the transaction <code>txid</code>.</p>

<h2>5. Amendments to Terms</h2>
<p>NTTStorePi reserves the right to update these Terms of Service at any time in accordance with service developments and regulations. Updates take effect immediately upon publication on this page.</p>
`;

export default function TermsOfServicePage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  const langCtx: any = useLanguage();
  const currentLang = String(
    langCtx?.language || langCtx?.lang || langCtx?.locale || 'id'
  ).toLowerCase();
  const isEn = currentLang.startsWith('en');

  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/legal/terms-of-service?lang=${isEn ? 'en' : 'id'}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': isEn ? 'en' : 'id',
      },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.data) {
          setDoc(json.data);
        }
      })
      .catch((err) => console.error('Gagal memuat Terms of Service:', err))
      .finally(() => setLoading(false));
  }, [API_BASE_URL, isEn]);

  // Ekstrak konten sesuai bahasa aktif (mendukung pemisah <!-- LANG:EN --> atau kolom content_en)
  const localizedDoc = useMemo(() => {
    if (!doc) return null;

    if (!isEn) {
      const idContent = doc.content.includes('<!-- LANG:EN -->')
        ? doc.content.split('<!-- LANG:EN -->')[0].trim()
        : doc.content;
      return {
        title: doc.title,
        content: idContent,
      };
    }

    // Jika mode English dipilih:
    if (doc.content_en && doc.content_en.trim().length > 0) {
      return {
        title: doc.title_en?.trim() || 'Terms of Service — NTTStorePi',
        content: doc.content_en,
      };
    }

    if (doc.content.includes('<!-- LANG:EN -->')) {
      const parts = doc.content.split('<!-- LANG:EN -->');
      return {
        title: doc.title_en?.trim() || 'Terms of Service — NTTStorePi',
        content: parts[1]?.trim() || DEFAULT_TERMS_EN,
      };
    }

    // Cek apakah isi database sudah berbahasa Inggris
    const looksEnglish = /<h2>\s*1\.\s*(General|Terms)/i.test(doc.content);
    return {
      title: looksEnglish ? doc.title : 'Terms of Service — NTTStorePi',
      content: looksEnglish ? doc.content : DEFAULT_TERMS_EN,
    };
  }, [doc, isEn]);

  const formattedDate = doc?.updated_at
    ? new Date(doc.updated_at).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : isEn
    ? 'November 28, 2026'
    : '28 November 2026';

  return (
    <div className="py-2 sm:py-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isEn ? 'Back to Home' : 'Kembali ke Beranda'}</span>
          </Link>

          <Link
            href="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isEn ? 'Privacy Policy' : 'Kebijakan Privasi'}</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">
                {isEn ? 'Loading Terms of Service...' : 'Memuat Syarat & Ketentuan...'}
              </p>
            </div>
          ) : doc && localizedDoc ? (
            <>
              <div className="border-b border-gray-100 pb-6 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold">
                    <FileText className="w-4 h-4" />
                    <span>
                      {isEn
                        ? 'NTTStorePi Ecosystem Terms of Service'
                        : 'Ketentuan Layanan Ekosistem NTTStorePi'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase">
                    <Globe className="w-3.5 h-3.5" /> {isEn ? 'EN' : 'ID'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                  {localizedDoc.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {isEn ? 'Last Updated:' : 'Diperbarui:'} {formattedDate}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
                    {isEn ? `Version ${doc.version}` : `Versi ${doc.version}`}
                  </span>
                </div>
              </div>

              <article
                className="prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: localizedDoc.content }}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">
              {isEn
                ? 'Terms of Service document is not available yet.'
                : 'Dokumen Syarat & Ketentuan belum tersedia.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
