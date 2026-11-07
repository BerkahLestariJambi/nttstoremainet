'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Pastikan import useRouter ada
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const router = useRouter(); // Perbaikan: ubah Router() menjadi useRouter()
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Load data keranjang dari localStorage
  useEffect(() => {
    try {
      const rawCart =
        localStorage.getItem('cart') ||
        localStorage.getItem('cartItems') ||
        localStorage.getItem('cart_items') ||
        localStorage.getItem('nttstorepi_cart');

      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        const list = Array.isArray(parsed) ? parsed : parsed?.items || [];
        
        // Tambahkan properti selected: true secara default jika belum ada
        setCartItems(
          list.map((item: any) => ({
            ...item,
            id: Number(item.id || item.product_id || item.product?.id),
            name: item.name || item.product?.name || 'Produk',
            price_pi: Number(item.price_pi || item.price || item.product?.price_pi || 0),
            quantity: Number(item.quantity || item.qty || 1),
            selected: item.selected !== false,
          }))
        );
      }
    } catch (error) {
      console.error('Gagal memuat keranjang:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update localStorage setiap ada perubahan item
  const updateLocalStorage = (updatedItems: any[]) => {
    setCartItems(updatedItems);
    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
  };

  // Toggle checklist barang
  const toggleSelect = (id: number) => {
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    updateLocalStorage(updated);
  };

  // Ubah jumlah quantity
  const updateQuantity = (id: number, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
      .filter(Boolean);
    updateLocalStorage(updated);
  };

  // Hapus item dari keranjang
  const removeItem = (id: number) => {
    const updated = cartItems.filter((item) => item.id !== id);
    updateLocalStorage(updated);
  };

  // Hitung item yang dipilih
  const selectedItems = cartItems.filter((item) => item.selected);
  const totalAmountPi = selectedItems.reduce(
    (sum, item) => sum + item.price_pi * item.quantity,
    0
  );

  // Proses Lanjut ke Checkout Keranjang
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    
    // Simpan item yang dipilih ke key 'checkout_cart_items'
    localStorage.setItem('checkout_cart_items', JSON.stringify(selectedItems));
    
    // Redirect ke halaman checkout
    router.push('/checkout');
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Memuat keranjang...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
        <ShoppingBag className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-gray-500 mb-6">Anda belum menambahkan produk ke dalam keranjang.</p>
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition shadow-md shadow-amber-200"
        >
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Lanjut Belanja
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7 text-amber-500" /> Keranjang Belanja
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* List Produk Keranjang */}
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleSelect(item.id)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                <p className="text-xs font-semibold text-amber-600 mt-1">π {item.price_pi}</p>
              </div>
              
              {/* Counter Qty */}
              <div className="flex items-center border border-gray-200 rounded-xl px-2 py-1 gap-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-500 hover:text-amber-600">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-gray-800">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-500 hover:text-amber-600">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hapus Item */}
              <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Ringkasan Belanja Keranjang */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Ringkasan Keranjang</h2>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Barang Dipilih ({selectedItems.length})</span>
            <span className="font-bold text-gray-800">π {totalAmountPi.toFixed(4)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700">Total Tagihan</span>
            <span className="text-base font-extrabold text-amber-600">π {totalAmountPi.toFixed(4)}</span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={selectedItems.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
          >
            Lanjut ke Checkout ({selectedItems.length}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
