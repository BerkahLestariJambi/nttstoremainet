<Link
  href="/chat"
  className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 transition"
>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
      <MessageCircle className="w-5 h-5" />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-900">{t('navChat')}</p>
      <p className="text-xs text-gray-500">NTTStorePi</p>
    </div>
  </div>
  <ChevronRight className="w-4 h-4 text-gray-400" />
</Link>
