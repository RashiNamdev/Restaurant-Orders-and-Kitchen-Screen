const mongoose = require('mongoose');
const { Category } = require('../models');
const AppError = require('../utils/appError');

/**
 * Fetch categories (default returns active only)
 */
const getCategories = async ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };
  const categories = await Category.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .select('-__v');
  return categories;
};

/**
 * Fetch a single category by ObjectId or slug
 */
const getCategoryById = async (idOrSlug) => {
  let category;

  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    category = await Category.findById(idOrSlug).select('-__v');
  }

  if (!category) {
    category = await Category.findOne({ slug: idOrSlug.toLowerCase().trim() }).select('-__v');
  }

  if (!category) {
    throw new AppError(`Category not found with identifier: "${idOrSlug}"`, 404);
  }

  return category;
};

/**
 * Create a new category
 */
const createCategory = async (categoryData) => {
  const existingName = await Category.findOne({
    name: { $regex: new RegExp(`^${categoryData.name.trim()}$`, 'i') },
  });

  if (existingName) {
    throw new AppError(`A category named "${categoryData.name}" already exists`, 400);
  }

  const category = new Category({
    name: categoryData.name.trim(),
    slug: categoryData.slug,
    description: categoryData.description || '',
    icon: categoryData.icon || 'UtensilsCrossed',
    displayOrder: categoryData.displayOrder !== undefined ? categoryData.displayOrder : 0,
    isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
  });

  await category.save();
  return category;
};

/**
 * Update existing category
 */
const updateCategory = async (id, updateData) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(`Category not found with ID: "${id}"`, 404);
  }

  // If name is changing, check uniqueness
  if (updateData.name && updateData.name.trim() !== category.name) {
    const existing = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
    });
    if (existing) {
      throw new AppError(`A category named "${updateData.name}" already exists`, 400);
    }
    category.name = updateData.name.trim();
  }

  if (updateData.description !== undefined) category.description = updateData.description;
  if (updateData.icon !== undefined) category.icon = updateData.icon;
  if (updateData.displayOrder !== undefined) category.displayOrder = updateData.displayOrder;
  if (updateData.isActive !== undefined) category.isActive = updateData.isActive;

  await category.save();
  return category;
};

/**
 * Disable category (sets isActive to false)
 */
const disableCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(`Category not found with ID: "${id}"`, 404);
  }

  category.isActive = false;
  await category.save();
  return category;
};

/**
 * Delete category permanently
 */
const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(`Category not found with ID: "${id}"`, 404);
  }

  await Category.findByIdAndDelete(id);
  return { message: `Category "${category.name}" successfully deleted` };
};

/**
 * Seed initial categories if none exist
 */
const seedInitialCategories = async () => {
  const count = await Category.countDocuments();
  if (count > 0) return await Category.find().sort({ displayOrder: 1 });

  const defaults = [
    { name: 'Starters & Appetizers', slug: 'starters', icon: 'Flame', displayOrder: 1 },
    { name: 'Main Course', slug: 'main-course', icon: 'Soup', displayOrder: 2 },
    { name: 'Biryani & Rice', slug: 'biryani', icon: 'Sparkles', displayOrder: 3 },
    { name: 'Tandoor & Breads', slug: 'breads', icon: 'ChefHat', displayOrder: 4 },
    { name: 'Desserts', slug: 'desserts', icon: 'Cake', displayOrder: 5 },
    { name: 'Beverages', slug: 'beverages', icon: 'Coffee', displayOrder: 6 },
  ];

  return await Category.insertMany(defaults);
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  disableCategory,
  deleteCategory,
  seedInitialCategories,
};
