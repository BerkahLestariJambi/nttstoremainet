'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { useLanguage } from '@/context/LanguageContext';
import ReviewModal from '@/components/ReviewModal';
import Swal from 'sweetalert2';
import {
  Package,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Star,
  Store,
  Reply,
  Send,
  Loader2,
  CornerDownRight,
  X,
  MessageSquare,
} from 'lucide-react';

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

interface ItemReview {
  id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  seller_reply?: string | null;
  created_at: string;
  replies?: ReplyNode[];
}

interface OrderItem {
  id: number;
  product_id?: number;
  quantity: number;
  price_pi: string;
  is_reviewed?: boolean;
  review?: ItemReview | null;
  product?: {
    id: number;
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: number;
  user_id?: number;
  order_number: string;
  total_amount_pi: string;
  status: 'pending' | 'processing' | 'paid' | 'completed' | 'cancelled';
  recipient_name: string;
  phone_number: string;
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}

const DATE_LOCALES: Record<string, string> = {
  en: 'en-US',
  id: 'id-ID',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ar: 'ar-SA',
};

export default function BuyerOrdersPage() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Review Produk + Upload Foto/Video
  const [reviewTarget, setReviewTarget] = useState<{
    orderId: number;
    productId: number;
    productName: string;
    productImage?: string;
  } | null>(null);
  const [reviewedKeys, setReviewedKeys] = useState<string[]>([]);

  // State untuk membalas komentar dari Seller langsung di halaman Orders
  const [replyBox, setReplyBox] = useState<{
    reviewId: number;
    parentId: number | null;
    targetName: string;
    buyerUserId?: number;
  } | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const getFullImageUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
    const cleanUrl = url.trim().replace(/\\/g, '/');
    if (
      (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) &&
      !cleanUrl.includes('nttstorepi.mejatika.com')
    ) {
      return cleanUrl;
    }
    const fileName = cleanUrl.split('/').filter(Boolean).pop();
    if (!fileName) return undefined;
    return `${DOMAIN_BASE_URL}/public/products/${fileName}`;
  };

  const loadOrders = useCallback(() => {
    orderService
      .getBuyerOrders()
      .then((res) => {
        const data = res?.data || res;
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Gagal mengambil riwayat pesanan:', err);
        setError(t('loadOrdersError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Deteksi username / user_id pembeli dari storage
  const getBuyerSession = () => {
    if (typeof window === 'undefined') return {};
    const info: { id?: number; username?: string; pi_uid?: string; token?: string } = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const val = window.localStorage.getItem(key);
      if (!val || val === 'null' || val === 'undefined') continue;
      const clean = val.trim();

      if (/^\d+\|[A-Za-z0-9]{20,}$/.test(clean) || clean.startsWith('eyJ')) {
        info.token = clean.replace(/^Bearer\s+/i, '');
      }
      if (clean.startsWith('{')) {
        try {
          const parsed = JSON.parse(clean);
          const u = parsed?.user || parsed?.data?.user || parsed;
          if (u?.id) info.id = Number(u.id);
          if (u?.username) info.username = String(u.username).replace(/^@/, '');
          if (u?.pi_uid || u?.uid) info.pi_uid = String(u.pi_uid || u.uid);
        } catch {
          // abaikan
        }
      }
    }
    return info;
  };

  const handleSendReplyToSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBox || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const session = getBuyerSession();
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/reviews/${replyBox.reviewId}/reply`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          comment: replyText.trim(),
          parent_id: replyBox.parentId,
          user_id: session.id || replyBox.buyerUserId || null,
          username: session.username || null,
          pi_uid: session.pi_uid || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Gagal mengirim balasan.');
      }

      setReplyText('');
      setReplyBox(null);
      loadOrders();
    } catch (err: any) {
      Swal.fire('Gagal', err?.message || 'Tidak dapat mengirim balasan.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Render rekursif percakapan balasan antara Seller & Buyer di kartu pesanan
  const renderOrderReplyNodes = (
    nodes: ReplyNode[],
    reviewId: number,
    buyerUserId?: number,
    depth = 1
  ) => {
    return nodes.map((node) => {
      const authorName = node.user?.name || node.user?.username || 'Pengguna';
      const isSeller = Boolean(node.is_seller);

      return (
        <div
          key={node.id}
          className={`mt-2 ${depth > 1 ? 'ml-3.5' : 'ml-2'} pl-2.5 border-l-2 ${
            isSeller ? 'border-purple-300' : 'border-amber-300'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl text-[11px] space-y-1 ${
              isSeller
                ? 'bg-purple-50 border border-purple-100'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CornerDownRight className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-gray-900">{authorName}</span>
                {isSeller && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded-full">
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
              <button
                type="button"
                onClick={() => {
                  setReplyBox({
                    reviewId,
                    parentId: node.id,
                    targetName: authorName,
                    buyerUserId,
                  });
                  setReplyText('');
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 pt-0.5 cursor-pointer"
              >
                <Reply className="w-3 h-3" /> Balas
              </button>
            )}
          </div>

          {replyBox?.reviewId === reviewId && replyBox?.parentId === node.id && (
            <form onSubmit={handleSendReplyToSeller} className="mt-1.5 flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Balas ${replyBox.targetName}...`}
                className="flex-1 px-2.5 py-1.5 bg-white border border-purple-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="p-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white disabled:opacity-50 cursor-pointer"
              >
                {submittingReply ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setReplyBox(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {Array.isArray(node.children) &&
            node.children.length > 0 &&
            renderOrderReplyNodes(node.children, reviewId, buyerUserId, depth + 1)}
        </div>
      );
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('paymentCompletedStatus')}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> {t('awaitingPaymentStatus')}
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            {t('processingOrderStatus')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-3 py-1 rounded-full">
            {t('cancelledOrderStatus')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> {t('backToHome')}
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> {t('myShoppingHistoryTitle')}
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-gray-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center bg-white border border-gray-100 rounded-3xl shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 mb-1">{t('noOrdersYetTitle')}</h3>
          <p className="text-xs text-gray-500 mb-6">{t('noOrdersYetDesc')}</p>
          <Link
            href="/"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition"
          >
            {t('startShopping')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canReviewOrder = order.status === 'paid' || order.status === 'completed';

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap justify-between items-center text-xs pb-3 border-b border-gray-100 gap-2">
                  <div>
                    <span className="font-bold text-gray-900">
                      {t('orderNumberLabel')} #{order.order_number || order.id}
                    </span>
                    <span className="text-gray-400 ml-2">
                      {new Date(order.created_at).toLocaleDateString(
                        DATE_LOCALES[language] || 'en-US',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Daftar Items + Tombol Ulasan & Diskusi Balasan Seller */}
                <div className="space-y-3">
                  {order.items?.map((item) => {
                    const resolvedProductId = item.product?.id ?? item.product_id;
                    const reviewKey = `${order.id}-${resolvedProductId}`;
                    const alreadyReviewed =
                      reviewedKeys.includes(reviewKey) ||
                      Boolean(item.is_reviewed || item.review);
                    const itemImgUrl = getFullImageUrl(item.product?.image_url);
                    const reviewObj = item.review;
                    const buyerUserId = reviewObj?.user_id ?? order.user_id;

                    return (
                      <div
                        key={item.id}
                        className="pb-3 border-b border-gray-50 last:border-b-0 last:pb-0 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {itemImgUrl ? (
                              <img
                                src={itemImgUrl}
                                alt={item.product?.name || 'Produk'}
                                className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}

                            <div>
                              <p className="text-sm text-gray-800 font-semibold">
                                {item.product?.name || `${t('productFallbackLabel')} #${item.id}`}{' '}
                                <span className="text-gray-400 text-xs font-normal">
                                  x{item.quantity}
                                </span>
                              </p>
                              <span className="text-xs font-bold text-amber-600">
                                π {item.price_pi}
                              </span>
                            </div>
                          </div>

                          {canReviewOrder && resolvedProductId && (
                            <div className="self-end sm:self-center">
                              {alreadyReviewed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diulas
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviewTarget({
                                      orderId: order.id,
                                      productId: resolvedProductId,
                                      productName:
                                        item.product?.name ||
                                        `${t('productFallbackLabel')} #${resolvedProductId}`,
                                      productImage: itemImgUrl,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5 fill-white" />
                                  <span>Beri Ulasan + Foto/Video</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Kotak Ulasan Pembeli + Balasan Bersarang dari Seller di Halaman Orders */}
                        {reviewObj && (
                          <div className="ml-2 sm:ml-4 p-3 rounded-2xl bg-amber-50/40 border border-amber-100/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-800">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                                Ulasan Anda ({reviewObj.rating} ★)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyBox({
                                    reviewId: reviewObj.id,
                                    parentId: null,
                                    targetName: 'Diskusi Ulasan',
                                    buyerUserId,
                                  });
                                  setReplyText('');
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                              >
                                <Reply className="w-3 h-3" /> Tambah Balasan
                              </button>
                            </div>

                            {reviewObj.comment && (
                              <p className="text-xs text-gray-700">{reviewObj.comment}</p>
                            )}

                            {/* Form tambah balasan tingkat pertama */}
                            {replyBox?.reviewId === reviewObj.id && replyBox?.parentId === null && (
                              <form
                                onSubmit={handleSendReplyToSeller}
                                className="mt-1.5 flex items-center gap-1.5"
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Tulis balasan lanjutan ke penjual..."
                                  className="flex-1 px-2.5 py-1.5 bg-white border border-purple-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                  type="submit"
                                  disabled={submittingReply || !replyText.trim()}
                                  className="p-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white disabled:opacity-50 cursor-pointer"
                                >
                                  {submittingReply ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReplyBox(null)}
                                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            )}

                            {/* Pohon Balasan Seller & Pembeli (Nested Replies) */}
                            {Array.isArray(reviewObj.replies) &&
                              reviewObj.replies.length > 0 &&
                              renderOrderReplyNodes(reviewObj.replies, reviewObj.id, buyerUserId, 1)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rincian Total & Alamat */}
                <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1 text-gray-600 border border-gray-100">
                  <p>
                    <strong className="text-gray-800">{t('recipientLabel')}:</strong>{' '}
                    {order.recipient_name} ({order.phone_number})
                  </p>
                  <p>
                    <strong className="text-gray-800">{t('addressLabel')}:</strong>{' '}
                    {order.shipping_address}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 text-sm">
                  <span className="font-bold text-gray-700">{t('totalTransactionLabel')}</span>
                  <span className="text-base font-extrabold text-amber-600">
                    π {order.total_amount_pi}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Review + Upload Foto/Video */}
      {reviewTarget && (
        <ReviewModal
          isOpen={true}
          onClose={() => setReviewTarget(null)}
          orderId={reviewTarget.orderId}
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          productImage={reviewTarget.productImage}
          onSuccess={() => {
            setReviewedKeys((prev) => [
              ...prev,
              `${reviewTarget.orderId}-${reviewTarget.productId}`,
            ]);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
