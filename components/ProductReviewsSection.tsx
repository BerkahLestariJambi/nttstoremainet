'use client';

import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, MessageSquare, PlayCircle, X } from 'lucide-react';

interface ReviewMedia {
  type: 'image' | 'video';
  url: string;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  media?: ReviewMedia[];
  is_verified_purchase: boolean;
  created_at: string;
  user?: {
    name: string;
    username?: string;
  };
}

export default function ProductReviewsSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxMedia, setLightboxMedia] = useState<ReviewMedia | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const resolveMediaUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `${DOMAIN_BASE_URL}${clean.startsWith('/public') ? clean : `/public${clean}`}`;
  };

  useEffect(() => {
    if (!productId) return;
    fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json.data) {
          setReviews(json.data.reviews || []);
          setAverageRating(json.data.average_rating || 0);
          setTotalReviews(json.data.total_reviews || 0);
        }
      })
      .catch((err) => console.error('Gagal memuat ulasan:', err))
      .finally(() => setLoading(false));
  }, [productId, API_BASE_URL]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mt-8 space-y-6">
      {/* Header Statistik Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            Ulasan & Testimoni Pembeli ({totalReviews})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ulasan asli dari pembeli yang telah menyelesaikan transaksi produk ini.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-100">
          <span className="text-2xl font-black text-amber-600">
            {totalReviews > 0 ? averageRating.toFixed(1) : '0.0'}
          </span>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-500">{totalReviews} ulasan terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Daftar Ulasan */}
      {loading ? (
        <p className="text-xs text-gray-400 py-6 text-center">Memuat ulasan pembeli...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-xs">
          Belum ada ulasan untuk produk ini. Jadilah pembeli pertama yang memberikan testimoni!
        </div>
      ) : (
        <div className="divide-y divide-gray-100 space-y-5">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-5 first:pt-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {rev.user?.name || rev.user?.username || 'Pembeli NTTStorePi'}
                    </span>
                    {rev.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Pembelian Terverifikasi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <span className="text-[11px] text-gray-400">
                  {new Date(rev.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {rev.comment && (
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{rev.comment}</p>
              )}

              {/* Galeri Foto & Video Bukti Ulasan */}
              {Array.isArray(rev.media) && rev.media.length > 0 && (
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  {rev.media.map((m, idx) => {
                    const fullUrl = resolveMediaUrl(m.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxMedia({ type: m.type, url: fullUrl })}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-black group cursor-pointer"
                      >
                        {m.type === 'video' ? (
                          <>
                            <video src={fullUrl} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <PlayCircle className="w-7 h-7 text-white drop-shadow" />
                            </div>
                          </>
                        ) : (
                          <img
                            src={fullUrl}
                            alt="Bukti ulasan"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Perbesar Foto / Putar Video */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setLightboxMedia(null)}
              className="self-end mb-2 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {lightboxMedia.type === 'video' ? (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="max-h-[80vh] w-auto rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={lightboxMedia.url}
                alt="Detail testimoni"
                className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
