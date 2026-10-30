const adminService = require('../services/adminService');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/admin/summary
 * Returns executive dashboard metrics (Today's orders, revenue, pending counts)
 * Protected by requireAdmin
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await adminService.getAdminSummary();
    return successResponse(
      res,
      summary,
      'Admin metrics and daily revenue summary retrieved successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders
 * Returns searchable, filterable, paginated orders list
 * Protected by requireAdmin
 */
const getOrders = async (req, res, next) => {
  try {
    const { search, status, orderType, date, page, limit } = req.query;
    const result = await adminService.getAdminOrders({
      search,
      status,
      orderType,
      date,
      page,
      limit,
    });

    return successResponse(
      res,
      result,
      `Retrieved ${result.orders.length} orders (page ${result.pagination.page} of ${result.pagination.totalPages})`,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getOrders,
};
