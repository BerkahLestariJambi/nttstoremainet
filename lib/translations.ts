export type LanguageCode = 'en' | 'id' | 'zh' | 'ja' | 'ar';

export const LANGUAGES: { code: LanguageCode; label: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'zh', label: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Badge & Auth
    piBrowserNative: 'Pi Browser Native',
    piOauthMode: 'Pi Sign-in OAuth Mode',
    connectedAs: 'Connected as',
    redirecting: 'Redirecting...',
    connectPiWallet: 'Connect Pi Wallet',
    signInWithPi: 'Sign in with Pi',
    externalBrowserHint: 'Using an external browser? Click Sign in with Pi to log in.',
    logout: 'Logout',

    // Home Page
    welcomeTitle: 'Welcome to NTTStore',
    heroSubtitle: 'Shopping center for authentic NTT products — Ikat Weaving, Flores Coffee, & Natural Goods using Pi Coin (π).',
    exploreProducts: 'Explore Products',
    featuredProducts: 'Featured NTT Products',

    // Navigation (BottomNav & Header)
    navHome: 'Home',
    navProducts: 'Products',
    navStores: 'Stores',
    navOrders: 'Orders',
    navSeller: 'Seller',
    navAccount: 'Account',

    // Products & Storefront
    allProducts: 'All Products',
    searchPlaceholder: 'Search Ikat weaving, Flores coffee, honey...',
    addToCart: 'Add to Cart',
    buyWithPi: 'Pay with Pi',
    outOfStock: 'Out of Stock',
    stock: 'Stock',
    price: 'Price',
    noProductsFound: 'No products found.',

    // Stores Directory (/stores)
    storeDirectoryTitle: 'NTTStorePi Partner Stores',
    storeDirectorySubtitle: 'Explore verified local merchants across East Nusa Tenggara.',
    visitStore: 'Visit Store',
    verifiedSeller: 'Verified Seller',
    noStoresYet: 'No stores registered yet.',

    // Seller Dashboard (/seller)
    sellerDashboard: 'Seller Dashboard',
    registerStoreTitle: 'Open Your Store on NTTStorePi',
    storeName: 'Store Name',
    storeDescription: 'Store Description',
    storeAddress: 'City / Regency in NTT',
    registerStoreBtn: 'Register Store',
    myProducts: 'My Store Products',
    addProduct: 'Add New Product',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete',
    productName: 'Product Name',
    productDesc: 'Description',
    productPricePi: 'Price (Pi)',
    productStock: 'Stock Quantity',
    productImage: 'Product Image',
    saveProduct: 'Save Product',
    cancel: 'Cancel',

    // Cart & Orders
    shoppingCart: 'Shopping Cart',
    emptyCart: 'Your cart is empty.',
    totalPayment: 'Total Payment',
    checkoutPi: 'Checkout with Pi Coin',
    orderHistory: 'Order History',
  },

  id: {
    // Badge & Auth
    piBrowserNative: 'Pi Browser Native',
    piOauthMode: 'Mode OAuth Pi Sign-in',
    connectedAs: 'Terhubung sebagai',
    redirecting: 'Mengalihkan...',
    connectPiWallet: 'Hubungkan Pi Wallet',
    signInWithPi: 'Sign in with Pi',
    externalBrowserHint: 'Menggunakan Browser Luar? Klik Sign in with Pi untuk masuk.',
    logout: 'Keluar',

    // Home Page
    welcomeTitle: 'Selamat Datang di NTTStore',
    heroSubtitle: 'Pusat belanja produk khas NTT — Tenun Ikat, Kopi Flores, & Hasil Alam menggunakan Pi Coin (π).',
    exploreProducts: 'Jelajahi Produk',
    featuredProducts: 'Produk Unggulan NTT',

    // Navigation (BottomNav & Header)
    navHome: 'Beranda',
    navProducts: 'Produk',
    navStores: 'Toko',
    navOrders: 'Pesanan',
    navSeller: 'Penjual',
    navAccount: 'Akun',

    // Products & Storefront
    allProducts: 'Semua Produk',
    searchPlaceholder: 'Cari tenun ikat, kopi Flores, madu hutan...',
    addToCart: 'Tambah ke Keranjang',
    buyWithPi: 'Bayar dengan Pi',
    outOfStock: 'Stok Habis',
    stock: 'Stok',
    price: 'Harga',
    noProductsFound: 'Produk tidak ditemukan.',

    // Stores Directory (/stores)
    storeDirectoryTitle: 'Direktori Toko Mitra NTTStorePi',
    storeDirectorySubtitle: 'Jelajahi penjual lokal terverifikasi dari seluruh Nusa Tenggara Timur.',
    visitStore: 'Kunjungi Toko',
    verifiedSeller: 'Penjual Terverifikasi',
    noStoresYet: 'Belum ada toko yang terdaftar.',

    // Seller Dashboard (/seller)
    sellerDashboard: 'Dashboard Penjual',
    registerStoreTitle: 'Buka Toko Anda di NTTStorePi',
    storeName: 'Nama Toko',
    storeDescription: 'Deskripsi Toko',
    storeAddress: 'Kota / Kabupaten di NTT',
    registerStoreBtn: 'Daftarkan Toko',
    myProducts: 'Produk Toko Saya',
    addProduct: 'Tambah Produk Baru',
    editProduct: 'Edit Produk',
    deleteProduct: 'Hapus',
    productName: 'Nama Produk',
    productDesc: 'Deskripsi',
    productPricePi: 'Harga (Pi)',
    productStock: 'Jumlah Stok',
    productImage: 'Foto Produk',
    saveProduct: 'Simpan Produk',
    cancel: 'Batal',

    // Cart & Orders
    shoppingCart: 'Keranjang Belanja',
    emptyCart: 'Keranjang belanja Anda kosong.',
    totalPayment: 'Total Pembayaran',
    checkoutPi: 'Bayar dengan Pi Coin',
    orderHistory: 'Riwayat Pesanan',
  },

  zh: {
    // Badge & Auth
    piBrowserNative: 'Pi 浏览器原生模式',
    piOauthMode: 'Pi OAuth 登录模式',
    connectedAs: '已连接账号',
    redirecting: '正在跳转...',
    connectPiWallet: '连接 Pi 钱包',
    signInWithPi: '使用 Pi 登录',
    externalBrowserHint: '正在使用外部浏览器？点击“使用 Pi 登录”进入。',
    logout: '退出登录',

    // Home Page
    welcomeTitle: '欢迎来到 NTTStore',
    heroSubtitle: '东努沙登加拉特色商品中心 — 传统伊卡特织布、弗洛勒斯咖啡及天然特产，支持 Pi 币 (π) 支付。',
    exploreProducts: '浏览商品',
    featuredProducts: 'NTT 精选商品',

    // Navigation
    navHome: '首页',
    navProducts: '商品',
    navStores: '店铺',
    navOrders: '订单',
    navSeller: '卖家',
    navAccount: '账户',

    // Products & Storefront
    allProducts: '全部商品',
    searchPlaceholder: '搜索伊卡特织布、弗洛勒斯咖啡、蜂蜜...',
    addToCart: '加入购物车',
    buyWithPi: '使用 Pi 支付',
    outOfStock: '暂时缺货',
    stock: '库存',
    price: '价格',
    noProductsFound: '未找到相关商品。',

    // Stores Directory
    storeDirectoryTitle: 'NTTStorePi 合作店铺',
    storeDirectorySubtitle: '探索来自东努沙登加拉各地的认证本地商家。',
    visitStore: '进入店铺',
    verifiedSeller: '认证卖家',
    noStoresYet: '暂无注册店铺。',

    // Seller Dashboard
    sellerDashboard: '卖家中心',
    registerStoreTitle: '在 NTTStorePi 开设您的店铺',
    storeName: '店铺名称',
    storeDescription: '店铺简介',
    storeAddress: 'NTT 所在城市/县',
    registerStoreBtn: '注册店铺',
    myProducts: '我的店铺商品',
    addProduct: '添加新商品',
    editProduct: '编辑商品',
    deleteProduct: '删除',
    productName: '商品名称',
    productDesc: '商品描述',
    productPricePi: '价格 (Pi)',
    productStock: '库存数量',
    productImage: '商品图片',
    saveProduct: '保存商品',
    cancel: '取消',

    // Cart & Orders
    shoppingCart: '购物车',
    emptyCart: '您的购物车是空的。',
    totalPayment: '应付总额',
    checkoutPi: '使用 Pi 币结账',
    orderHistory: '订单记录',
  },

  ja: {
    // Badge & Auth
    piBrowserNative: 'Pi ブラウザネイティブ',
    piOauthMode: 'Pi OAuth サインインモード',
    connectedAs: '接続中のアカウント',
    redirecting: 'リダイレクト中...',
    connectPiWallet: 'Pi ウォレットを接続',
    signInWithPi: 'Pi でサインイン',
    externalBrowserHint: '外部ブラウザをご利用ですか？「Pi でサインイン」をクリックしてください。',
    logout: 'ログアウト',

    // Home Page
    welcomeTitle: 'NTTStore へようこそ',
    heroSubtitle: '東ヌサ・トゥンガラ州の特産品マーケット — イカット織物、フローレスコーヒー、自然の恵みを Pi コイン (π) で。',
    exploreProducts: '商品を見る',
    featuredProducts: 'NTT おすすめ商品',

    // Navigation
    navHome: 'ホーム',
    navProducts: '商品一覧',
    navStores: '店舗一覧',
    navOrders: '注文履歴',
    navSeller: '出品者',
    navAccount: 'アカウント',

    // Products & Storefront
    allProducts: 'すべての商品',
    searchPlaceholder: 'イカット織物、フローレスコーヒー、蜂蜜を検索...',
    addToCart: 'カートに追加',
    buyWithPi: 'Pi で支払う',
    outOfStock: '在庫切れ',
    stock: '在庫',
    price: '価格',
    noProductsFound: '商品が見つかりませんでした。',

    // Stores Directory
    storeDirectoryTitle: 'NTTStorePi パートナー店舗',
    storeDirectorySubtitle: '東ヌサ・トゥンガラ州の認証済みローカルショップを探そう。',
    visitStore: '店舗を見る',
    verifiedSeller: '認証済み出品者',
    noStoresYet: '登録されている店舗はまだありません。',

    // Seller Dashboard
    sellerDashboard: '出品者ダッシュボード',
    registerStoreTitle: 'NTTStorePi で店舗を開設する',
    storeName: '店舗名',
    storeDescription: '店舗の説明',
    storeAddress: 'NTT州内の都市・県',
    registerStoreBtn: '店舗を登録する',
    myProducts: 'マイショップの商品',
    addProduct: '新規商品を追加',
    editProduct: '商品を編集',
    deleteProduct: '削除',
    productName: '商品名',
    productDesc: '商品説明',
    productPricePi: '価格 (Pi)',
    productStock: '在庫数',
    productImage: '商品画像',
    saveProduct: '商品を保存',
    cancel: 'キャンセル',

    // Cart & Orders
    shoppingCart: 'ショッピングカート',
    emptyCart: 'カートに商品は入っていません。',
    totalPayment: 'お支払い合計',
    checkoutPi: 'Pi コインで決済する',
    orderHistory: '注文履歴',
  },

  ar: {
    // Badge & Auth
    piBrowserNative: 'متصفح Pi الأصلي',
    piOauthMode: 'وضع تسجيل الدخول Pi OAuth',
    connectedAs: 'متصل باسم',
    redirecting: 'جاري التوجيه...',
    connectPiWallet: 'ربط محفظة Pi',
    signInWithPi: 'تسجيل الدخول باستخدام Pi',
    externalBrowserHint: 'هل تستخدم متصفحًا خارجيًا؟ انقر على تسجيل الدخول باستخدام Pi.',
    logout: 'تسجيل الخروج',

    // Home Page
    welcomeTitle: 'مرحبًا بكم في NTTStore',
    heroSubtitle: 'مركز تسوق منتجات NTT الأصيلة — منسوجات الإيكات، قهوة فلوريس، والمنتجات الطبيعية باستخدام عملة Pi (π).',
    exploreProducts: 'استكشف المنتجات',
    featuredProducts: 'منتجات NTT المميزة',

    // Navigation
    navHome: 'الرئيسية',
    navProducts: 'المنتجات',
    navStores: 'المتاجر',
    navOrders: 'الطلبات',
    navSeller: 'البائع',
    navAccount: 'الحساب',

    // Products & Storefront
    allProducts: 'جميع المنتجات',
    searchPlaceholder: 'ابحث عن منسوجات الإيكات، قهوة فلوريس، العسل...',
    addToCart: 'أضف إلى السلة',
    buyWithPi: 'ادفع بواسطة Pi',
    outOfStock: 'نفدت الكمية',
    stock: 'المخزون',
    price: 'السعر',
    noProductsFound: 'لم يتم العثور على منتجات.',

    // Stores Directory
    storeDirectoryTitle: 'متاجر شركاء NTTStorePi',
    storeDirectorySubtitle: 'اكتشف المتاجر المحلية المعتمدة في جميع أنحاء نوسا تنجارا الشرقية.',
    visitStore: 'زيارة المتجر',
    verifiedSeller: 'بائع معتمد',
    noStoresYet: 'لا توجد متاجر مسجلة بعد.',

    // Seller Dashboard
    sellerDashboard: 'لوحة تحكم البائع',
    registerStoreTitle: 'افتح متجرك على NTTStorePi',
    storeName: 'اسم المتجر',
    storeDescription: 'وصف المتجر',
    storeAddress: 'المدينة / المنطقة في NTT',
    registerStoreBtn: 'تسجيل المتجر',
    myProducts: 'منتجات متجري',
    addProduct: 'إضافة منتج جديد',
    editProduct: 'تعديل المنتج',
    deleteProduct: 'حذف',
    productName: 'اسم المنتج',
    productDesc: 'الوصف',
    productPricePi: 'السعر (Pi)',
    productStock: 'الكمية المتوفرة',
    productImage: 'صورة المنتج',
    saveProduct: 'حفظ المنتج',
    cancel: 'إلغاء',

    // Cart & Orders
    shoppingCart: 'سلة التسوق',
    emptyCart: 'سلة التسوق فارغة.',
    totalPayment: 'إجمالي الدفع',
    checkoutPi: 'الدفع بعملة Pi',
    orderHistory: 'سجل الطلبات',
  },
};
