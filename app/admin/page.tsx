'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiClient } from '@/lib/apiClient';
import { useLanguage } from '@/context/LanguageContext';

type AdminTab = 'overview' | 'users' | 'products' | 'orders' | 'finance';
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

export default function AdminDashboardPage() {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Data States
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [financeHistory, setFinanceHistory] = useState<FinanceHistoryItem[]>([]);
  const [financeSummary, setFinanceSummary] = useState({
    total_product: 0,
    total_shipping: 0,
    total_revenue: 0,
  });

  // Filter & Search States
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [financeSellerSearch, setFinanceSellerSearch] = useState('');

  // Loading aksi per baris
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Helper ambil array roles milik user
  const getUserRoles = (u: AdminUser): UserRole[] => {
    if (Array.isArray(u.roles) && u.roles.length > 0) return u.roles;
    if (typeof u.roles === 'string') {
      try {
        const parsed = JSON.parse(u.roles);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback ke kolom role tunggal
      }
    }
    return u.role ? [u.role] : ['customer'];
  };

  // Label role terjemahan
  const getRoleLabel = (role: UserRole): string => {
    if (role === 'admin') return t('roleAdmin');
    if (role === 'seller') return t('roleSeller');
    return t('roleCustomer');
  };

  const fetchAllAdminData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [usersJson, productsJson, ordersJson, financeJson]: any[] = await Promise.all([
        apiClient('/admin/users'),
        apiClient('/admin/products'),
        apiClient('/admin/orders'),
        apiClient('/admin/finance'),
      ]);

      if (usersJson?.success) {
        setUsers(usersJson.data || []);
      } else if (Array.isArray(usersJson)) {
        setUsers(usersJson);
      }

      if (productsJson?.success) {
        setProducts(productsJson.data || []);
      } else if (Array.isArray(productsJson)) {
        setProducts(productsJson);
      }

      if (ordersJson?.success) {
        setOrders(ordersJson.data || []);
      } else if (Array.isArray(ordersJson)) {
        setOrders(ordersJson);
      }

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
    } catch (error: any) {
      console.error('Gagal memuat data Admin Dashboard:', error);
      setFetchError(error?.message || t('serverLoadErrorTitle'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // --- HANDLER TOGGLE MULTI-ROLE UNTUK 1 USER ID (Customer, Seller, Admin) ---
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

  // Hitung statistik role
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
    { id: 'products', label: t('adminTabProducts'), icon: <Package className="w-4 h-4" />, badge: products.length },
    { id: 'orders', label: t('adminTabOrders'), icon: <ShoppingBag className="w-4 h-4" />, badge: orders.length },
    { id: 'finance', label: t('adminTabFinance'), icon: <Coins className="w-4 h-4" /> },
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

                {/* Pintasan Cepat ke Tabel Role Pengguna */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {t('multiRoleShortcutTitle')}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t('multiRoleShortcutDesc')}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {t('manageUserRolesBtn')}
                  </button>
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
            {/* TAB 3: SEMUA PRODUK                                       */}
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
            {/* TAB 4: SEMUA PESANAN                                      */}
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
            {/* TAB 5: LAPORAN KEUANGAN                                   */}
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
          </>
        )}
      </div>
    </div>
  );
}
