'use client';


import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckoutButton from '@/components/CheckoutButton';
import { productService } from '@/services/productService';
import { ArrowLeft, MapPin, Phone, User, PackageCheck, ShoppingBag, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function CheckoutFormContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product_id');

  // Mode Alur Transaksi
  const isDirectBuy = Boolean(productId);

  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [form, setForm] = useState({
    recipient_name: '',
    phone_number: '',
    shipping_address: '',
  });

  useEffect(() => {
    async function initCheckout() {
      setLoading(true);

      // ==========================================
      // ALUR 1: BELI LANGSUNG (Single Product)
      // ==========================================
      if (isDirectBuy && productId) {
        try {
          const res = await productService.getProductById(productId);
          const item = res?.data?.data || res?.data || res;

          if (item && item.id) {
            setCheckoutItems([
              {
                product_id: Number(item.id),
                name: item.name,
                price_pi: Number(item.price_pi || item.price || 0),
                quantity: 1,
              },
            ]);
          } else {
            setCheckoutItems([]);
          }
        } catch (err) {
          console.error('Gagal mengambil data produk beli langsung:', err);
          setCheckoutItems([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      // ==========================================
      // ALUR 2: CHECKOUT DARI KERANJANG
      // ==========================================
      try {
        const storedCart = localStorage.getItem('checkout_cart_items');
        if (storedCart) {
          const parsedItems = JSON.parse(storedCart);
          setCheckoutItems(parsedItems);
        } else {
          setCheckoutItems([]);
        }
      } catch (err) {
        console.error('Gagal membaca data keranjang untuk checkout:', err);
        setCheckoutItems([]);
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [productId, isDirectBuy]);

  const totalAmountPi = checkoutItems.reduce((sum, item) => sum + item.price_pi * item.quantity, 0);

  if (loading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat halaman checkout...</div>;
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {isDirectBuy ? 'Produk Tidak Ditemukan' : 'Tidak Ada Produk Dipilih'}
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          {isDirectBuy ? 'Produk tidak tersedia.' : 'Silakan pilih produk dari keranjang belanja terlebih dahulu.'}
        </p>
        <Link
          href={isDirectBuy ? '/' : '/cart'}
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-md shadow-amber-200"
        >
          {isDirectBuy ? 'Kembali Beranda' : 'Buka Keranjang'}
        </Link>
      </div>
    );
  }

  const isFormValid =
    form.recipient_name.trim() !== '' &&
    form.phone_number.trim() !== '' &&
    form.shipping_address.trim() !== '';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href={isDirectBuy ? '/' : '/cart'}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> {isDirectBuy ? 'Batal & Kembali' : 'Kembali ke Keranjang'}
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> Form Pengiriman & Pembayaran
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
                placeholder="Masukkan nama lengkap"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alamat Pengiriman *</label>
            <textarea
              rows={3}
              placeholder="Alamat lengkap pengiriman..."
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Ringkasan & Pembayaran */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-500" /> Ringkasan Pembayaran
          </h2>

          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1 space-y-2">
            {checkoutItems.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-gray-800 text-xs line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.quantity} x π {item.price_pi}</p>
                </div>
                <span className="text-xs font-bold text-amber-600 whitespace-nowrap">
                  π {(item.price_pi * item.quantity).toFixed(4)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">Total Tagihan</span>
            <span className="text-base font-extrabold text-amber-600">π {totalAmountPi.toFixed(4)}</span>
          </div>

          {isFormValid ? (
            <CheckoutButton
              checkoutData={{
                recipient_name: form.recipient_name,
                phone_number: form.phone_number,
                shipping_address: form.shipping_address,
                items: checkoutItems.map((item) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                })),
                name: form.recipient_name,
                phone: form.phone_number,
                address: form.shipping_address,
                product_id: checkoutItems[0]?.product_id,
                quantity: checkoutItems[0]?.quantity,
              } as any}
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
      <CheckoutFormContent />
    </Suspense>
  );
}
