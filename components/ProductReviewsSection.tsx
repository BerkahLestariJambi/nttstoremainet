'use client';

import React, { useEffect, useState } from 'react';
import {
  Star,
  CheckCircle2,
  MessageSquare,
  X,
  Store,
  Reply,
  Send,
  Loader2,
  CornerDownRight,
  Maximize2,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface ReviewMedia {
  type: 'image' | 'video';
  url: string;
}

interface ReplyNode {
  id: number;
  review_id: number;
  user_id: number;
  parent_id: number | null;
  comment: string;
  is_seller: boolean;
  created_at: string;
  user?: {
    name: string;
    username?: string;
  };
  children?: ReplyNode[];
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  media?: ReviewMedia[];
  seller_reply?: string | null;
  replied_at?: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  user?: {
    name: string;
    username?: string;
  };
  replies?: ReplyNode[];
}

export interface ProductReviewsSectionProps {
  productId: number;
  sellerUserId?: number | null;
}

interface AuthSessionInfo {
  id?: number;
  username?: string;
  pi_uid?: string;
  token?: string;
}

export default function ProductReviewsSection({
  productId,
  sellerUserId,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxMedia, setLightboxMedia] = useState<ReviewMedia | null>(null);

  const [authSession, setAuthSession] = useState<AuthSessionInfo | null>(null);
  const [activeReplyBox, setActiveReplyBox] = useState<{
    reviewId: number;
    parentId: number | null;
    targetName: string;
  } | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  // Normalisasi URL gambar & video bukti ulasan ke https://domain/public/reviews/{nama_file}
  const resolveMediaUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';

    const clean = url.trim().replace(/\\/g, '/');

    if (
      (clean.startsWith('http://') || clean.startsWith('https://')) &&
      !clean.includes('nttstorepi.mejatika.com')
    ) {
      return clean;
    }

    const fileName = clean.split('/').filter(Boolean).pop();
    if (!fileName) return '';

    return `${DOMAIN_BASE_URL}/public/reviews/${fileName}`;
  };

  // Deteksi sesi login Pi dari localStorage / sessionStorage (id, username, pi_uid, maupun token)
  const detectAuthSession = (): AuthSessionInfo | null => {
    if (typeof window === 'undefined') return null;

    const session: AuthSessionInfo = {};
    const stores = [window.localStorage, window.sessionStorage];

    for (const store of stores) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        const val = store.getItem(key);
        if (!val || val === 'null' || val === 'undefined') continue;

        const cleanVal = val.trim();

        // Cek token Sanctum ("15|abc...") atau JWT ("eyJ...")
        if (/^\d+\|[A-Za-z0-9]{20,}$/.test(cleanVal) || cleanVal.startsWith('eyJ')) {
          session.token = cleanVal.replace(/^Bearer\s+/i, '');
        }

        if (key.toLowerCase().includes('username') && !cleanVal.startsWith('{')) {
          session.username = cleanVal.replace(/^@/, '');
        }

        if (key.toLowerCase().includes('uid') && !cleanVal.startsWith('{')) {
          session.pi_uid = cleanVal;
        }

        // Jika berbentuk objek JSON
        if (cleanVal.startsWith('{')) {
          try {
            const parsed = JSON.parse(cleanVal);
            const u = parsed?.user || parsed?.data?.user || parsed;
            if (u?.id) session.id = Number(u.id);
            if (u?.username) session.username = String(u.username).replace(/^@/, '');
            if (u?.pi_uid || u?.uid) session.pi_uid = String(u.pi_uid || u.uid);

            const tok =
              parsed?.token ||
              parsed?.access_token ||
              parsed?.api_token ||
              parsed?.data?.token;
            if (typeof tok === 'string' && tok.length > 10) {
              session.token = tok.replace(/^Bearer\s+/i, '');
            }
          } catch {
            // abaikan
          }
        }
      }
    }

    if (session.id || session.username || session.pi_uid || session.token) {
      return session;
    }
    return null;
  };

  useEffect(() => {
    setAuthSession(detectAuthSession());
  }, []);

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setReviews(json.data.reviews || []);
        setAverageRating(json.data.average_rating || 0);
        setTotalReviews(json.data.total_reviews || 0);
      }
    } catch (err) {
      console.error('Gagal memuat ulasan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyBox || !replyText.trim()) return;

    const currentSession = detectAuthSession() || authSession;

    setSubmittingReply(true);
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (currentSession?.token) {
        headers['Authorization'] = `Bearer ${currentSession.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/reviews/${activeReplyBox.reviewId}/reply`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          comment: replyText.trim(),
          parent_id: activeReplyBox.parentId,
          user_id: currentSession?.id || null,
          username: currentSession?.username || null,
          pi_uid: currentSession?.pi_uid || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Gagal mengirim balasan.');
      }

      setReplyText('');
      setActiveReplyBox(null);
      await fetchReviews();
    } catch (err: any) {
      Swal.fire('Gagal', err?.message || 'Terjadi kesalahan saat membalas.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Render Rekursif untuk Balasan Bersarang (Nested Replies)
  const renderReplyNodes = (nodes: ReplyNode[], reviewId: number, depth = 1) => {
    return nodes.map((node) => {
      const authorName = node.user?.name || node.user?.username || 'Pengguna';
      const isSellerBadge =
        node.is_seller || (sellerUserId && Number(node.user_id) === Number(sellerUserId));

      return (
        <div
          key={node.id}
          className={`mt-2.5 ${depth > 1 ? 'ml-4 sm:ml-6' : 'ml-3 sm:ml-5'} pl-3 border-l-2 ${
            isSellerBadge ? 'border-purple-300' : 'border-gray-200'
          }`}
        >
          <div
            className={`p-3 rounded-2xl text-xs space-y-1 ${
              isSellerBadge
                ? 'bg-purple-50/80 border border-purple-100'
                : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CornerDownRight className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-gray-900">{authorName}</span>
                {isSellerBadge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    <Store className="w-2.5 h-2.5" /> Penjual
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400">
                {new Date(node.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            <p className="text-gray-700 leading-relaxed">{node.comment}</p>

            {depth < 4 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReplyBox({
                      reviewId,
                      parentId: node.id,
                      targetName: authorName,
                    });
                    setReplyText('');
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                >
                  <Reply className="w-3 h-3" /> Balas
                </button>
              </div>
            )}
          </div>

          {activeReplyBox?.reviewId === reviewId && activeReplyBox?.parentId === node.id && (
            <form onSubmit={handleSendReply} className="mt-2 ml-3 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Balas ${activeReplyBox.targetName}...`}
                className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 cursor-pointer"
              >
                {submittingReply ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveReplyBox(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {Array.isArray(node.children) &&
            node.children.length > 0 &&
            renderReplyNodes(node.children, reviewId, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div id="reviews" className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            Ulasan & Testimoni Pembeli ({totalReviews})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ulasan asli dari pembeli beserta diskusi balasan penjual.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-100">
          <span className="text-2xl font-black text-amber-600">
            {totalReviews > 0 ? Number(averageRating).toFixed(1) : '0.0'}
          </span>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(averageRating))
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

      {loading ? (
        <p className="text-xs text-gray-400 py-6 text-center">Memuat ulasan pembeli...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-xs">
          Belum ada ulasan untuk produk ini.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 space-y-5">
          {reviews.map((rev) => {
            const reviewerName = rev.user?.name || rev.user?.username || 'Pembeli NTTStorePi';

            return (
              <div key={rev.id} className="pt-5 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{reviewerName}</span>
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

                {Array.isArray(rev.media) && rev.media.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    {/* Video ditampilkan lebar agar langsung bisa diputar */}
                    {rev.media
                      .filter((m) => m.type === 'video')
                      .map((m, idx) => {
                        const fullUrl = resolveMediaUrl(m.url);
                        return (
                          <div
                            key={`vid-${idx}`}
                            className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-black"
                          >
                            <video
                              src={fullUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-contain bg-black"
                            />
                            <button
                              type="button"
                              onClick={() => setLightboxMedia({ type: 'video', url: fullUrl })}
                              title="Perbesar video"
                              className="absolute top-2 right-2 bg-black/65 hover:bg-black/85 text-white p-1.5 rounded-lg transition cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                    {/* Foto bukti ulasan */}
                    {rev.media.some((m) => m.type !== 'video') && (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {rev.media
                          .filter((m) => m.type !== 'video')
                          .map((m, idx) => {
                            const fullUrl = resolveMediaUrl(m.url);
                            return (
                              <button
                                key={`img-${idx}`}
                                type="button"
                                onClick={() => setLightboxMedia({ type: 'image', url: fullUrl })}
                                className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group cursor-pointer"
                              >
                                <img
                                  src={fullUrl}
                                  alt="Bukti ulasan"
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReplyBox({
                        reviewId: rev.id,
                        parentId: null,
                        targetName: reviewerName,
                      });
                      setReplyText('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Balas Ulasan</span>
                  </button>
                </div>

                {activeReplyBox?.reviewId === rev.id && activeReplyBox?.parentId === null && (
                  <form onSubmit={handleSendReply} className="mt-2 ml-3 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Tulis balasan untuk ${activeReplyBox.targetName}...`}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-purple-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {submittingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Kirim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReplyBox(null)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {Array.isArray(rev.replies) &&
                  rev.replies.length > 0 &&
                  renderReplyNodes(rev.replies, rev.id, 1)}
              </div>
            );
          })}
        </div>
      )}

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
                playsInline
                className="max-h-[80vh] w-full rounded-2xl shadow-2xl bg-black"
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
