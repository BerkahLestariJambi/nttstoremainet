'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckoutButton from '@/components/CheckoutButton';
import { productService } from '@/services/productService';
import { cartService } from '@/services/cartService';
import { addressService, UserAddressData } from '@/services/addressService';
import { ArrowLeft, MapPin, Phone, User, PackageCheck, ShoppingBag, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function CheckoutFormContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product_id');
  const isDirectBuy = Boolean(productId);

  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<UserAddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddAddress, setShowAddAddress] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // State Form Alamat Baru
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Rumah',
    recipient_name: '',
    phone_number: '',
    full_address: '',
    city: '',
    postal_code: '',
  });

  // 1. Memuat Alamat Pembeli dari DB API
  const fetchAddresses = async () => {
    try {
      const res = await addressService.getAddresses();
      const list = res?.data || res || [];
      setAddresses(list);

      // Otomatis pilih alamat primary jika ada
      const primary = list.find((a: UserAddressData) => a.is_primary);
      if (primary) {
        setSelectedAddressId(primary.id);
      } else if (list.length > 0) {
        setSelectedAddressId(list[0].id);
      } else {
        setShowAddAddress(true); // Jika belum punya alamat, buka form tambah
      }
    } catch (err) {
      console.error('Gagal mengambil daftar alamat:', err);
    }
  };

  // 2. Memuat Produk (Direct Buy vs Cart DB)
  useEffect(() => {
    async function initData() {
      setLoading(true);
      await fetchAddresses();

      if (isDirectBuy && productId) {
        // Mode 1: Beli Langsung
        try {
          const res = await productService.getProductById(productId);
          const item = res?.data?.data || res?.data || res;
          if (item?.id) {
            setCheckoutItems([{
              product_id: Number(item.id),
              name: item.name,
              price_pi: Number(item.price_pi || item.price || 0),
              quantity: 1,
            }]);
          }
        } catch (err) {
          console.error('Error produk beli langsung:', err);
        }
      } else {
        // Mode 2: Dari Keranjang DB
        try {
          const res = await cartService.getCart();
          const list = res?.data || res || [];
          const selected = list.filter((i: any) => i.selected);
          setCheckoutItems(selected.map((i: any) => ({
            product_id: i.product_id,
            name: i.product?.name,
            price_pi: Number(i.product?.price_pi || 0),
            quantity: i.quantity,
          })));
        } catch (err) {
          console.error('Error membaca keranjang DB:', err);
        }
      }
      setLoading(false);
    }

    initData();
  }, [productId, isDirectBuy]);

  // Tambah Alamat Baru
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await addressService.createAddress({
        ...newAddressForm,
        is_primary: addresses.length === 0,
      });
      const created = res?.data || res;
      await fetchAddresses();
      if (created?.id) setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewAddressForm({ label: 'Rumah', recipient_name: '', phone_number: '', full_address: '', city: '', postal_code: '' });
    } catch (err) {
      console.error('Gagal menyimpan alamat baru:', err);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const totalAmountPi = checkoutItems.reduce((sum, item) => sum + item.price_pi * item.quantity, 0);

  if (loading) return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat detail checkout...</div>;

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Produk Dipilih</h2>
        <p className="text-xs text-gray-500 mb-6">Silakan pilih produk di keranjang belanja terlebih dahulu.</p>
        <Link href="/cart" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition">
          Buka Keranjang
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link href={isDirectBuy ? '/' : '/cart'} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> {isDirectBuy ? 'Batal' : 'Kembali ke Keranjang'}
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> Checkout Pembayaran
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BAGIAN ALAMAT PENGIRIMAN */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" /> Pilih Alamat Pengiriman
              </h2>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Alamat
              </button>
            </div>

            {/* List Alamat yang Tersedia */}
            {!showAddAddress && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex justify-between items-start ${
                      selectedAddressId === addr.id
                        ? 'border-amber-500 bg-amber-50/30'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">{addr.recipient_name}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{addr.label}</span>
                        {addr.is_primary && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Utama</span>}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{addr.phone_number}</p>
                      <p className="text-xs text-gray-500 mt-1">{addr.full_address} {addr.city && `, ${addr.city}`}</p>
                    </div>
                    {selectedAddressId === addr.id && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {/* Form Tambah Alamat Baru */}
            {showAddAddress && (
              <form onSubmit={handleSaveNewAddress} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Label (Rumah/Kantor)</label>
                    <input
                      type="text"
                      required
                      value={newAddressForm.label}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Nama Penerima *</label>
                    <input
                      type="text"
                      required
                      value={newAddressForm.recipient_name}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient_name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase">Nomor Telepon / WA *</label>
                  <input
                    type="tel"
                    required
                    value={newAddressForm.phone_number}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, phone_number: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase">Alamat Lengkap *</label>
                  <textarea
                    required
                    rows={2}
                    value={newAddressForm.full_address}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, full_address: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                    >
                      Batal
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md">
                    Simpan Alamat
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RINGKASAN PESANAN & BAYAR */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
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

          {selectedAddress ? (
            <CheckoutButton
              checkoutData={{
                recipient_name: selectedAddress.recipient_name,
                phone_number: selectedAddress.phone_number,
                shipping_address: selectedAddress.full_address,
                items: checkoutItems.map((item) => ({
                  product_id: item.product_id,
                  quantity: item.quantity,
                })),
                name: selectedAddress.recipient_name,
                phone: selectedAddress.phone_number,
                address: selectedAddress.full_address,
                product_id: checkoutItems[0]?.product_id,
                quantity: checkoutItems[0]?.quantity,
              } as any}
            />
          ) : (
            <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed text-xs">
              Pilih Alamat Pengiriman
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
