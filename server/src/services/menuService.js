const mongoose = require('mongoose');
const { MenuItem, Category } = require('../models');
const AppError = require('../utils/appError');
const categoryService = require('./categoryService');

/**
 * Fetch public menu (categories and dishes)
 * Strips internal fields like __v and optimizes response for customer frontend
 */
const getPublicMenu = async ({ category, isVeg, isAvailable, search } = {}) => {
  // 1. Fetch active categories (auto-seed if empty)
  let categories = await Category.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .select('-__v');

  if (categories.length === 0) {
    await seedMenuItems();
    categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');
  }

  // 2. Build item filter
  const itemFilter = {};

  // By default in public menu, show items (available and out-of-stock items shown with Sold Out flag)
  if (isAvailable !== undefined) {
    itemFilter.isAvailable = isAvailable === 'true' || isAvailable === true;
  }

  // Dietary filter
  if (isVeg !== undefined && isVeg !== 'all' && isVeg !== '') {
    itemFilter.isVeg = isVeg === 'true' || isVeg === true;
  }

  // Category filter
  if (category && category !== 'all') {
    // If category is a slug or ObjectId, find matching category
    let matchedCat;
    if (mongoose.Types.ObjectId.isValid(category)) {
      matchedCat = categories.find((c) => c._id.toString() === category);
    }
    if (!matchedCat) {
      matchedCat = categories.find((c) => c.slug === category.toLowerCase());
    }

    if (matchedCat) {
      itemFilter.$or = [
        { category: matchedCat._id },
        { category: matchedCat.slug },
      ];
    } else {
      itemFilter.category = category;
    }
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim();
    itemFilter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  // 3. Query items and populate category details
  const rawItems = await MenuItem.find(itemFilter)
    .populate('category', 'name slug icon displayOrder')
    .sort({ isBestseller: -1, isChefSpecial: -1, isAvailable: -1, name: 1 })
    .lean({ virtuals: true });

  // 4. Sanitize and format items for frontend consumption
  const items = rawItems.map((item) => {
    delete item.__v;

    // Resolve category slug and name cleanly
    let categorySlug = 'other';
    let categoryName = 'General';
    let categoryId = item.category;

    if (item.category && typeof item.category === 'object') {
      categoryId = item.category._id || item.category.id;
      categorySlug = item.category.slug || 'other';
      categoryName = item.category.name || 'General';
    } else if (typeof item.category === 'string') {
      categorySlug = item.category;
      const found = categories.find((c) => c.slug === item.category);
      if (found) {
        categoryName = found.name;
        categoryId = found._id;
      }
    }

    // Build variantsMap for backward-compatibility with UI components (e.g. variants.half, variants.full)
    const variantsMap = {};
    if (Array.isArray(item.variants)) {
      item.variants.forEach((v) => {
        const key = (v.name || '').toLowerCase().trim();
        variantsMap[key] = {
          id: v._id ? v._id.toString() : key,
          name: v.name,
          label: `${v.name} Plate`,
          portion: v.portion || '',
          price: v.price,
          isDefault: v.isDefault || false,
        };
      });
    }

    return {
      id: item._id ? item._id.toString() : item.id,
      _id: item._id,
      name: item.name,
      category: categorySlug,
      categoryName,
      categoryId,
      description: item.description || '',
      image: item.image || '',
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isChefSpecial: item.isChefSpecial || false,
      isBestseller: item.isBestseller || false,
      rating: item.rating || 4.5,
      prepTime: item.prepTime || '15 min',
      spiceLevel: item.spiceLevel || null,
      variants: item.variants || [],
      variantsMap,
      hasVariants: Array.isArray(item.variants) && item.variants.length > 1,
      price: item.price || item.basePrice || 0,
      basePrice: item.basePrice || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  // 5. Compute dynamic counts for category navigation
  const allDishes = await MenuItem.find({}).lean();
  const categoryCounts = { all: allDishes.length };

  categories.forEach((cat) => {
    const count = allDishes.filter((dish) => {
      if (!dish.category) return false;
      const catVal = typeof dish.category === 'object' ? dish.category.toString() : dish.category;
      return catVal === cat._id.toString() || catVal === cat.slug;
    }).length;
    categoryCounts[cat.slug] = count;
  });

  return {
    categories: categories.map((cat) => ({
      id: cat.slug,
      _id: cat._id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      displayOrder: cat.displayOrder,
      count: categoryCounts[cat.slug] || 0,
    })),
    items,
    categoryCounts,
    total: items.length,
  };
};

/**
 * Fetch a single menu item by ID
 */
const getMenuItemById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid menu item ID format: "${id}"`, 400);
  }

  const item = await MenuItem.findById(id)
    .populate('category', 'name slug icon')
    .select('-__v');

  if (!item) {
    throw new AppError(`Menu item not found with ID: "${id}"`, 404);
  }

  return item;
};

/**
 * Create a new menu item
 */
const createMenuItem = async (itemData) => {
  // 1. Validate Category exists
  let targetCategory;
  if (mongoose.Types.ObjectId.isValid(itemData.category)) {
    targetCategory = await Category.findById(itemData.category);
  }

  if (!targetCategory && typeof itemData.category === 'string') {
    targetCategory = await Category.findOne({ slug: itemData.category.toLowerCase().trim() });
  }

  if (!targetCategory) {
    throw new AppError(
      `Category not found with identifier: "${itemData.category}". Please specify a valid category.`,
      400
    );
  }

  // 2. Validate Variants and Prices
  if (!Array.isArray(itemData.variants) || itemData.variants.length === 0) {
    throw new AppError('A menu item must have at least one price variant', 400);
  }

  for (const v of itemData.variants) {
    if (v.price === undefined || v.price === null || typeof v.price !== 'number' || v.price < 0) {
      throw new AppError(`Variant price cannot be negative: ${v.price}`, 400);
    }
  }

  const newItem = new MenuItem({
    name: itemData.name.trim(),
    category: targetCategory._id,
    description: itemData.description || '',
    image: itemData.image || '',
    isVeg: itemData.isVeg !== undefined ? itemData.isVeg : true,
    isAvailable: itemData.isAvailable !== undefined ? itemData.isAvailable : true,
    variants: itemData.variants,
    spiceLevel: itemData.spiceLevel || null,
    isChefSpecial: itemData.isChefSpecial || false,
    isBestseller: itemData.isBestseller || false,
    rating: itemData.rating || 4.5,
    prepTime: itemData.prepTime || '15 min',
  });

  await newItem.save();
  await newItem.populate('category', 'name slug icon');
  return newItem;
};

/**
 * Update an existing menu item
 */
const updateMenuItem = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid menu item ID format: "${id}"`, 400);
  }

  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError(`Menu item not found with ID: "${id}"`, 404);
  }

  // 1. If category updated, verify existence
  if (updateData.category) {
    let targetCat;
    if (mongoose.Types.ObjectId.isValid(updateData.category)) {
      targetCat = await Category.findById(updateData.category);
    }
    if (!targetCat && typeof updateData.category === 'string') {
      targetCat = await Category.findOne({ slug: updateData.category.toLowerCase().trim() });
    }
    if (!targetCat) {
      throw new AppError(`Category not found with identifier: "${updateData.category}"`, 400);
    }
    item.category = targetCat._id;
  }

  // 2. If variants updated, verify
  if (updateData.variants) {
    if (!Array.isArray(updateData.variants) || updateData.variants.length === 0) {
      throw new AppError('Menu item must have at least one price variant', 400);
    }
    for (const v of updateData.variants) {
      if (typeof v.price !== 'number' || v.price < 0) {
        throw new AppError(`Variant price cannot be negative: ${v.price}`, 400);
      }
    }
    item.variants = updateData.variants;
  }

  if (updateData.name) item.name = updateData.name.trim();
  if (updateData.description !== undefined) item.description = updateData.description;
  if (updateData.image !== undefined) item.image = updateData.image;
  if (updateData.isVeg !== undefined) item.isVeg = updateData.isVeg;
  if (updateData.isAvailable !== undefined) item.isAvailable = updateData.isAvailable;
  if (updateData.spiceLevel !== undefined) item.spiceLevel = updateData.spiceLevel;
  if (updateData.isChefSpecial !== undefined) item.isChefSpecial = updateData.isChefSpecial;
  if (updateData.isBestseller !== undefined) item.isBestseller = updateData.isBestseller;
  if (updateData.rating !== undefined) item.rating = updateData.rating;
  if (updateData.prepTime !== undefined) item.prepTime = updateData.prepTime;

  await item.save();
  await item.populate('category', 'name slug icon');
  return item;
};

/**
 * Toggle or set availability
 */
const setMenuItemAvailability = async (id, isAvailable) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid menu item ID format: "${id}"`, 400);
  }

  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError(`Menu item not found with ID: "${id}"`, 404);
  }

  item.isAvailable = Boolean(isAvailable);
  await item.save();
  return item;
};

/**
 * Disable item (sets isAvailable to false)
 */
const disableMenuItem = async (id) => {
  return setMenuItemAvailability(id, false);
};

/**
 * Delete menu item
 */
const deleteMenuItem = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid menu item ID format: "${id}"`, 400);
  }

  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError(`Menu item not found with ID: "${id}"`, 404);
  }

  await MenuItem.findByIdAndDelete(id);
  return { message: `Menu item "${item.name}" deleted successfully` };
};

/**
 * Seed realistic dishes if menu is empty
 */
const seedMenuItems = async () => {
  const existingCount = await MenuItem.countDocuments();
  if (existingCount > 0) {
    return { count: existingCount, message: 'Menu already contains dishes' };
  }

  // Ensure categories exist
  await categoryService.seedInitialCategories();
  const categories = await Category.find();

  const getCatId = (slug) => {
    const found = categories.find((c) => c.slug === slug);
    return found ? found._id : categories[0]._id;
  };

  const sampleDishes = [
    {
      name: 'Tandoori Chicken Tikka',
      category: getCatId('starters'),
      description: 'Tender boneless chicken marinated in spiced yogurt, smoked in clay tandoor with mint dip.',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      isVeg: false,
      isChefSpecial: true,
      isBestseller: true,
      spiceLevel: 'medium',
      isAvailable: true,
      rating: 4.9,
      prepTime: '15 min',
      variants: [
        { name: 'Half', portion: '4 pcs', price: 210, isDefault: true },
        { name: 'Full', portion: '8 pcs', price: 380, isDefault: false },
      ],
    },
    {
      name: 'Crispy Chilli Paneer Dry',
      category: getCatId('starters'),
      description: 'Golden fried cottage cheese tossed with crunchy bell peppers, spring onions, and tangy garlic sauce.',
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isChefSpecial: false,
      isBestseller: true,
      spiceLevel: 'hot',
      isAvailable: true,
      rating: 4.7,
      prepTime: '12 min',
      variants: [
        { name: 'Half', portion: 'Small', price: 180, isDefault: true },
        { name: 'Full', portion: 'Regular', price: 310, isDefault: false },
      ],
    },
    {
      name: 'Dahi Ke Kebab',
      category: getCatId('starters'),
      description: 'Melt-in-mouth spiced hung curd patties with green herbs and crushed roasted coriander.',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isChefSpecial: true,
      isBestseller: false,
      spiceLevel: 'mild',
      isAvailable: true,
      rating: 4.8,
      prepTime: '14 min',
      variants: [
        { name: 'Half', portion: '4 pcs', price: 160, isDefault: true },
        { name: 'Full', portion: '8 pcs', price: 290, isDefault: false },
      ],
    },
    {
      name: 'Paneer Butter Masala',
      category: getCatId('main-course'),
      description: 'Char-grilled cottage cheese simmered in velvety tomato, butter, and fragrant fenugreek gravy.',
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isChefSpecial: false,
      isBestseller: true,
      spiceLevel: 'mild',
      isAvailable: true,
      rating: 4.9,
      prepTime: '20 min',
      variants: [
        { name: 'Half', portion: '350ml', price: 195, isDefault: true },
        { name: 'Full', portion: '700ml', price: 340, isDefault: false },
      ],
    },
    {
      name: 'Old Delhi Butter Chicken',
      category: getCatId('main-course'),
      description: 'Succulent tandoori chicken cooked in a legendary creamy tomato makhani sauce infused with butter.',
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
      isVeg: false,
      isChefSpecial: true,
      isBestseller: true,
      spiceLevel: 'mild',
      isAvailable: true,
      rating: 4.9,
      prepTime: '22 min',
      variants: [
        { name: 'Half', portion: '2 pcs bone-in', price: 260, isDefault: true },
        { name: 'Full', portion: '4 pcs bone-in', price: 460, isDefault: false },
      ],
    },
    {
      name: 'Dum Handi Chicken Biryani',
      category: getCatId('biryani'),
      description: 'Slow-cooked aromatic basmati rice layered with marinated chicken, saffron, and fried onions with raita.',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      isVeg: false,
      isChefSpecial: true,
      isBestseller: true,
      spiceLevel: 'medium',
      isAvailable: true,
      rating: 4.9,
      prepTime: '25 min',
      variants: [
        { name: 'Half', portion: 'Serves 1', price: 240, isDefault: true },
        { name: 'Full', portion: 'Serves 2-3', price: 420, isDefault: false },
      ],
    },
    {
      name: 'Butter Garlic Naan',
      category: getCatId('breads'),
      description: 'Crisp yet fluffy leavened bread baked in clay tandoor, topped with minced garlic, fresh coriander and butter.',
      image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isChefSpecial: false,
      isBestseller: true,
      spiceLevel: null,
      isAvailable: true,
      rating: 4.8,
      prepTime: '8 min',
      variants: [
        { name: 'Single', portion: '1 pc', price: 65, isDefault: true },
        { name: 'Basket', portion: '3 pcs', price: 175, isDefault: false },
      ],
    },
    {
      name: 'Shahi Gulab Jamun',
      category: getCatId('desserts'),
      description: 'Warm soft milk dumplings soaked in cardamom rose syrup, garnished with slivered pistachios.',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isChefSpecial: false,
      isBestseller: true,
      spiceLevel: null,
      isAvailable: true,
      rating: 4.8,
      prepTime: '5 min',
      variants: [
        { name: 'Single', portion: '2 pcs', price: 90, isDefault: true },
        { name: 'Family', portion: '5 pcs', price: 199, isDefault: false },
      ],
    },
    {
      name: 'Kesari Mango Lassi',
      category: getCatId('beverages'),
      description: 'Thick churned creamy yogurt blended with Alphonso mango pulp and a pinch of saffron threads.',
      image: 'https://images.unsplash.com/photo-1571006687899-7f320b57e497?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isChefSpecial: false,
      isBestseller: true,
      spiceLevel: null,
      isAvailable: true,
      rating: 4.9,
      prepTime: '5 min',
      variants: [
        { name: 'Regular', portion: '350ml glass', price: 110, isDefault: true },
        { name: 'Large', portion: '500ml glass', price: 160, isDefault: false },
      ],
    },
  ];

  const created = await MenuItem.insertMany(sampleDishes);
  return { count: created.length, message: `Successfully seeded ${created.length} menu items` };
};

module.exports = {
  getPublicMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  setMenuItemAvailability,
  disableMenuItem,
  deleteMenuItem,
  seedMenuItems,
};
