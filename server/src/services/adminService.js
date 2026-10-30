const mongoose = require('mongoose');
const { Order, MenuItem, Category } = require('../models');
const AppError = require('../utils/appError');

/**
 * Helper to calculate local day start and end timestamps
 * Uses server/restaurant local calendar day (midnight to midnight)
 */
const getLocalDayRange = (date = new Date()) => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

/**
 * Calculate executive summary metrics for Admin Dashboard
 */
const getAdminSummary = async () => {
  const { startOfDay, endOfDay } = getLocalDayRange();

  // 1. Orders placed today (between 00:00:00 and 23:59:59 local time)
  const todayOrders = await Order.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const todayOrdersCount = todayOrders.length;

  // 2. Pending active orders (Received, Preparing, Ready across all dates)
  const pendingOrdersCount = await Order.countDocuments({
    status: { $in: ['Received', 'Preparing', 'Ready'] },
  });

  // 3. Completed orders today
  const todayCompletedCount = todayOrders.filter((o) => o.status === 'Served').length;
  const allTimeCompletedCount = await Order.countDocuments({ status: 'Served' });

  // 4. Cancelled orders today
  const todayCancelledCount = todayOrders.filter((o) => o.status === 'Cancelled').length;

  // 5. Today's revenue: Sum of grandTotal / totalAmount for Served/completed orders placed today
  const todayRevenue = todayOrders
    .filter((o) => o.status === 'Served')
    .reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

  // All-time revenue from served orders
  const revenueAggregation = await Order.aggregate([
    { $match: { status: 'Served' } },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', '$totalAmount'] } } } },
  ]);
  const allTimeRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

  // 6. Menu & inventory metrics
  const totalMenuItems = await MenuItem.countDocuments({ isActive: true });
  const outOfStockCount = await MenuItem.countDocuments({ isActive: true, isAvailable: false });
  const totalCategories = await Category.countDocuments({ isActive: true });

  // 7. Recent 5 orders for fast executive overview
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderId orderNumber orderType tableNumber status totalAmount createdAt items');

  return {
    todayOrdersCount,
    pendingOrdersCount,
    completedOrdersCount: todayCompletedCount,
    allTimeCompletedCount,
    todayCancelledCount,
    todayRevenue,
    allTimeRevenue,
    totalMenuItems,
    outOfStockCount,
    totalCategories,
    localDate: startOfDay.toISOString().split('T')[0],
    recentOrders,
  };
};

/**
 * Fetch searchable, filterable, and paginated orders for Admin
 */
const getAdminOrders = async ({
  search,
  status,
  orderType,
  date,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Order Type filter
  if (orderType && orderType !== 'all') {
    query.orderType = orderType;
  }

  // Date filter: 'today' or specific ISO date
  if (date === 'today') {
    const { startOfDay, endOfDay } = getLocalDayRange();
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (date && date !== 'all') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      const { startOfDay, endOfDay } = getLocalDayRange(parsedDate);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  // Search filter: Order ID, Table number, or Item name
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { orderId: { $regex: s, $options: 'i' } },
      { orderNumber: { $regex: s, $options: 'i' } },
      { tableNumber: { $regex: s, $options: 'i' } },
      { 'items.name': { $regex: s, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return {
    orders,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

module.exports = {
  getAdminSummary,
  getAdminOrders,
  getLocalDayRange,
};
