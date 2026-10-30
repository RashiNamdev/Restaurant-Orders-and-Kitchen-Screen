const categoryService = require('../services/categoryService');
const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/categories
 * Public endpoint to list categories
 */
const getCategories = async (req, res, next) => {
  try {
    const includeInactive = req.query.all === 'true';
    const categories = await categoryService.getCategories({ includeInactive });
    return successResponse(
      res,
      categories,
      `Retrieved ${categories.length} categories`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 * Public endpoint to get single category
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return successResponse(res, category, `Category "${category.name}" retrieved`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 * Admin mutation route to create category
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return successResponse(
      res,
      category,
      `Category "${category.name}" created successfully`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 * Admin mutation route to update category
 */
const updateCategory = async (req, res, next) => {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body);
    return successResponse(
      res,
      updated,
      `Category "${updated.name}" updated successfully`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/categories/:id/disable
 * Admin mutation route to disable category
 */
const disableCategory = async (req, res, next) => {
  try {
    const disabled = await categoryService.disableCategory(req.params.id);
    return successResponse(
      res,
      disabled,
      `Category "${disabled.name}" disabled successfully`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 * Admin mutation route to delete category
 */
const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    return successResponse(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories/seed
 * Seed default categories
 */
const seedCategories = async (req, res, next) => {
  try {
    const result = await categoryService.seedInitialCategories();
    return successResponse(res, result, 'Categories seeded successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  disableCategory,
  deleteCategory,
  seedCategories,
};
