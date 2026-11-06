'use client';

import { useState } from 'react';
import { X, QrCode, Smartphone, ExternalLink } from 'lucide-react';

interface PiSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  piSignUrl: string;
}

export default function PiSignModal({ isOpen, onClose, piSignUrl }: PiSignModalProps) {
  if (!isOpen) return null;

  // Menggunakan API QR Code publik untuk membuat QR secara dinamis
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    piSignUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-gray-900">Scan via Pi Wallet</h3>
        <p className="text-xs text-gray-500 mt-1">
          Scan QR Code ini menggunakan pemindai di **Pi Browser / Pi Wallet App** untuk masuk & bertransaksi.
        </p>

        {/* QR Code Container */}
        <div className="my-5 p-3 bg-gray-50 rounded-2xl border border-gray-100 inline-block">
          <img src={qrImageUrl} alt="Pi Sign QR Code" className="w-48 h-48 mx-auto rounded-lg" />
        </div>

        <div className="space-y-2">
          <a
            href={`pi://wallet/connect?url=${encodeURIComponent(piSignUrl)}`}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Smartphone className="w-4 h-4" /> Buka di Pi Browser <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
