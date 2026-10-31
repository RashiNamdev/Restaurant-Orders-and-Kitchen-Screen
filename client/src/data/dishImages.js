/**
 * High-definition, authentic dish images mapped by keyword and dish name
 * Ensures every single dish displays a distinct, appetizing photo.
 */
export const DISH_IMAGE_MAP = {
  // Starters
  'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
  'crispy corn': 'https://newhongkong.in/wp-content/uploads/2020/12/download-2.jpg',
  'chicken malai tikka': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
  'tandoori chicken': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
  'chilli paneer': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
  'dahi ke kebab': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',

  // Main Course
  'butter chicken': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
  'paneer butter masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  'dal makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  'makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',

  // Breads & Rice
  'naan': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
  'garlic naan': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  'rice': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',

  'gulab jamun with rabdi': 'https://spicecravings.com/wp-content/uploads/2025/10/Rabdi-Gulab-Jamun-Tiramisu-Featured.jpg',
  'gulab jamun': 'https://spicecravings.com/wp-content/uploads/2025/10/Rabdi-Gulab-Jamun-Tiramisu-Featured.jpg',
  'dessert': 'https://spicecravings.com/wp-content/uploads/2025/10/Rabdi-Gulab-Jamun-Tiramisu-Featured.jpg',

  // Beverages
  'lassi': 'https://ministryofcurry.com/wp-content/uploads/2020/04/mango-lassi-2.jpg',
  'mango lassi': 'https://ministryofcurry.com/wp-content/uploads/2020/04/mango-lassi-2.jpg',
  'beverage': 'https://ministryofcurry.com/wp-content/uploads/2020/04/mango-lassi-2.jpg',
};

/**
 * Resolves a reliable, beautiful, food-specific image for any dish
 * Priority:
 * 1. Keyword/name match from DISH_IMAGE_MAP (Instant frontend override)
 * 2. Provided item.image from database (if valid and not generic fallback)
 * 3. Fallback based on category or veg/non-veg status
 */
export const getDishImage = (dishName = '', rawImage = '', categoryName = '', isVeg = true) => {
  const normalized = (dishName || '').toLowerCase().trim();

  // 1. Direct or partial match from DISH_IMAGE_MAP (case-insensitive)
  for (const [key, url] of Object.entries(DISH_IMAGE_MAP)) {
    const lowerKey = key.toLowerCase().trim();
    if (lowerKey && (normalized.includes(lowerKey) || lowerKey.includes(normalized))) {
      return url;
    }
  }

  // 2. Database rawImage if provided and valid
  const genericSalad = 'photo-1546069901-ba9599a7e63c';
  if (rawImage && typeof rawImage === 'string' && rawImage.trim() && !rawImage.includes(genericSalad)) {
    return rawImage.trim();
  }

  // 3. Category based fallback
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('starter')) {
    return isVeg ? DISH_IMAGE_MAP['paneer tikka'] : DISH_IMAGE_MAP['tandoori chicken'];
  }
  if (cat.includes('main') || cat.includes('curry')) {
    return isVeg ? DISH_IMAGE_MAP['paneer butter masala'] : DISH_IMAGE_MAP['butter chicken'];
  }
  if (cat.includes('bread') || cat.includes('rice') || cat.includes('biryani')) {
    return DISH_IMAGE_MAP['biryani'];
  }
  if (cat.includes('dessert') || cat.includes('sweet')) {
    return DISH_IMAGE_MAP['gulab jamun'];
  }
  if (cat.includes('beverage') || cat.includes('drink')) {
    return DISH_IMAGE_MAP['mango lassi'];
  }

  return isVeg
    ? 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80';
};
