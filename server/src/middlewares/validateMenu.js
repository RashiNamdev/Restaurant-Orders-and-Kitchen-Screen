const mongoose = require('mongoose');
const AppError = require('../utils/appError');

/**
 * Validates that an ID parameter is a valid 24-character MongoDB ObjectId
 */
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new AppError(
          `Invalid ID format: "${id}" is not a valid 24-character hexadecimal ObjectId`,
          400
        )
      );
    }
    next();
  };
};

/**
 * Validates category creation and update payloads
 */
const validateCategoryInput = (req, res, next) => {
  const { name, displayOrder, isActive } = req.body;

  // On POST, name is required
  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return next(
        new AppError('Category name is required and must be at least 2 characters long', 400)
      );
    }
  }

  // If name provided on PUT, validate length
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return next(
        new AppError('Category name must be a string of at least 2 characters', 400)
      );
    }
  }

  if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0)) {
    return next(new AppError('Display order must be a non-negative number', 400));
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return next(new AppError('isActive must be a boolean value (true or false)', 400));
  }

  next();
};

/**
 * Validates menu item creation and update payloads
 */
const validateMenuItemInput = (req, res, next) => {
  const { name, category, variants, price, isVeg, isAvailable, spiceLevel } = req.body;

  // 1. Validate Item Name
  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return next(
        new AppError('Menu item name is required and must be at least 2 characters long', 400)
      );
    }
    if (!category) {
      return next(new AppError('Category ID or reference is required', 400));
    }
  } else if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return next(
        new AppError('Menu item name must be a string of at least 2 characters', 400)
      );
    }
  }

  // 2. Validate Category reference if provided
  if (category !== undefined) {
    if (typeof category === 'string' && category.trim().length === 0) {
      return next(new AppError('Category cannot be empty', 400));
    }
    // If it looks like an intended ObjectId (e.g. alphanumeric 24 chars or similar), verify validity
    if (
      typeof category === 'string' &&
      category.length === 24 &&
      !mongoose.Types.ObjectId.isValid(category)
    ) {
      return next(
        new AppError(
          `Invalid category ID format: "${category}" is not a valid ObjectId`,
          400
        )
      );
    }
  }

  // 3. Validate Variants & Pricing
  if (variants !== undefined) {
    if (!Array.isArray(variants) || variants.length === 0) {
      return next(
        new AppError(
          'At least one price variant is required (e.g., Half, Full, or Standard)',
          400
        )
      );
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v || typeof v !== 'object') {
        return next(new AppError(`Variant at index ${i} must be an object`, 400));
      }
      if (!v.name || typeof v.name !== 'string' || v.name.trim().length === 0) {
        return next(
          new AppError(`Variant at index ${i} requires a non-empty name (e.g. Half, Full)`, 400)
        );
      }
      if (v.price === undefined || v.price === null || typeof v.price !== 'number' || isNaN(v.price)) {
        return next(
          new AppError(`Variant "${v.name}" requires a valid numeric price`, 400)
        );
      }
      // REJECT NEGATIVE PRICES
      if (v.price < 0) {
        return next(
          new AppError(
            `Variant price cannot be negative. "${v.name}" was provided with invalid price: ${v.price}`,
            400
          )
        );
      }
    }
  } else if (req.method === 'POST') {
    // If no variants array is provided, but a single price is provided
    if (price !== undefined) {
      if (typeof price !== 'number' || isNaN(price) || price < 0) {
        return next(
          new AppError(
            `Price must be a non-negative number. Received: ${price}`,
            400
          )
        );
      }
      // Auto-wrap into standard variant
      req.body.variants = [
        {
          name: 'Standard',
          price: price,
          portion: req.body.portion || 'Standard Portion',
          isDefault: true,
        },
      ];
    } else {
      return next(
        new AppError(
          'A menu item must have at least one price variant (e.g., Half, Full) or a valid price',
          400
        )
      );
    }
  }

  // 4. Validate Boolean flags
  if (isVeg !== undefined && typeof isVeg !== 'boolean') {
    return next(new AppError('isVeg must be a boolean value (true or false)', 400));
  }
  if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
    return next(new AppError('isAvailable must be a boolean value (true or false)', 400));
  }

  // 5. Validate Spice Level
  if (spiceLevel !== undefined && spiceLevel !== null) {
    const validLevels = ['mild', 'medium', 'hot'];
    if (!validLevels.includes(String(spiceLevel).toLowerCase())) {
      return next(
        new AppError(
          `Invalid spiceLevel: "${spiceLevel}". Allowed values: mild, medium, hot, or null`,
          400
        )
      );
    }
  }

  next();
};

module.exports = {
  validateObjectIdParam,
  validateCategoryInput,
  validateMenuItemInput,
};
