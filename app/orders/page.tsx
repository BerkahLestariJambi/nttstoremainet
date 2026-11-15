'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { useLanguage } from '@/context/LanguageContext';
import { Package, Clock, CheckCircle2, ArrowLeft, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: number;
  quantity: number;
  price_pi: string;
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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
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
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap justify-between items-center text-xs pb-3 border-b border-gray-100 gap-2">
                <div>
                  <span className="font-bold text-gray-900">{t('orderNumberLabel')} #{order.order_number || order.id}</span>
                  <span className="text-gray-400 ml-2">
                    {new Date(order.created_at).toLocaleDateString(DATE_LOCALES[language] || 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Daftar Items */}
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">
                      {item.product?.name || `${t('productFallbackLabel')} #${item.id}`} <span className="text-gray-400 text-xs">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-amber-600">π {item.price_pi}</span>
                  </div>
                ))}
              </div>

              {/* Rincian Total & Alamat */}
              <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1 text-gray-600 border border-gray-100">
                <p><strong className="text-gray-800">{t('recipientLabel')}:</strong> {order.recipient_name} ({order.phone_number})</p>
                <p><strong className="text-gray-800">{t('addressLabel')}:</strong> {order.shipping_address}</p>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="font-bold text-gray-700">{t('totalTransactionLabel')}</span>
                <span className="text-base font-extrabold text-amber-600">π {order.total_amount_pi}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
