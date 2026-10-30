import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminSummary,
  fetchAdminOrders,
  createMenuItemApi,
  updateMenuItemApi,
  toggleItemAvailabilityApi,
  deleteMenuItemApi,
  fetchCategoriesApi,
  createCategoryApi,
} from '../services/adminApi';
import { fetchPublicMenuApi } from '../services/menuApi';
import { updateOrderStatusApi } from '../services/orderApi';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  ChefHat,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  X,
  Check,
  Tag,
  DollarSign,
  Utensils,
  ArrowUpDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { DietaryIcon } from '../components/DietaryBadge';

export const AdminDashboardPage = ({ onBackToMenu }) => {
  // Authentication & Role Simulation
  const [currentRole, setCurrentRole] = useState('admin'); // 'admin' | 'customer' | 'kitchen'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'menu' | 'categories'

  // Summary Metrics State
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Orders Management State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Menu Items & Categories State
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all');

  // Modal State for Create / Edit Menu Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if creating new
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: '',
    isVeg: true,
    isAvailable: true,
    variants: [
      { name: 'Half', price: 150, portion: 'Half Plate (1-2 pax)', isDefault: true },
      { name: 'Full', price: 280, portion: 'Full Plate (2-3 pax)', isDefault: false },
    ],
  });

  // Modal State for Create Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'UtensilsCrossed' });

  // Notifications & Feedback
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Load Executive Summary
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchAdminSummary(currentRole);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load admin summary:', err);
      showFeedback('error', err.message || 'Unauthorized: Admin access required');
    } finally {
      setSummaryLoading(false);
    }
  }, [currentRole]);

  // 2. Load Searchable & Filterable Orders
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchAdminOrders(
        {
          search: orderSearch,
          status: orderStatusFilter,
          orderType: orderTypeFilter,
          date: orderDateFilter,
          limit: 50,
        },
        currentRole
      );
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
      showFeedback('error', err.message);
    } finally {
      setOrdersLoading(false);
    }
  }, [currentRole, orderSearch, orderStatusFilter, orderTypeFilter, orderDateFilter]);

  // 3. Load Menu Items & Categories
  const loadMenuData = useCallback(async () => {
    setMenuLoading(true);
    try {
      const [menuData, catData] = await Promise.all([
        fetchPublicMenuApi(),
        fetchCategoriesApi(),
      ]);
      setMenuItems(menuData.items || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Failed to load menu data:', err);
      showFeedback('error', err.message);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // Initial fetch on mount & role change
  useEffect(() => {
    if (currentRole === 'admin') {
      loadSummary();
      loadOrders();
      loadMenuData();
    }
  }, [currentRole, loadSummary, loadOrders, loadMenuData]);

  // Availability Toggle Handler
  const handleToggleAvailability = async (item) => {
    const nextAvailability = !item.isAvailable;
    try {
      await toggleItemAvailabilityApi(item._id || item.id, nextAvailability, currentRole);
      setMenuItems((prev) =>
        prev.map((it) =>
          (it._id || it.id) === (item._id || item.id)
            ? { ...it, isAvailable: nextAvailability }
            : it
        )
      );
      showFeedback(
        'success',
        `"${item.name}" is now marked as ${nextAvailability ? 'Available (In Stock)' : 'Out of Stock'}`
      );
      loadSummary();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update item availability');
    }
  };

  // Status Advance Handler from Admin Table
  const handleAdminStatusAdvance = async (orderId, nextStatus) => {
    try {
      await updateOrderStatusApi(orderId, nextStatus, currentRole, 'Advanced by Administrator');
      showFeedback('success', `Order #${orderId} moved to status "${nextStatus}"`);
      loadOrders();
      loadSummary();
    } catch (err) {
      showFeedback('error', err.message || 'Status transition rejected');
    }
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      category: typeof item.category === 'object' ? item.category._id || item.category.id : item.category,
      isVeg: item.isVeg !== false,
      isAvailable: item.isAvailable !== false,
      variants: item.variants && item.variants.length > 0
        ? item.variants.map((v) => ({
            name: v.name,
            price: v.price,
            portion: v.portion || '',
            isDefault: Boolean(v.isDefault),
          }))
        : [
            { name: 'Half', price: 150, portion: 'Half Plate', isDefault: true },
            { name: 'Full', price: 280, portion: 'Full Plate', isDefault: false },
          ],
    });
    setIsItemModalOpen(true);
  };

  // Open Create Item Modal
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    const defaultCat = categories.length > 0 ? (categories[0]._id || categories[0].id) : '';
    setItemForm({
      name: '',
      description: '',
      category: defaultCat,
      isVeg: true,
      isAvailable: true,
      variants: [
        { name: 'Half', price: 160, portion: 'Half Plate (1-2 pax)', isDefault: true },
        { name: 'Full', price: 300, portion: 'Full Plate (2-3 pax)', isDefault: false },
      ],
    });
    setIsItemModalOpen(true);
  };

  // Submit Menu Item (Create or Update)
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showFeedback('error', 'Item name is required');
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItemApi(editingItem._id || editingItem.id, itemForm, currentRole);
        showFeedback('success', `Menu item "${itemForm.name}" updated successfully!`);
      } else {
        await createMenuItemApi(itemForm, currentRole);
        showFeedback('success', `New menu item "${itemForm.name}" added to public menu!`);
      }
      setIsItemModalOpen(false);
      loadMenuData();
      loadSummary();
    } catch (err) {
      showFeedback('error', err.message || 'Operation failed');
    }
  };

  // Submit Category
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showFeedback('error', 'Category name is required');
      return;
    }

    try {
      await createCategoryApi(categoryForm, currentRole);
      showFeedback('success', `Category "${categoryForm.name}" created successfully!`);
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '', icon: 'UtensilsCrossed' });
      loadMenuData();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to create category');
    }
  };

  // Filtered Menu Items in Admin View
  const filteredMenuItems = menuItems.filter((item) => {
    if (menuCategoryFilter !== 'all') {
      const catSlug = typeof item.category === 'object' ? item.category.slug || item.category.name : item.category;
      if (catSlug !== menuCategoryFilter && item.category !== menuCategoryFilter) {
        return false;
      }
    }
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Feedback Alert */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold transition-all animate-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-red-950/90 border-red-500 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Admin Navigation Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Restaurant Admin Command Center
                </h1>
                <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live metrics, revenue analysis, ticket controls & menu management
              </p>
            </div>
          </div>

          {/* Right Controls: Role Simulator & Back Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Role Simulator Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider px-2">Role:</span>
              <button
                type="button"
                onClick={() => setCurrentRole('admin')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentRole === 'admin'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => setCurrentRole('customer')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currentRole === 'customer'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simulate unauthorized customer request"
              >
                Customer (403 Test)
              </button>
            </div>

            {onBackToMenu && (
              <button
                type="button"
                onClick={onBackToMenu}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
              >
                Customer Menu
              </button>
            )}
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-800/80 pt-2 pb-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
            { id: 'orders', label: 'Live Orders & History', icon: ShoppingBag },
            { id: 'menu', label: 'Menu & Variants Management', icon: Utensils },
            { id: 'categories', label: 'Food Categories', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ROLE CHECK ALERT (if customer is selected) */}
        {currentRole !== 'admin' && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-bold block">RBAC Protection Active (Role: {currentRole})</span>
                <span className="text-red-300">
                  Unauthenticated or non-admin users receive 403 Forbidden on all summary and mutation routes.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentRole('admin')}
              className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 font-bold text-white transition-colors"
            >
              Switch back to Admin
            </button>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today's Revenue */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Today's Revenue</span>
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    ₹{summary?.todayRevenue?.toLocaleString() || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Calculated for local date ({summary?.localDate || 'Today'})
                  </span>
                </div>
              </div>

              {/* Today's Orders */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Today's Total Orders</span>
                  <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {summary?.todayOrdersCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {summary?.todayCancelledCount || 0} voided / cancelled
                  </span>
                </div>
              </div>

              {/* Pending Kitchen Orders */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Pending / Cooking</span>
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                    {summary?.pendingOrdersCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Active kitchen tickets in queue
                  </span>
                </div>
              </div>

              {/* Completed Orders */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Completed (Served)</span>
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {summary?.completedOrdersCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {summary?.allTimeCompletedCount || 0} all-time completed
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Alerts Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">
                    Inventory & Availability Status
                  </h4>
                  <p className="text-xs text-slate-400">
                    {summary?.outOfStockCount || 0} out of {summary?.totalMenuItems || 0} menu items currently marked out-of-stock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-colors"
              >
                Manage Stock & Pricing
              </button>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                  Recent Kitchen Tickets
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Type / Table</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Dishes</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Placed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {summary?.recentOrders?.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-white">#{ord.orderId}</td>
                        <td className="p-3 font-bold text-slate-300">
                          {ord.orderType === 'Dine-in' ? ord.tableNumber : 'Takeaway'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300">
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{ord.items?.length || 0} items</td>
                        <td className="p-3 font-mono font-bold text-orange-400">₹{ord.totalAmount}</td>
                        <td className="p-3 text-slate-400">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEARCHABLE & FILTERABLE ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Table, Dish..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Status Filter */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Received">Received</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Served">Served</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                {/* Order Type Filter */}
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
                >
                  <option value="all">All Modes</option>
                  <option value="Dine-in">Dine-in</option>
                  <option value="Takeaway">Takeaway</option>
                </select>

                {/* Date Filter */}
                <select
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today's Local Date</option>
                </select>

                <button
                  type="button"
                  onClick={loadOrders}
                  disabled={ordersLoading}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Refresh orders list"
                >
                  <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin text-orange-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Ticket #</th>
                      <th className="p-3.5">Dining Mode</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Grand Total</th>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500 font-bold">
                          No orders matched your search/filter criteria.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.orderId} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-mono font-black text-white">#{ord.orderId}</td>
                          <td className="p-3.5 font-bold text-slate-300">
                            {ord.orderType === 'Dine-in' ? `${ord.tableNumber}` : 'Takeaway'}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                ord.status === 'Served'
                                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                                  : ord.status === 'Ready'
                                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                                  : ord.status === 'Preparing'
                                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-red-900/60 text-red-300 border border-red-700'
                                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-0.5 max-w-xs">
                              {ord.items?.map((it, i) => (
                                <div key={i} className="text-slate-300 truncate">
                                  {it.quantity}× {it.name} {it.variant ? `(${it.variant})` : ''}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-orange-400">
                            ₹{ord.totalAmount || ord.grandTotal}
                          </td>
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            {ord.status === 'Received' && (
                              <button
                                type="button"
                                onClick={() => handleAdminStatusAdvance(ord.orderId, 'Preparing')}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold text-white text-[11px]"
                              >
                                Cook
                              </button>
                            )}
                            {ord.status === 'Preparing' && (
                              <button
                                type="button"
                                onClick={() => handleAdminStatusAdvance(ord.orderId, 'Ready')}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white text-[11px]"
                              >
                                Ready
                              </button>
                            )}
                            {ord.status === 'Ready' && (
                              <button
                                type="button"
                                onClick={() => handleAdminStatusAdvance(ord.orderId, 'Served')}
                                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-white text-[11px]"
                              >
                                Serve
                              </button>
                            )}
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

        {/* TAB 3: MENU & PRICE VARIANTS MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {/* Top Action Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Filter menu dishes..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={menuCategoryFilter}
                  onChange={(e) => setMenuCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c.slug || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleOpenCreateItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Dish</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price Variants (Half / Full)</th>
                      <th className="p-3.5">Dietary</th>
                      <th className="p-3.5">Availability (Live Stock)</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredMenuItems.map((item) => (
                      <tr key={item._id || item.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {item.description}
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-300">
                          {typeof item.category === 'object' ? item.category.name : item.category}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {item.variants && item.variants.length > 0 ? (
                              item.variants.map((v, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono font-bold text-orange-300 text-[11px]"
                                >
                                  {v.name}: ₹{v.price}
                                </span>
                              ))
                            ) : (
                              <span className="font-mono font-bold text-orange-300">
                                ₹{item.price || item.basePrice || 0}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.isVeg
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {/* Live Availability Instant Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer border ${
                              item.isAvailable !== false
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                : 'bg-red-950 text-red-300 border-red-700 hover:bg-red-900'
                            }`}
                            title="Click to toggle item in/out of stock"
                          >
                            {item.isAvailable !== false ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>In Stock (Available)</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                <span>Out of Stock</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditItem(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              title="Edit item & variants"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORY MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">Menu Categories</h3>
                <p className="text-xs text-slate-400">Configure dining categories displayed on customer menu</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat._id || cat.id}
                  className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {cat.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{cat.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE / EDIT MENU ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">
                {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g., Paneer Butter Masala"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Category *</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none font-bold"
                >
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Rich tomato gravy with fresh cream and kasoori methi..."
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isVeg}
                    onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500"
                  />
                  <span className="font-bold text-slate-300">Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500"
                  />
                  <span className="font-bold text-slate-300">Available in Stock</span>
                </label>
              </div>

              {/* Price Variants Section (Half / Full) */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <label className="font-black uppercase tracking-wider text-slate-400 block">
                  Price Variants (Half & Full Plates)
                </label>

                {itemForm.variants.map((v, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Variant Name</span>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...itemForm.variants];
                            updated[idx].name = e.target.value;
                            setItemForm({ ...itemForm, variants: updated });
                          }}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Price (₹)</span>
                        <input
                          type="number"
                          min="0"
                          value={v.price}
                          onChange={(e) => {
                            const updated = [...itemForm.variants];
                            updated[idx].price = Number(e.target.value);
                            setItemForm({ ...itemForm, variants: updated });
                          }}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-orange-400 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md shadow-orange-600/20"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Add New Category</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Tandoori Starters"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Fresh clay-oven skewers and tikkas"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
