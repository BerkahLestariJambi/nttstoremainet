'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Calendar, FileText, Loader2, Globe } from 'lucide-react';
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

const DEFAULT_PRIVACY_EN = `
<p><strong>Effective Date:</strong> November 28, 2026<br>
<strong>Platform Operator:</strong> NTTStorePi (<code>https://nttstorepi.mejatika.com</code>)</p>

<p>This Privacy Policy comprehensively explains how <strong>NTTStorePi</strong> (&ldquo;We&rdquo;, &ldquo;Us&rdquo;, &ldquo;Platform&rdquo;) collects, uses, stores, protects, processes, and discloses Users&rsquo; (&ldquo;You&rdquo;, &ldquo;Your&rdquo;) Personal Data when accessing or using our marketplace and <em>Live Shopping</em> services via Pi Browser or any other web browser.</p>

<h2>1. Data Minimization &amp; Pi Network Mainnet Compliance</h2>
<p>As a decentralized ecosystem application (<em>Pi App</em>) integrated with the <strong>Pi SDK</strong>, <strong>NTTStorePi</strong> complies with <em>Pi Network Developer Guidelines &amp; Mainnet Ecosystem Policies</em>, Indonesia&rsquo;s <strong>Personal Data Protection Law (UU PDP No. 27 of 2022)</strong>, and international data protection standards (<strong>GDPR</strong> &amp; <strong>CCPA</strong>).</p>
<ul>
  <li><strong>Zero Passphrase Policy:</strong> NTTStorePi never has and never will request, collect, or store your 24-word Wallet Passphrase or Private Key.</li>
  <li><strong>Official Pi SDK Authentication:</strong> Sign-in uses standard <code>username</code> and <code>payments</code> scopes from the official Pi Core Team SDK.</li>
  <li><strong>Blockchain Transparency:</strong> All <strong>Pi (π)</strong> payment transactions are processed directly on the official Pi Mainnet Blockchain.</li>
</ul>

<h2>2. Personal Data We Collect</h2>
<ul>
  <li><strong>Pi Network Account Identity:</strong> Pi Username and Pi User ID (<code>uid</code>) for marketplace account identification.</li>
  <li><strong>Shipping &amp; Transaction Data:</strong> Recipient name, full delivery address, active phone number (for physical goods), order history, and Pi Mainnet Transaction ID (<code>txid</code>).</li>
  <li><strong>Seller / MSME Partner Data:</strong> Store name, origin shipping address, business description, and active contact details for logistics coordination.</li>
  <li><strong>Live Shopping Feature (Zero Recording):</strong> Live chat comments are ephemeral and automatically deleted after the broadcast ends. Camera and microphone access on <em>Join Live</em> is strictly opt-in and is <strong>never recorded or stored</strong> on our servers.</li>
</ul>

<h2>3. Legal Basis &amp; Purpose of Use</h2>
<p>Data processing is based on explicit user consent, contractual necessity to fulfill orders, and legal obligations to verify Pi Mainnet payments, arrange logistics delivery, and resolve disputes.</p>

<h2>4. Third-Party Data Sharing</h2>
<p><strong>NTTStorePi never sells or trades user personal data.</strong> Data is shared strictly on a need-to-know basis with official Pi Network infrastructure, relevant Sellers/MSMEs, and courier partners for order delivery.</p>

<h2>5. Data Subject Rights &amp; Account Deletion</h2>
<p>Under UU PDP and GDPR, you have the right to access, rectify, withdraw Pi SDK consent, or request deletion of non-blockchain personal data stored on our servers at any time.</p>

<h2>6. Contact Us (Data Protection Officer)</h2>
<p>For privacy inquiries or data deletion requests, contact NTTStorePi Admin at <strong>support@nttstorepi.com</strong> or visit <strong>https://nttstorepi.mejatika.com</strong>.</p>
`;

export default function PrivacyPolicyPage() {
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
    fetch(`${API_BASE_URL}/legal/privacy-policy?lang=${isEn ? 'en' : 'id'}`, {
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
      .catch((err) => console.error('Gagal memuat Privacy Policy:', err))
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

    if (doc.content_en && doc.content_en.trim().length > 0) {
      return {
        title: doc.title_en?.trim() || 'Privacy Policy — NTTStorePi',
        content: doc.content_en,
      };
    }

    if (doc.content.includes('<!-- LANG:EN -->')) {
      const parts = doc.content.split('<!-- LANG:EN -->');
      return {
        title: doc.title_en?.trim() || 'Privacy Policy — NTTStorePi',
        content: parts[1]?.trim() || DEFAULT_PRIVACY_EN,
      };
    }

    const looksEnglish = /<h2>\s*1\.\s*(Definitions|Data Minimization)/i.test(doc.content);
    return {
      title: looksEnglish ? doc.title : 'Privacy Policy — NTTStorePi',
      content: looksEnglish ? doc.content : DEFAULT_PRIVACY_EN,
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
            href="/terms-of-service"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isEn ? 'Terms of Service' : 'Syarat & Ketentuan'}</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">
                {isEn ? 'Loading Privacy Policy...' : 'Memuat Kebijakan Privasi...'}
              </p>
            </div>
          ) : doc && localizedDoc ? (
            <>
              <div className="border-b border-gray-100 pb-6 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pi Network Mainnet &amp; UU PDP Compliant</span>
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
                ? 'Privacy Policy document is not available yet.'
                : 'Dokumen Kebijakan Privasi belum tersedia.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
