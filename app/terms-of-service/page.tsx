'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Calendar, ShieldCheck, Loader2 } from 'lucide-react';

interface LegalDoc {
  slug: string;
  title: string;
  version: string;
  content: string;
  updated_at: string;
}

export default function TermsOfServicePage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/legal/terms-of-service`, {
      headers: { Accept: 'application/json' },
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
  }, [API_BASE_URL]);

  const formattedDate = doc?.updated_at
    ? new Date(doc.updated_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '28 November 2026';

  return (
    <div className="min-h-screen bg-gray-50/70 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <Link
            href="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Kebijakan Privasi
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">Memuat Syarat &amp; Ketentuan...</p>
            </div>
          ) : doc ? (
            <>
              <div className="border-b border-gray-100 pb-6 mb-6 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold">
                  <FileText className="w-4 h-4" /> Ketentuan Layanan Ekosistem NTTStorePi
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                  {doc.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" /> Diperbarui: {formattedDate}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
                    Versi {doc.version}
                  </span>
                </div>
              </div>

              <article
                className="prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: doc.content }}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">
              Dokumen Syarat &amp; Ketentuan belum tersedia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
