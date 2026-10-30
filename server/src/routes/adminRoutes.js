const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/authRole');

const router = express.Router();

// Enforce admin-role access across all /api/admin routes
router.use(requireAdmin);

/**
 * @route   GET /api/admin/summary
 * @desc    Get dashboard metrics, today's order counts, and local date revenue
 * @access  Admin Only
 */
router.get('/summary', adminController.getSummary);

/**
 * @route   GET /api/admin/orders
 * @desc    Get searchable and filterable order list for admin
 * @access  Admin Only
 */
router.get('/orders', adminController.getOrders);

module.exports = router;
