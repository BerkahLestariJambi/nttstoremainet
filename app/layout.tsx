import '@/app/globals.css';
import Script from 'next/script';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/BottomNav';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import logoNtt from './logonttstorepi.ico';

export const metadata = {
  title: 'NTTStorePi - Toko Online Khas NTT',
  description: 'Belanja Tenun Ikat & Kopi Flores dengan Pi Coin',
  icons: {
    icon: logoNtt.src,
    shortcut: logoNtt.src,
    apple: logoNtt.src,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Mengisi Script Pi SDK secara global */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans min-h-screen flex flex-col antialiased">
        <LanguageProvider>
          <CartProvider>
            {/* Header & Menu Utama */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>

            {/* Footer Utama (pb-28 di mobile agar tidak tertutup BottomNav) */}
            <footer className="relative z-10 border-t border-gray-200 bg-white pt-6 pb-28 md:pb-6 text-center text-xs text-gray-500 mt-auto">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="font-medium text-gray-600">
                  © {new Date().getFullYear()} NTTStorePi. Powered by Pi Network.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 text-gray-400">
                  <span>Tenun Ikat</span>
                  <span>•</span>
                  <span>Kopi Flores</span>
                  <span>•</span>
                  <span>Hasil Alam NTT</span>
                </div>

                {/* Tautan Legal Wajib untuk Verifikasi Pi Network Mainnet */}
                <div className="flex items-center justify-center gap-3 font-bold text-gray-700">
                  <Link
                    href="/privacy-policy"
                    className="hover:text-amber-600 underline decoration-gray-300 underline-offset-4 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href="/terms-of-service"
                    className="hover:text-amber-600 underline decoration-gray-300 underline-offset-4 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </footer>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
