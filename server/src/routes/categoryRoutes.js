const express = require('express');
const categoryController = require('../controllers/categoryController');
const { requireAdmin } = require('../middlewares/authRole');
const {
  validateObjectIdParam,
  validateCategoryInput,
} = require('../middlewares/validateMenu');

const router = express.Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/seed', categoryController.seedCategories);

// Protected Admin Mutation routes
router.post('/', requireAdmin, validateCategoryInput, categoryController.createCategory);
router.put('/:id', requireAdmin, validateObjectIdParam('id'), validateCategoryInput, categoryController.updateCategory);
router.patch('/:id/disable', requireAdmin, validateObjectIdParam('id'), categoryController.disableCategory);
router.delete('/:id', requireAdmin, validateObjectIdParam('id'), categoryController.deleteCategory);

module.exports = router;
