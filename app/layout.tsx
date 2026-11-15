import '@/app/globals.css';
import Script from 'next/script';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/BottomNav';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata = {
  title: 'NTTStorePi - Toko Online Khas NTT',
  description: 'Belanja Tenun Ikat & Kopi Flores dengan Pi Coin',
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
      <body className="bg-gray-50 text-gray-900 font-sans min-h-screen flex flex-col antialiased pb-24 md:pb-0">
        <LanguageProvider>
          <CartProvider>
            {/* Header & Menu Utama */}
            <Navbar />
            
            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>

            {/* Simple Clean Footer */}
            <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>© {new Date().getFullYear()} NTTStorePi. Powered by Pi Network.</p>
                <div className="flex gap-4">
                  <span>Tenun Ikat</span>
                  <span>•</span>
                  <span>Kopi Flores</span>
                  <span>•</span>
                  <span>Hasil Alam NTT</span>
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
