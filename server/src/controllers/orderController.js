const orderService = require('../services/orderService');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * Controller to fetch orders (with active vs history filter)
 */
const getOrders = async (req, res, next) => {
  try {
    const { view, status, orderType, limit } = req.query;
    const orders = await orderService.getOrders({
      view,
      status,
      orderType,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return successResponse(
      res,
      orders,
      `Retrieved ${orders.length} orders${view ? ` (view: ${view})` : ''}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch single order
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return successResponse(res, order, `Order #${order.orderId} retrieved successfully`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to advance order status
 * Protected by requireRole middleware
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      throw new AppError('Field "status" is required in request body', 400);
    }

    const role = req.userRole || 'kitchen';
    const updatedOrder = await orderService.updateOrderStatus(
      req.params.id,
      status,
      role,
      note
    );

    return successResponse(
      res,
      updatedOrder,
      `Order #${updatedOrder.orderId} advanced to status "${status}"`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to create new customer order
 */
const createOrder = async (req, res, next) => {
  try {
    const newOrder = await orderService.createOrder(req.body);
    return successResponse(
      res,
      newOrder,
      `Order #${newOrder.orderId} created and sent to kitchen`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to seed demo orders
 */
const seedOrders = async (req, res, next) => {
  try {
    const result = await orderService.seedDemoOrders();
    return successResponse(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  createOrder,
  seedOrders,
};
