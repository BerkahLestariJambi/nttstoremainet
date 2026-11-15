'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Store, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around relative">
        
        {/* 1. Menu Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            isActive('/') ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className={`w-5 h-5 ${isActive('/') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-1">{t('navHome')}</span>
        </Link>

        {/* 2. Menu Order */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            isActive('/orders') ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ClipboardList
            className={`w-5 h-5 ${isActive('/orders') ? 'stroke-[2.5px]' : 'stroke-2'}`}
          />
          <span className="text-[10px] font-bold mt-1">{t('navOrders')}</span>
        </Link>

        {/* 3. Menu Store (Tengah - Daftar Toko Terdaftar) */}
        <div className="relative -top-5 flex flex-col items-center">
          <Link
            href="/stores"
            aria-label={t('storeDirectoryTitle')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition transform active:scale-95 ${
              isActive('/stores')
                ? 'bg-purple-700 text-white shadow-purple-200'
                : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-amber-200 hover:from-amber-600 hover:to-amber-500'
            }`}
          >
            <Store className="w-6 h-6 stroke-[2.2px]" />
          </Link>
          <span
            className={`text-[10px] font-extrabold mt-1 ${
              isActive('/stores') ? 'text-purple-700' : 'text-amber-600'
            }`}
          >
            {t('navStores')}
          </span>
        </div>

        {/* 4. Menu Chat */}
        <Link
          href="/chat"
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            isActive('/chat') ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <MessageCircle
            className={`w-5 h-5 ${isActive('/chat') ? 'stroke-[2.5px]' : 'stroke-2'}`}
          />
          <span className="text-[10px] font-bold mt-1">{t('navChat')}</span>
        </Link>

        {/* 5. Menu Account */}
        <Link
          href="/account"
          className={`flex flex-col items-center justify-center w-14 h-full transition ${
            isActive('/account') ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User className={`w-5 h-5 ${isActive('/account') ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold mt-1">{t('navProfile')}</span>
        </Link>

      </div>
    </nav>
  );
}
