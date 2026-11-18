'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, Users, Store, ArrowRight } from 'lucide-react';

interface ActiveLiveStream {
  id: number;
  seller_id: number;
  store_name: string;
  title: string;
  room_name: string;
  viewer_count: number;
  pinned_product?: {
    id: number;
    name: string;
    price_pi: string | number;
    discount_price_pi?: string | number | null;
    image_url?: string | null;
  } | null;
}

export default function LiveStreamsBanner() {
  const [streams, setStreams] = useState<ActiveLiveStream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const resolveProductImg = (url?: string | null) => {
    if (!url) return '';
    const clean = url.trim().replace(/\\/g, '/');
    if (
      (clean.startsWith('http://') || clean.startsWith('https://')) &&
      !clean.includes('nttstorepi.mejatika.com')
    ) {
      return clean;
    }
    const fileName = clean.split('/').filter(Boolean).pop();
    return fileName ? `${DOMAIN_BASE_URL}/public/products/${fileName}` : '';
  };

  const fetchActiveLives = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/live`, {
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setStreams(json.data);
      }
    } catch (err) {
      console.error('Gagal memuat daftar live:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLives();
    const interval = setInterval(fetchActiveLives, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || streams.length === 0) return null;

  return (
    <section className="mb-6 bg-gradient-to-r from-rose-50 via-amber-50/70 to-purple-50 border border-rose-100 rounded-3xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full animate-pulse">
            <Radio className="w-3.5 h-3.5" /> LIVE SEKARANG
          </span>
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900">
            Belanja Langsung dari Toko NTT ({streams.length})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {streams.map((stream) => {
          const thumb = resolveProductImg(stream.pinned_product?.image_url);
          return (
            <Link
              key={stream.id}
              href={`/live/${stream.room_name}`}
              className="group bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-3 flex items-center gap-3 shadow-xs hover:shadow-md transition"
            >
              <div className="relative w-16 h-16 rounded-xl bg-gray-900 overflow-hidden shrink-0 flex items-center justify-center">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={stream.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition"
                  />
                ) : (
                  <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
                )}
                <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                  LIVE
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                  <Store className="w-3 h-3 shrink-0" />
                  <span className="truncate">{stream.store_name}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-1 mt-0.5">
                  {stream.title}
                </h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
                    <Users className="w-3 h-3 text-rose-500" /> {stream.viewer_count} menonton
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600 group-hover:translate-x-0.5 transition">
                    Tonton <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
