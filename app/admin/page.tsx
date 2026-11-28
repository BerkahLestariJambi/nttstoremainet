'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  Package,
  ShoppingBag,
  Coins,
  LayoutDashboard,
  Search,
  Loader2,
  Trash2,
  Zap,
  Image as ImageIcon,
  RefreshCw,
  Store,
  UserCheck,
  Crown,
  Truck,
  AlertCircle,
  Tags,
  Plus,
  Pencil,
  Check,
  X,
  FileText,
  Save,
  Eye,
  Edit3,
  ExternalLink,
  Heading2,
  List,
  Bold,
  Type,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiClient } from '@/lib/apiClient';
import { useLanguage } from '@/context/LanguageContext';

type AdminTab = 'overview' | 'users' | 'categories' | 'products' | 'orders' | 'finance' | 'legal';
type UserRole = 'customer' | 'seller' | 'admin';

interface AdminUser {
  id: number;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  roles?: UserRole[];
  pi_balance?: number;
  created_at?: string;
  seller?: {
    id: number;
    store_name: string;
  } | null;
}

interface AdminCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  products_count?: number;
}

interface AdminProduct {
  id: number;
  name: string;
  price_pi: string | number;
  discount_price_pi?: string | number | null;
  is_flash_sale?: boolean;
  stock: number;
  sisa_stock?: number;
  sold?: number;
  image_url?: string;
  seller?: {
    id: number;
    store_name: string;
    user?: { name: string };
  };
  category?: { name: string };
}

interface AdminOrder {
  id: number;
  order_number: string;
  recipient_name: string;
  total_amount_pi: string | number;
  shipping_cost: string | number;
  courier_company?: string;
  tracking_number?: string;
  status: string;
  created_at: string;
  user?: { name: string; username?: string };
}

interface FinanceHistoryItem {
  id: number;
  order_number: string;
  created_at: string;
  seller_name: string;
  total_amount: number;
  shipping_fee: number;
}

interface LegalDoc {
  id?: number;
  slug: string;
  title: string;
  version: string;
  content: string;
  updated_at?: string;
}

export default function AdminDashboardPage() {
  const langCtx: any = useLanguage();
  const { t } = langCtx;
  const currentLang = String(langCtx?.language || langCtx?.lang || 'id').toLowerCase();
  const isEn = currentLang.startsWith('en');

  // Helper terjemahan dinamis untuk fitur Legal & Kebijakan (mendukung key LanguageContext + fallback ID/EN)
  const tr = (key: string, idText: string, enText: string): string => {
    const val = typeof t === 'function' ? t(key) : '';
    if (val && val !== key) return val;
    return isEn ? enText : idText;
  };

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [financeHistory, setFinanceHistory] = useState<FinanceHistoryItem[]>([]);
  const [financeSummary, setFinanceSummary] = useState({
    total_product: 0,
    total_shipping: 0,
    total_revenue: 0,
  });

  // State Dokumen Legal (Privacy Policy & Terms of Service)
  const [legalDocsMap, setLegalDocsMap] = useState<Record<string, LegalDoc>>({});
  const [activeLegalSlug, setActiveLegalSlug] = useState<'privacy-policy' | 'terms-of-service'>(
    'privacy-policy'
  );
  const [legalTitle, setLegalTitle] = useState<string>('');
  const [legalVersion, setLegalVersion] = useState<string>('1.0');
  const [legalContent, setLegalContent] = useState<string>('');
  const [legalLastUpdated, setLegalLastUpdated] = useState<string>('');
  const [legalPreviewMode, setLegalPreviewMode] = useState<boolean>(false);
  const [savingLegal, setSavingLegal] = useState<boolean>(false);
  const legalTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Form State Tambah / Edit Kategori
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Filter & Search States lainnya
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [financeSellerSearch, setFinanceSellerSearch] = useState('');

  // Loading aksi per baris
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const getUserRoles = (u: AdminUser): UserRole[] => {
    if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles;
    if (typeof u.roles === 'string') {
      try {
        const parsed = JSON.parse(u.roles);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback ke role tunggal
      }
    }
    return u.role ? [u.role] : ['customer'];
  };

  const getRoleLabel = (role: UserRole): string => {
    if (role === 'admin') return t('roleAdmin');
    if (role === 'seller') return t('roleSeller');
    return t('roleCustomer');
  };

  const fetchAllAdminData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [usersJson, categoriesJson, productsJson, ordersJson, financeJson, legalJson]: any[] =
        await Promise.all([
          apiClient('/admin/users'),
          apiClient('/admin/categories').catch(() => ({ success: false, data: [] })),
          apiClient('/admin/products'),
          apiClient('/admin/orders'),
          apiClient('/admin/finance'),
          apiClient('/admin/legal').catch(() => ({ success: false, data: [] })),
        ]);

      if (usersJson?.success) setUsers(usersJson.data || []);
      else if (Array.isArray(usersJson)) setUsers(usersJson);

      if (categoriesJson?.success) setCategories(categoriesJson.data || []);
      else if (Array.isArray(categoriesJson)) setCategories(categoriesJson);

      if (productsJson?.success) setProducts(productsJson.data || []);
      else if (Array.isArray(productsJson)) setProducts(productsJson);

      if (ordersJson?.success) setOrders(ordersJson.data || []);
      else if (Array.isArray(ordersJson)) setOrders(ordersJson);

      if (financeJson?.success && financeJson.data) {
        setFinanceHistory(financeJson.data.history || []);
        setFinanceSummary(
          financeJson.data.summary || {
            total_product: 0,
            total_shipping: 0,
            total_revenue: 0,
          }
        );
      }

      if (legalJson?.success && Array.isArray(legalJson.data)) {
        const map: Record<string, LegalDoc> = {};
        for (const item of legalJson.data) {
          map[item.slug] = item;
        }
        setLegalDocsMap(map);

        const initialDoc = map[activeLegalSlug] || map['privacy-policy'];
        if (initialDoc) {
          setLegalTitle(initialDoc.title);
          setLegalVersion(initialDoc.version);
          setLegalContent(initialDoc.content);
          setLegalLastUpdated(initialDoc.updated_at || '');
        }
      }
    } catch (error: any) {
      console.error('Admin Dashboard fetch error:', error);
      setFetchError(error?.message || t('serverLoadErrorTitle'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // --- HANDLER DOKUMEN LEGAL (PRIVACY POLICY & TERMS) ---
  const handleSelectLegalTab = (slug: 'privacy-policy' | 'terms-of-service') => {
    setActiveLegalSlug(slug);
    setLegalPreviewMode(false);
    const selected = legalDocsMap[slug];
    if (selected) {
      setLegalTitle(selected.title);
      setLegalVersion(selected.version);
      setLegalContent(selected.content);
      setLegalLastUpdated(selected.updated_at || '');
    } else {
      setLegalTitle(
        slug === 'privacy-policy'
          ? 'Kebijakan Privasi (Privacy Policy) — NTTStorePi'
          : 'Syarat & Ketentuan Layanan (Terms of Service) — NTTStorePi'
      );
      setLegalVersion('1.0');
      setLegalContent('');
      setLegalLastUpdated('');
    }
  };

  const insertLegalSnippet = (snippet: string) => {
    const el = legalTextareaRef.current;
    if (!el) {
      setLegalContent((prev) => `${prev}\n${snippet}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = legalContent.substring(0, start) + snippet + legalContent.substring(end);
    setLegalContent(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 20);
  };

  const handleSaveLegalDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalTitle.trim() || !legalContent.trim()) {
      Swal.fire(
        tr('legalIncompleteTitle', 'Data Belum Lengkap', 'Incomplete Data'),
        tr(
          'legalIncompleteText',
          'Judul dan isi dokumen wajib diisi.',
          'Document title and content are required.'
        ),
        'warning'
      );
      return;
    }

    setSavingLegal(true);
    try {
      const json: any = await apiClient(`/admin/legal/${activeLegalSlug}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: legalTitle.trim(),
          version: legalVersion.trim() || '1.0',
          content: legalContent,
        }),
      });

      if (json && json.success === false) {
        throw new Error(json.message || t('failedTitle'));
      }

      if (json?.data) {
        setLegalDocsMap((prev) => ({
          ...prev,
          [activeLegalSlug]: json.data,
        }));
        setLegalLastUpdated(json.data.updated_at || '');
      }

      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text:
          json?.message ||
          tr(
            'legalSavedSuccess',
            'Perubahan dokumen berhasil dipublikasikan ke halaman publik.',
            'Document changes have been published to the public page.'
          ),
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire(
        t('failedTitle'),
        err?.message ||
          tr(
            'legalSaveError',
            'Gagal menyimpan dokumen legal.',
            'Failed to save legal document.'
          ),
        'error'
      );
    } finally {
      setSavingLegal(false);
    }
  };

  // --- HANDLER TAMBAH / EDIT KATEGORI ---
  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCategoryIcon('');
    setEditingCategoryId(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSavingCategory(true);
    try {
      const payload = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
        icon: categoryIcon.trim() || null,
      };

      const json: any = editingCategoryId
        ? await apiClient(`/admin/categories/${editingCategoryId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiClient('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      if (json && json.success === false) {
        throw new Error(json.message || t('categorySaveError'));
      }

      if (editingCategoryId) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategoryId ? { ...c, ...(json.data || payload) } : c))
        );
      } else if (json?.data) {
        setCategories((prev) => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      }

      resetCategoryForm();
      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: json?.message || t('categorySavedSuccess'),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err?.message || t('categorySaveError'), 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategoryClick = (cat: AdminCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || '');
    setCategoryIcon(cat.icon || '');
  };

  const handleDeleteCategory = async (cat: AdminCategory) => {
    const confirm = await Swal.fire({
      title: t('confirmDeleteCategoryTitle'),
      text: `"${cat.name}" ${t('confirmDeleteCategoryText')}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('deleteProduct'),
      cancelButtonText: t('cancel'),
    });

    if (!confirm.isConfirmed) return;

    try {
      const json: any = await apiClient(`/admin/categories/${cat.id}`, {
        method: 'DELETE',
      });

      if (json && json.success === false) {
        throw new Error(json.message || t('categoryDeleteError'));
      }

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (editingCategoryId === cat.id) resetCategoryForm();

      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: t('categoryDeletedSuccess'),
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err?.message || t('categoryDeleteError'), 'error');
    }
  };

  // --- HANDLER TOGGLE MULTI-ROLE UNTUK 1 USER ID ---
  const handleToggleUserRole = async (user: AdminUser, targetRole: UserRole) => {
    const currentRoles = getUserRoles(user);
    const exists = currentRoles.includes(targetRole);

    if (exists && currentRoles.length === 1) {
      Swal.fire(t('roleCannotBeEmptyTitle'), t('roleCannotBeEmptyText'), 'warning');
      return;
    }

    const updatedRoles: UserRole[] = exists
      ? currentRoles.filter((r) => r !== targetRole)
      : [...currentRoles, targetRole];

    setUpdatingRoleId(user.id);
    try {
      const json: any = await apiClient(`/admin/users/${user.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roles: updatedRoles }),
      });

      if (json && json.success === false) {
        throw new Error(json.message || t('failedTitle'));
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                ...(json?.data || {}),
                roles: updatedRoles,
                role: json?.data?.role || u.role,
              }
            : u
        )
      );

      Swal.fire({
        icon: 'success',
        title: t('roleUpdatedTitle'),
        text: json?.message || `${user.name}: ${updatedRoles.map(getRoleLabel).join(', ')}`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err?.message || t('failedTitle'), 'error');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // --- HANDLER HAPUS PRODUK OLEH ADMIN ---
  const handleDeleteProduct = async (product: AdminProduct) => {
    const confirm = await Swal.fire({
      title: t('confirmDeleteProductTitle'),
      text: `${product.name} - ${t('confirmDeleteProductText')}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('deleteProduct'),
      cancelButtonText: t('cancel'),
    });

    if (!confirm.isConfirmed) return;

    try {
      const json: any = await apiClient(`/admin/products/${product.id}`, {
        method: 'DELETE',
      });

      if (json && json.success === false) {
        throw new Error(json.message || t('failedTitle'));
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      Swal.fire(t('successTitle'), t('productDeletedSuccess'), 'success');
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err?.message || t('failedTitle'), 'error');
    }
  };

  // --- HANDLER UBAH STATUS ORDER OLEH ADMIN ---
  const handleOrderStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const json: any = await apiClient(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (json && json.success === false) {
        throw new Error(json.message || t('failedTitle'));
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      Swal.fire({
        icon: 'success',
        title: t('statusUpdatedTitle'),
        text: `${t('orderStatusUpdated')} (${newStatus})`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire(t('failedTitle'), err?.message || t('failedTitle'), 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter Data
  const filteredUsers = users.filter((u) => {
    const userRoles = getUserRoles(u);
    const matchRole = roleFilter === 'all' || userRoles.includes(roleFilter);
    const keyword = userSearch.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(keyword) ||
      u.username?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.seller?.store_name?.toLowerCase().includes(keyword);
    return matchRole && matchSearch;
  });

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.recipient_name?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredFinance = financeHistory.filter((f) =>
    f.seller_name?.toLowerCase().includes(financeSellerSearch.toLowerCase())
  );

  const totalAdmins = users.filter((u) => getUserRoles(u).includes('admin')).length;
  const totalSellers = users.filter((u) => getUserRoles(u).includes('seller')).length;
  const totalCustomers = users.filter((u) => getUserRoles(u).includes('customer')).length;

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
      case 'processing':
        return 'bg-amber-100 text-amber-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const menuItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: t('adminTabOverview'), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: t('adminTabUsers'), icon: <Users className="w-4 h-4" />, badge: users.length },
    { id: 'categories', label: t('adminTabCategories'), icon: <Tags className="w-4 h-4" />, badge: categories.length },
    { id: 'products', label: t('adminTabProducts'), icon: <Package className="w-4 h-4" />, badge: products.length },
    { id: 'orders', label: t('adminTabOrders'), icon: <ShoppingBag className="w-4 h-4" />, badge: orders.length },
    { id: 'finance', label: t('adminTabFinance'), icon: <Coins className="w-4 h-4" /> },
    {
      id: 'legal',
      label: tr('adminTabLegal', 'Legal & Kebijakan', 'Legal & Policies'),
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 sm:p-6 lg:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Admin */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/15 backdrop-blur-xs rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-amber-400 text-purple-950 text-[10px] font-black uppercase rounded-full tracking-wider">
                {t('superAdminBadge')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                {t('adminControlCenterTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                {t('adminControlCenterSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={fetchAllAdminData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2.5 rounded-2xl transition text-xs self-start sm:self-center cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('refreshDataBtn')}</span>
          </button>
        </div>

        {/* Navigasi Semua Menu */}
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-1.5 overflow-x-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Banner Diagnosa Error API */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">{t('serverLoadErrorTitle')}</p>
              <p className="mt-0.5">{fetchError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-9 h-9 animate-spin text-purple-700" />
            <span className="text-sm font-medium">{t('loadingSystemData')}</span>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 1: RINGKASAN STATISTIK                                */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {t('totalUsersCard')}
                      </span>
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mt-2">{users.length}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {totalCustomers} {t('roleCustomer')} • {totalSellers} {t('roleSeller')} •{' '}
                      {totalAdmins} {t('roleAdmin')}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {t('totalProductsCard')}
                      </span>
                      <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mt-2">{products.length}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {products.filter((p) => p.is_flash_sale).length}{' '}
                      {t('activeFlashSaleCountSuffix')}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {t('totalOrdersCard')}
                      </span>
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mt-2">{orders.length}</h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {orders.filter((o) => o.status === 'paid' || o.status === 'completed').length}{' '}
                      {t('paidTransactionsSuffix')}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {t('totalPiRevenueCard')}
                      </span>
                      <Coins className="w-5 h-5 text-purple-700" />
                    </div>
                    <h3 className="text-2xl font-black text-purple-700 mt-2">
                      π {Number(financeSummary.total_revenue || 0).toFixed(2)}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {t('totalProductRevenueCard')}: π{' '}
                      {Number(financeSummary.total_product || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Pintasan Cepat */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {t('multiRoleShortcutTitle')}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t('multiRoleShortcutDesc')}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition shrink-0 cursor-pointer"
                    >
                      {t('manageUserRolesBtn')}
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {t('marketplaceCategoriesShortcutTitle')} ({categories.length})
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t('marketplaceCategoriesShortcutDesc')}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('categories')}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shrink-0 cursor-pointer"
                    >
                      {t('addCategoryShortcutBtn')}
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {tr(
                          'legalShortcutTitle',
                          'Privacy Policy & Terms',
                          'Privacy Policy & Terms'
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tr(
                          'legalShortcutDesc',
                          'Perbarui dokumen kepatuhan Pi Mainnet & UU PDP kapan saja.',
                          'Update Pi Mainnet & data privacy compliance documents anytime.'
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('legal')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shrink-0 cursor-pointer"
                    >
                      {tr('manageLegalBtn', 'Kelola Legal', 'Manage Legal')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: MANAJEMEN PENGGUNA & MULTI-ROLE                    */}
            {/* ========================================================= */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-700" /> {t('userManagementHeading')}
                    </h2>
                    <p className="text-xs text-gray-500">{t('userManagementHint')}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="all">
                        {t('allRolesFilter')} ({users.length})
                      </option>
                      <option value="customer">
                        {t('roleCustomer')} ({totalCustomers})
                      </option>
                      <option value="seller">
                        {t('roleSeller')} ({totalSellers})
                      </option>
                      <option value="admin">
                        {t('roleAdmin')} ({totalAdmins})
                      </option>
                    </select>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('searchUserPlaceholder')}
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                        <th className="p-4 pl-6">{t('colUser')}</th>
                        <th className="p-4">{t('colStoreContact')}</th>
                        <th className="p-4">{t('colActiveRoles')}</th>
                        <th className="p-4 pr-6 text-right">{t('colManageMultiRole')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-10 text-center text-gray-400">
                            {t('noUsersDisplayed')}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const userRoles = getUserRoles(u);

                          return (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition">
                              <td className="p-4 pl-6">
                                <div className="font-bold text-gray-900">
                                  {u.name}{' '}
                                  <span className="text-[10px] text-gray-400 font-normal">
                                    (ID: {u.id})
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  @{u.username || `user_${u.id}`} {u.email ? `• ${u.email}` : ''}
                                </div>
                              </td>
                              <td className="p-4">
                                {u.seller?.store_name ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                    <Store className="w-3.5 h-3.5" /> {u.seller.store_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">{u.phone || '-'}</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {userRoles.map((r) => (
                                    <span
                                      key={r}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                        r === 'admin'
                                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                                          : r === 'seller'
                                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                                          : 'bg-sky-100 text-sky-800 border-sky-200'
                                      }`}
                                    >
                                      {r === 'admin' && <Crown className="w-2.5 h-2.5" />}
                                      {r === 'seller' && <Store className="w-2.5 h-2.5" />}
                                      {r === 'customer' && <UserCheck className="w-2.5 h-2.5" />}
                                      {getRoleLabel(r)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                                  {updatingRoleId === u.id && (
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-700 mr-1" />
                                  )}

                                  {(['customer', 'seller', 'admin'] as UserRole[]).map((roleOption) => {
                                    const isChecked = userRoles.includes(roleOption);
                                    const activeColors: Record<UserRole, string> = {
                                      customer: 'bg-sky-600 text-white border-sky-600',
                                      seller: 'bg-amber-500 text-white border-amber-500',
                                      admin: 'bg-purple-700 text-white border-purple-700',
                                    };
                                    const labelText = getRoleLabel(roleOption);

                                    return (
                                      <button
                                        key={roleOption}
                                        type="button"
                                        disabled={updatingRoleId === u.id}
                                        onClick={() => handleToggleUserRole(u, roleOption)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border transition cursor-pointer disabled:opacity-50 ${
                                          isChecked
                                            ? activeColors[roleOption]
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'
                                        }`}
                                      >
                                        {isChecked ? `✓ ${labelText}` : labelText}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: TAMBAH & KELOLA KATEGORI PRODUK                    */}
            {/* ========================================================= */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah / Edit Kategori */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-fit">
                  <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Tags className="w-5 h-5 text-purple-700" />
                    {editingCategoryId ? t('editCategoryTitle') : t('addNewCategoryTitle')}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">{t('addCategoryFormHint')}</p>

                  <form onSubmit={handleSaveCategory} className="space-y-4 mt-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {t('categoryNameField')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('categoryNamePlaceholder')}
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {t('categoryIconField')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('categoryIconPlaceholder')}
                        value={categoryIcon}
                        onChange={(e) => setCategoryIcon(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {t('categoryDescriptionField')}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={t('categoryDescriptionPlaceholder')}
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={savingCategory || !categoryName.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {savingCategory ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editingCategoryId ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>
                          {editingCategoryId ? t('saveCategoryChangesBtn') : t('addCategoryBtn')}
                        </span>
                      </button>

                      {editingCategoryId && (
                        <button
                          type="button"
                          onClick={resetCategoryForm}
                          className="inline-flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>{t('cancel')}</span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Daftar Kategori Tersimpan */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {t('activeCategoriesListHeading')} ({categories.length})
                      </h3>
                      <p className="text-xs text-gray-500">{t('activeCategoriesListHint')}</p>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('searchCategoryPlaceholder')}
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          <th className="p-4 pl-6">{t('colCategoryName')}</th>
                          <th className="p-4">{t('colSlugDescription')}</th>
                          <th className="p-4">{t('colProductCount')}</th>
                          <th className="p-4 pr-6 text-right">{t('colAction')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {filteredCategories.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-400">
                              {t('noCategoriesSaved')}
                            </td>
                          </tr>
                        ) : (
                          filteredCategories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                              <td className="p-4 pl-6">
                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                                  <span>{cat.name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                {cat.slug && (
                                  <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                    {cat.slug}
                                  </span>
                                )}
                                {cat.description && (
                                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                                    {cat.description}
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                                  {cat.products_count ?? 0} {t('productsCountSuffix')}
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditCategoryClick(cat)}
                                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                    title={t('editCategoryTooltip')}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                    title={t('deleteCategoryTooltip')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: SEMUA PRODUK                                       */}
            {/* ========================================================= */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />{' '}
                    {t('allMarketplaceProductsHeading')}
                  </h2>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('searchProductNamePlaceholder')}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                        <th className="p-4 pl-6">{t('colProduct')}</th>
                        <th className="p-4">{t('colStoreSeller')}</th>
                        <th className="p-4">{t('colPricePi')}</th>
                        <th className="p-4">{t('colRemainingStock')}</th>
                        <th className="p-4 pr-6 text-right">{t('colAction')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-gray-400">
                            {t('noProductsDisplayed')}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const sisa =
                            p.sisa_stock !== undefined && p.sisa_stock !== null
                              ? p.sisa_stock
                              : Math.max(0, Number(p.stock || 0) - Number(p.sold || 0));

                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition">
                              <td className="p-4 pl-6 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-900">{p.name}</span>
                                    {p.is_flash_sale && (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700">
                                        <Zap className="w-2.5 h-2.5" /> {t('flashSaleTag')}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-gray-400">
                                    {p.category?.name || t('allCategories')}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 font-medium text-gray-600">
                                {p.seller?.store_name ||
                                  p.seller?.user?.name ||
                                  t('defaultSellerName')}
                              </td>
                              <td className="p-4 font-bold text-amber-600">
                                {p.discount_price_pi && Number(p.discount_price_pi) > 0 ? (
                                  <div>
                                    <span className="text-orange-600">π {p.discount_price_pi}</span>
                                    <span className="block text-[10px] text-gray-400 line-through">
                                      π {p.price_pi}
                                    </span>
                                  </div>
                                ) : (
                                  `π ${p.price_pi}`
                                )}
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-gray-800">
                                  {sisa} / {p.stock}
                                </span>
                                <span className="block text-[10px] text-gray-400">
                                  {t('sold')}: {p.sold ?? 0}
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <button
                                  onClick={() => handleDeleteProduct(p)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                  title={t('deleteProduct')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: SEMUA PESANAN                                      */}
            {/* ========================================================= */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />{' '}
                    {t('allOrderTransactionsHeading')}
                  </h2>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('searchOrderRecipientPlaceholder')}
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                        <th className="p-4 pl-6">{t('colOrderNo')}</th>
                        <th className="p-4">{t('colBuyerRecipient')}</th>
                        <th className="p-4">{t('colCourierTracking')}</th>
                        <th className="p-4">{t('colTotalPi')}</th>
                        <th className="p-4">{t('colStatus')}</th>
                        <th className="p-4 pr-6 text-right">{t('colChangeStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-gray-400">
                            {t('noOrdersDisplayed')}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-4 pl-6 font-bold text-gray-900">{o.order_number}</td>
                            <td className="p-4">
                              <div className="font-semibold text-gray-800">{o.recipient_name}</div>
                              <div className="text-[11px] text-gray-400">
                                {t('colUser')}: {o.user?.name || '-'}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 font-semibold text-gray-700 uppercase">
                                <Truck className="w-3.5 h-3.5 text-gray-400" />
                                {o.courier_company || '-'}
                              </span>
                              <span className="block text-[10px] text-gray-400">
                                {o.tracking_number || t('trackingNotAvailable')}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-purple-700">π {o.total_amount_pi}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${getOrderStatusBadge(
                                  o.status
                                )}`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                {updatingOrderId === o.id && (
                                  <Loader2 className="w-4 h-4 animate-spin text-purple-700" />
                                )}
                                <select
                                  value={o.status}
                                  disabled={updatingOrderId === o.id}
                                  onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-bold text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 6: LAPORAN KEUANGAN                                   */}
            {/* ========================================================= */}
            {activeTab === 'finance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      {t('totalProductRevenueCard')}
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">
                      π {Number(financeSummary.total_product).toFixed(2)}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      {t('totalShippingRevenueCard')}
                    </span>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">
                      π {Number(financeSummary.total_shipping).toFixed(2)}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase">
                      {t('totalNetRevenueCard')}
                    </span>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">
                      π {Number(financeSummary.total_revenue).toFixed(2)}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Coins className="w-5 h-5 text-purple-700" />{' '}
                      {t('storeFinanceHistoryHeading')}
                    </h2>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('filterStoreNamePlaceholder')}
                        value={financeSellerSearch}
                        onChange={(e) => setFinanceSellerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                          <th className="p-4 pl-6">{t('colOrderNo')}</th>
                          <th className="p-4">{t('colStoreSeller')}</th>
                          <th className="p-4">{t('colProductAmount')}</th>
                          <th className="p-4 pr-6 text-right">{t('colShippingFee')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {filteredFinance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-400">
                              {t('noFinanceHistoryDisplayed')}
                            </td>
                          </tr>
                        ) : (
                          filteredFinance.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition">
                              <td className="p-4 pl-6 font-bold text-gray-900">
                                {item.order_number}
                              </td>
                              <td className="p-4 font-semibold text-gray-700">{item.seller_name}</td>
                              <td className="p-4 font-bold text-purple-700">
                                π {Number(item.total_amount).toFixed(2)}
                              </td>
                              <td className="p-4 pr-6 text-right font-semibold text-amber-600">
                                π {Number(item.shipping_fee).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 7: KELOLA PRIVACY POLICY & TERMS OF SERVICE           */}
            {/* ========================================================= */}
            {activeTab === 'legal' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      {tr(
                        'legalEditorHeading',
                        'Kelola Privacy Policy & Terms of Service',
                        'Manage Privacy Policy & Terms of Service'
                      )}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tr(
                        'legalEditorSubtitle',
                        'Perbarui dokumen kepatuhan Pi Network Mainnet & UU PDP kapan saja.',
                        'Update Pi Network Mainnet & data privacy compliance documents anytime.'
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/${activeLegalSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold"
                  >
                    <span>
                      {tr('viewPublicPageBtn', 'Lihat Halaman Publik', 'View Public Page')}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Sub-Tab Pilihan Dokumen */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() => handleSelectLegalTab('privacy-policy')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                        activeLegalSlug === 'privacy-policy'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {tr('privacyPolicyTab', 'Kebijakan Privasi (Privacy Policy)', 'Privacy Policy')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectLegalTab('terms-of-service')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                        activeLegalSlug === 'terms-of-service'
                          ? 'bg-white text-purple-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>
                        {tr('termsOfServiceTab', 'Syarat & Ketentuan (Terms)', 'Terms of Service')}
                      </span>
                    </button>
                  </div>

                  {legalLastUpdated && (
                    <span className="text-[11px] text-gray-500 font-medium">
                      {tr('lastUpdatedLabel', 'Terakhir diperbarui:', 'Last updated:')}{' '}
                      {new Date(legalLastUpdated).toLocaleString(isEn ? 'en-US' : 'id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveLegalDocument} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {tr('legalTitleField', 'Judul Dokumen', 'Document Title')}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={legalTitle}
                        onChange={(e) => setLegalTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {tr('legalVersionField', 'Versi Dokumen', 'Document Version')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="1.0"
                        value={legalVersion}
                        onChange={(e) => setLegalVersion(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  {/* Toolbar Format Cepat & Switch Mode Edit / Pratinjau */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {!legalPreviewMode ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              insertLegalSnippet(
                                isEn
                                  ? '\n<h2>New Section Title</h2>\n'
                                  : '\n<h2>Judul Bagian Baru</h2>\n'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                          >
                            <Heading2 className="w-3.5 h-3.5" />
                            <span>{tr('snippetHeading', 'Subjudul', 'Subheading')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              insertLegalSnippet(
                                isEn
                                  ? '\n<p>Write paragraph text here...</p>\n'
                                  : '\n<p>Tulis paragraf di sini...</p>\n'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                          >
                            <Type className="w-3.5 h-3.5" />
                            <span>{tr('snippetParagraph', 'Paragraf', 'Paragraph')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              insertLegalSnippet(
                                isEn
                                  ? '\n<ul>\n  <li><strong>Point 1:</strong> Description</li>\n  <li><strong>Point 2:</strong> Description</li>\n</ul>\n'
                                  : '\n<ul>\n  <li><strong>Poin 1:</strong> Keterangan</li>\n  <li><strong>Poin 2:</strong> Keterangan</li>\n</ul>\n'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>{tr('snippetList', 'Daftar Poin', 'Bullet List')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              insertLegalSnippet(
                                isEn ? '<strong>Bold Text</strong>' : '<strong>Teks Tebal</strong>'
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                          >
                            <Bold className="w-3.5 h-3.5" />
                            <span>{tr('snippetBold', 'Tebal', 'Bold')}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-purple-700">
                          {tr(
                            'legalPreviewModeLabel',
                            'Mode Pratinjau Tampilan Publik',
                            'Public Page Preview Mode'
                          )}
                        </span>
                      )}

                      <div className="flex gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => setLegalPreviewMode(false)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            !legalPreviewMode
                              ? 'bg-purple-700 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{tr('editBtn', 'Edit', 'Edit')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLegalPreviewMode(true)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            legalPreviewMode
                              ? 'bg-purple-700 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tr('previewBtn', 'Pratinjau', 'Preview')}</span>
                        </button>
                      </div>
                    </div>

                    {legalPreviewMode ? (
                      <div className="min-h-[360px] p-6 rounded-2xl border border-gray-200 bg-gray-50/50">
                        <article
                          className="prose prose-sm max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-ul:list-disc prose-ul:pl-5"
                          dangerouslySetInnerHTML={{ __html: legalContent }}
                        />
                      </div>
                    ) : (
                      <textarea
                        ref={legalTextareaRef}
                        rows={15}
                        required
                        value={legalContent}
                        onChange={(e) => setLegalContent(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingLegal}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {savingLegal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {savingLegal
                          ? tr('savingText', 'Menyimpan...', 'Saving...')
                          : tr(
                              'saveAndPublishBtn',
                              'Simpan & Publikasikan Sekarang',
                              'Save & Publish Now'
                            )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
