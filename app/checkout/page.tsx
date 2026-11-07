'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckoutButton from '@/components/CheckoutButton';
import { productService } from '@/services/productService';
import { ArrowLeft, MapPin, Phone, User, PackageCheck, ShoppingBag } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product_id');

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [form, setForm] = useState({
    recipient_name: '',
    phone_number: '',
    shipping_address: '',
  });

  useEffect(() => {
    if (productId) {
      productService
        .getProductById(productId)
        .then((res) => setProduct(res.data || res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [productId]);

  if (loading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat data checkout...</div>;
  }

  const isFormValid =
    form.recipient_name.trim() !== '' &&
    form.phone_number.trim() !== '' &&
    form.shipping_address.trim() !== '' &&
    product;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> Checkout Produk
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Alamat Penerima */}
        <div className="md:col-span-2 space-y-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2 border-b border-gray-100 pb-3">
            <MapPin className="w-5 h-5 text-amber-500" /> Informasi Alamat Penerima
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Penerima *</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Masukkan nama lengkap penerima"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nomor Telepon / WA *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="tel"
                placeholder="081234567890"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alamat Pengiriman *</label>
            <textarea
              rows={3}
              placeholder="Alamat lengkap tujuan pengiriman..."
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Ringkasan & Tombol Eksekusi Pi Payment */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-500" /> Ringkasan
          </h2>

          {product ? (
            <div className="py-2">
              <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
              <p className="text-xs text-gray-400">1 Barang</p>
              <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Total Tagihan</span>
                <span className="text-base font-extrabold text-amber-600">π {product.price_pi}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-500">Tidak ada produk yang dipilih.</p>
          )}

          {isFormValid ? (
            <CheckoutButton
              checkoutData={{
                recipient_name: form.recipient_name,
                phone_number: form.phone_number,
                shipping_address: form.shipping_address,
                items: [{ product_id: Number(product.id), quantity: 1 }],
              }}
            />
          ) : (
            <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed text-xs">
              Lengkapi Form Alamat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
