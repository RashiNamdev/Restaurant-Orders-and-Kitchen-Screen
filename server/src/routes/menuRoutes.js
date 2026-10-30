const express = require('express');
const menuController = require('../controllers/menuController');
const { requireAdmin, requireRole } = require('../middlewares/authRole');
const {
  validateObjectIdParam,
  validateMenuItemInput,
} = require('../middlewares/validateMenu');

const router = express.Router();

// Public customer menu endpoint (returns items with populated categories and variants)
router.get('/', menuController.getPublicMenu);
router.get('/items', menuController.getPublicMenu);
router.get('/items/:id', validateObjectIdParam('id'), menuController.getMenuItemById);
router.post('/seed', menuController.seedMenu);

// Protected Admin Mutation routes
router.post('/items', requireAdmin, validateMenuItemInput, menuController.createMenuItem);
router.put('/items/:id', requireAdmin, validateObjectIdParam('id'), validateMenuItemInput, menuController.updateMenuItem);
router.patch('/items/:id/disable', requireAdmin, validateObjectIdParam('id'), menuController.disableMenuItem);
router.delete('/items/:id', requireAdmin, validateObjectIdParam('id'), menuController.deleteMenuItem);

// Protected Availability toggle (accessible by Admin and Kitchen)
router.patch('/items/:id/availability', requireRole(['admin', 'kitchen']), validateObjectIdParam('id'), menuController.updateAvailability);

module.exports = router;
