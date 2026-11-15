'use client';

import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES, LanguageCode } from '@/lib/translations';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1.5 bg-white/95 border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm">
      <Globe className="w-4 h-4 text-purple-700" />
      <select
        aria-label="Select Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
