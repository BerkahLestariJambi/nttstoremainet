'use client';

import { useEffect, useState } from 'react';
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
  Crown,
} from 'lucide-react';

interface OrderItem {
  id: number;
  product_id?: number;
  quantity: number;
  price_pi: string;
  is_reviewed?: boolean;
  product?: {
    id: number;
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: number;
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

  // Cek apakah user sudah menggunakan kuota uji coba 1x ulasan
  const hasUsedTrialReview =
    reviewedKeys.length > 0 ||
    orders.some((o) => o.items?.some((it) => Boolean(it.is_reviewed)));

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';
  const DOMAIN_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

  const getFullImageUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    cleanUrl = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    if (!cleanUrl.startsWith('/public')) {
      cleanUrl = `/public${cleanUrl}`;
    }
    return `${DOMAIN_BASE_URL}${cleanUrl}`;
  };

  useEffect(() => {
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

  const handlePremiumPrompt = () => {
    Swal.fire({
      icon: 'warning',
      title: 'Batas Uji Coba Tercapai (1x per User)',
      html: `
        <p class="text-sm text-gray-600">
          Fitur ini <strong>hanya uji coba dan hanya dapat digunakan 1 kali saja</strong> per akun.
        </p>
        <p class="text-sm text-gray-800 font-semibold mt-2">
          Untuk menggunakan fitur ulasan & upload foto/video seterusnya, silakan aktivasi versi <strong>Premium</strong>.
        </p>
      `,
      confirmButtonText: 'Aktivasi Premium',
      confirmButtonColor: '#7e22ce',
      showCancelButton: true,
      cancelButtonText: 'Tutup',
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

                {/* Daftar Items + Tombol Beri Ulasan & Upload Foto/Video */}
                <div className="space-y-3">
                  {order.items?.map((item) => {
                    const resolvedProductId = item.product?.id ?? item.product_id;
                    const reviewKey = `${order.id}-${resolvedProductId}`;
                    const alreadyReviewed =
                      reviewedKeys.includes(reviewKey) || Boolean(item.is_reviewed);
                    const itemImgUrl = getFullImageUrl(item.product?.image_url);

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-50 last:border-b-0 last:pb-0"
                      >
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

                        {/* Tombol Ulasan hanya muncul jika pesanan sudah Paid / Completed */}
                        {canReviewOrder && resolvedProductId && (
                          <div className="self-end sm:self-center">
                            {alreadyReviewed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diulas
                              </span>
                            ) : hasUsedTrialReview ? (
                              <button
                                type="button"
                                onClick={handlePremiumPrompt}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold border border-purple-200 transition cursor-pointer"
                              >
                                <Crown className="w-3.5 h-3.5 text-purple-700" />
                                <span>Uji Coba 1x Selesai • Aktivasi Premium</span>
                              </button>
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
          }}
        />
      )}
    </div>
  );
}
