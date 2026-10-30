const express = require('express');
const orderController = require('../controllers/orderController');
const { requireRole } = require('../middlewares/authRole');
const { validate } = require('../middlewares/validation');

const router = express.Router();

// Order creation validation schema
const createOrderSchema = {
  body: {
    items: { required: true, type: 'array', minLength: 1 },
    orderType: { required: false, enum: ['Dine-in', 'Takeaway'] },
  },
};

// Status update validation schema
const updateStatusSchema = {
  body: {
    status: {
      required: true,
      enum: ['Received', 'Preparing', 'Ready', 'Served', 'Cancelled'],
    },
  },
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders (query: ?view=active | history & ?status=...)
 * @access  Public / Kitchen
 */
router.get('/', orderController.getOrders);

/**
 * @route   POST /api/orders/seed
 * @desc    Seed initial demo orders for kitchen testing
 * @access  Public / Dev
 */
router.post('/seed', orderController.seedOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order details
 * @access  Public / Kitchen
 */
router.get('/:id', orderController.getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Place a new order (customer or staff)
 * @access  Public
 */
router.post('/', validate(createOrderSchema), orderController.createOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Advance kitchen order status (Received -> Preparing -> Ready -> Served)
 * @access  Kitchen Staff Only (Requires x-user-role header: kitchen | staff | admin)
 */
router.patch(
  '/:id/status',
  requireRole(['kitchen', 'admin', 'staff', 'manager']),
  validate(updateStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
