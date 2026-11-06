'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-amber-700">
          NTTStore<span className="text-purple-600">Pi</span>
        </Link>
      </div>
    </nav>
  );
}
