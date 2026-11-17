'use client';

import React, { useState } from 'react';
import { Star, UploadCloud, X, Loader2, Film, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '@/context/LanguageContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  productId: number;
  productName: string;
  productImage?: string;
  onSuccess: (reviewData: any) => void;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export default function ReviewModal({
  isOpen,
  onClose,
  orderId,
  productId,
  productName,
  productImage,
  onSuccess,
}: ReviewModalProps) {
  const { t } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [mediaFiles, setMediaFiles] = useState<PreviewFile[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    if (mediaFiles.length + selected.length > 5) {
      Swal.fire('Maksimal 5 File', 'Anda hanya dapat mengunggah maksimal 5 foto/video.', 'warning');
      return;
    }

    const validPreviews: PreviewFile[] = [];
    for (const file of selected) {
      if (file.size > 25 * 1024 * 1024) {
        Swal.fire('Ukuran Terlalu Besar', `File "${file.name}" melebihi batas 25MB.`, 'warning');
        continue;
      }

      const isVideo = file.type.startsWith('video/');
      validPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
      });
    }

    setMediaFiles((prev) => [...prev, ...validPreviews]);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('order_id', String(orderId));
      formData.append('product_id', String(productId));
      formData.append('rating', String(rating));
      if (comment.trim()) {
        formData.append('comment', comment.trim());
      }

      mediaFiles.forEach((item) => {
        formData.append('media[]', item.file);
      });

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('pi_access_token') || localStorage.getItem('token')
          : null;

      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Gagal mengirim ulasan.');
      }

      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: json.message || 'Ulasan produk berhasil dikirim!',
        timer: 1600,
        showConfirmButton: false,
      });

      // Bersihkan state
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      setMediaFiles([]);
      setComment('');
      setRating(5);

      onSuccess(json.data);
      onClose();
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err?.message || 'Terjadi kesalahan saat mengirim ulasan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Sangat Buruk / Produk Rusak',
    2: 'Kurang Memuaskan',
    3: 'Cukup Baik',
    4: 'Bagus & Sesuai',
    5: 'Sangat Bagus & Berkualitas!',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Produk */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          {productImage && (
            <img
              src={productImage}
              alt={productName}
              className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0"
            />
          )}
          <div className="pr-6">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Pembelian Terverifikasi
            </span>
            <h3 className="font-bold text-gray-900 text-base line-clamp-1 mt-1">{productName}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Input Rating Bintang */}
          <div className="text-center bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-gray-700 mb-2">Bagaimana kualitas produk ini?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-bold text-amber-700 mt-1.5">
              {ratingLabels[hoverRating || rating]}
            </p>
          </div>

          {/* Input Ulasan Teks */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tulis Ulasan / Testimoni Produk
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda: apakah kualitas produk bagus, kemasan aman, atau ada bagian yang rusak..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Upload Foto / Video Bukti */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Upload Foto atau Video Produk (Maks. 5 file, @25MB)
            </label>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-amber-500 bg-gray-50/70 hover:bg-amber-50/30 rounded-2xl p-4 cursor-pointer transition">
              <UploadCloud className="w-6 h-6 text-amber-600 mb-1" />
              <span className="text-xs font-bold text-gray-700">
                Pilih Foto (JPG/PNG) atau Video (MP4/MOV)
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                Lampirkan bukti video unboxing jika produk rusak atau testimoni kualitas produk
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Preview Foto & Video Terpilih */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                {mediaFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-black group"
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <img
                        src={item.previewUrl}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      {item.type === 'video' ? (
                        <>
                          <Film className="w-2.5 h-2.5" /> Video
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-2.5 h-2.5" /> Foto
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tombol Kirim */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Kirim Ulasan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
