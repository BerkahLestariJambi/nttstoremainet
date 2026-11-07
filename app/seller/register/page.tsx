'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sellerService } from '@/services/sellerService';
import { ArrowLeft, Store, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterSellerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    phone_number: '',
    address: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // ✅ Dipanggil menggunakan method register yang sesuai dengan services/sellerService.ts
      const res = await sellerService.register(formData);

      if (res.success || res.message) {
        alert('Pendaftaran seller berhasil! Akun Anda siap digunakan.');
        router.push('/seller/products/create');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Gagal mendaftar sebagai seller. Pastikan Anda sudah login.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Buka Toko / Daftar Seller</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Mulai pasarkan kerajinan dan produk unggulan NTT ke komunitas Pi Network.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Nama Toko / Usaha <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="store_name"
              required
              placeholder="Contoh: Tenun Ikat NTT Official"
              value={formData.store_name}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Nomor WhatsApp / HP <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              required
              placeholder="081234567890"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Alamat Lengkap Toko / Pengiriman <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              required
              rows={3}
              placeholder="Jl. El Tari No. 12, Kupang, Nusa Tenggara Timur"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Deskripsi Singkat Toko
            </label>
            <textarea
              name="store_description"
              rows={3}
              placeholder="Spesialisasi pengrajin kain tenun ikat asli Flores dan Sumba..."
              value={formData.store_description}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg shadow-amber-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              'Memproses Pendaftaran...'
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Daftar Toko Sekarang
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
