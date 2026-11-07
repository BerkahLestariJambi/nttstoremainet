'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { ArrowLeft, PackagePlus, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingCategories, setFetchingCategories] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State untuk Preview & File Gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price_pi: '',
    stock: '',
  });

  useEffect(() => {
    productService
      .getCategories()
      .then((res) => {
        const catList = res.data || res;
        setCategories(catList);
      })
      .catch((err) => {
        console.error('Gagal memuat kategori:', err);
        setErrorMessage('Gagal memuat daftar kategori dari server.');
      })
      .finally(() => setFetchingCategories(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  // Handler Pilih File Gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 2MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // Bungkus data ke FormData untuk pengiriman file binary
      const bodyFormData = new FormData();
      bodyFormData.append('name', formData.name);
      bodyFormData.append('category_id', formData.category_id);
      bodyFormData.append('description', formData.description);
      bodyFormData.append('price_pi', formData.price_pi);
      bodyFormData.append('stock', formData.stock);

      if (imageFile) {
        bodyFormData.append('image', imageFile);
      }

      const res = await productService.createProduct(bodyFormData);

      if (res.success || res.data) {
        alert('Produk berhasil ditambahkan!');
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Gagal menambahkan produk. Pastikan Anda sudah terdaftar sebagai Seller dan akun disetujui.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <PackagePlus className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Tambah Produk Baru</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Unggah produk lokal khas NTT Anda untuk dijual menggunakan Pi Coin (π).
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Contoh: Kain Tenun Ikat Sumba Motifs Pasola"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none transition text-sm"
            />
          </div>

          {/* Grid Kategori & Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kategori Produk <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                disabled={fetchingCategories}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white transition text-sm disabled:bg-gray-50"
              >
                <option value="">
                  {fetchingCategories ? 'Memuat kategori...' : '-- Pilih Kategori --'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Stok Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                required
                min="1"
                placeholder="10"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Harga Pi Coin */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Harga Produk (π Pi Coin) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-700 font-extrabold text-base">
                π
              </span>
              <input
                type="number"
                step="any"
                name="price_pi"
                required
                placeholder="0.05"
                value={formData.price_pi}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-3.5 border border-purple-200 bg-purple-50/30 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none font-bold text-purple-900 transition text-sm"
              />
            </div>
          </div>

          {/* Area Upload File Gambar */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Foto Produk (Upload File)
            </label>

            {imagePreview ? (
              <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-gray-200 group bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Preview Produk"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md"
                  title="Hapus Gambar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 hover:border-purple-500 bg-gray-50/50 hover:bg-purple-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                <div className="p-3 bg-white rounded-full shadow-xs mb-2">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-gray-700 mb-1">
                  Klik untuk pilih atau tarik foto produk di sini
                </span>
                <span className="text-[10px] text-gray-400">
                  Format: PNG, JPG, WEBP (Maksimal 2MB)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Deskripsi Produk */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Deskripsi Produk <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Jelaskan detail produk, seperti ukuran kain, asal daerah (misal: Sumba/Flores/Timor), dan keunikannya..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:outline-none transition text-sm"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              'Mengunggah & Menyimpan Produk...'
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Terbitkan Produk ke Marketplace
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
