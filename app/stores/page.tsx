'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, Search, MapPin, Package, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface RegisteredStore {
  id: number;
  store_name: string;
  description?: string;
  city?: string;
  address?: string;
  logo_url?: string;
  products_count?: number;
  status?: string;
}

export default function StoresDirectoryPage() {
  const [stores, setStores] = useState<RegisteredStore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/sellers`);
        const json = await res.json();
        const list = json.data || json || [];
        setStores(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Gagal mengambil daftar toko:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [API_BASE_URL]);

  const filteredStores = stores.filter((s) =>
    (s.store_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header Halaman Store */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-500" /> Toko Terdaftar NTTStorePi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Jelajahi merchant dan pelaku UMKM NTT yang sudah terverifikasi menerima Pi Coin.
          </p>
        </div>

        {/* Tombol Kelola Toko Saya */}
        <Link
          href="/seller/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition shadow-sm"
        >
          <span>Kelola Toko Saya</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Kolom Pencarian Toko */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama toko di NTT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        />
      </div>

      {/* Daftar Kartu Toko */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-medium">Memuat daftar toko terdaftar...</span>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400">
          <Store className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">Belum ada toko terdaftar yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden text-amber-600 font-black text-lg">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    store.store_name?.charAt(0).toUpperCase() || 'T'
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {store.store_name}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {store.description || 'Merchant resmi produk lokal NTT.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {store.city || store.address || 'Nusa Tenggara Timur'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      <Package className="w-3 h-3" />
                      {store.products_count ?? 0} Produk
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <Link
                  href={`/?seller_id=${store.id}`}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
                >
                  <span>Lihat Produk Toko</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
