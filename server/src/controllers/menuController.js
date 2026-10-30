const menuService = require('../services/menuService');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * GET /api/menu
 * Public customer menu endpoint with category population and variant details
 */
const getPublicMenu = async (req, res, next) => {
  try {
    const { category, isVeg, isAvailable, search } = req.query;
    const menuData = await menuService.getPublicMenu({
      category,
      isVeg,
      isAvailable,
      search,
    });

    return successResponse(
      res,
      menuData,
      `Loaded ${menuData.total} menu items across ${menuData.categories.length} categories`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/menu/items/:id
 * Fetch single menu item by ID
 */
const getMenuItemById = async (req, res, next) => {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
    return successResponse(res, item, `Menu item "${item.name}" retrieved successfully`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/menu/items
 * Admin mutation route to create new menu item
 */
const createMenuItem = async (req, res, next) => {
  try {
    const newItem = await menuService.createMenuItem(req.body);
    return successResponse(
      res,
      newItem,
      `Menu item "${newItem.name}" created successfully`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/menu/items/:id
 * Admin mutation route to update menu item
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const updatedItem = await menuService.updateMenuItem(req.params.id, req.body);
    return successResponse(
      res,
      updatedItem,
      `Menu item "${updatedItem.name}" updated successfully`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/menu/items/:id/availability
 * Admin / Kitchen mutation route to toggle item availability
 */
const updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    if (isAvailable === undefined) {
      throw new AppError('Field "isAvailable" (boolean) is required in request body', 400);
    }

    const updated = await menuService.setMenuItemAvailability(req.params.id, isAvailable);
    return successResponse(
      res,
      updated,
      `Item "${updated.name}" availability set to: ${updated.isAvailable}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/menu/items/:id/disable
 * Admin mutation route to disable menu item
 */
const disableMenuItem = async (req, res, next) => {
  try {
    const disabled = await menuService.disableMenuItem(req.params.id);
    return successResponse(
      res,
      disabled,
      `Menu item "${disabled.name}" disabled successfully`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/menu/items/:id
 * Admin mutation route to delete menu item
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const result = await menuService.deleteMenuItem(req.params.id);
    return successResponse(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/menu/seed
 * Seed sample menu items
 */
const seedMenu = async (req, res, next) => {
  try {
    const result = await menuService.seedMenuItems();
    return successResponse(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  updateAvailability,
  disableMenuItem,
  deleteMenuItem,
  seedMenu,
};
