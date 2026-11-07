'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { Package, Clock, CheckCircle2, ArrowLeft, Store } from 'lucide-react';

interface OrderItem {
  id: number;
  quantity: number;
  price_pi: string;
  product?: {
    id: number;
    name: string;
  };
}

interface SellerOrder {
  id: number;
  order_number: string;
  total_amount_pi: string;
  status: string;
  recipient_name: string;
  phone_number: string;
  shipping_address: string;
  created_at: string;
  user?: {
    name: string;
  };
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    orderService
      .getSellerOrders()
      .then((res) => {
        const data = res?.data || res;
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Gagal mengambil pesanan seller:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <Store className="w-7 h-7 text-amber-500" /> Pesanan Masuk Toko
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-gray-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center bg-white border border-gray-100 rounded-3xl shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 mb-1">Belum Ada Pesanan Masuk</h3>
          <p className="text-xs text-gray-500">Pesanan dari pembeli akan otomatis muncul di sini setelah pembayaran Pi Coin terverifikasi.</p>
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
                  <span className="font-bold text-gray-900">Pembeli: {order.user?.name || 'User Pi'}</span>
                  <span className="text-gray-400 ml-2">#{order.order_number || order.id}</span>
                </div>
                {order.status === 'paid' || order.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pembayaran Lunas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> {order.status}
                  </span>
                )}
              </div>

              {/* Rincian Produk */}
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 font-medium">
                      {item.product?.name || `Produk #${item.id}`} x{item.quantity}
                    </span>
                    <span className="font-bold text-amber-600">π {item.price_pi}</span>
                  </div>
                ))}
              </div>

              {/* Alamat Pengiriman */}
              <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1 text-gray-600 border border-gray-100">
                <p><strong className="text-gray-800">Tujuan Pengiriman:</strong> {order.recipient_name} ({order.phone_number})</p>
                <p><strong className="text-gray-800">Alamat:</strong> {order.shipping_address}</p>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="font-bold text-gray-700">Total Diterima</span>
                <span className="text-base font-extrabold text-amber-600">π {order.total_amount_pi}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
