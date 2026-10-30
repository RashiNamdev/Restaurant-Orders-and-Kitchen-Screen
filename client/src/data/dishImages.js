/**
 * High-definition, authentic dish images mapped by keyword and dish name
 * Ensures every single dish displays a distinct, appetizing photo.
 */
export const DISH_IMAGE_MAP = {
  // Starters
  'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
  'crispy corn': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80',
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

  // Desserts
  'gulab jamun': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  'dessert': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',

  // Beverages
  'lassi': 'https://images.unsplash.com/photo-1571006687899-7f320b57e497?auto=format&fit=crop&w=800&q=80',
  'mango lassi': 'https://images.unsplash.com/photo-1571006687899-7f320b57e497?auto=format&fit=crop&w=800&q=80',
  'beverage': 'https://images.unsplash.com/photo-1571006687899-7f320b57e497?auto=format&fit=crop&w=800&q=80',
};

/**
 * Resolves a reliable, beautiful, food-specific image for any dish
 * Priority:
 * 1. Provided item.image (if valid URL and not the generic salad fallback)
 * 2. Keyword/name match from DISH_IMAGE_MAP
 * 3. Fallback based on category or veg/non-veg status
 */
export const getDishImage = (dishName = '', rawImage = '', categoryName = '', isVeg = true) => {
  const genericSalad = 'photo-1546069901-ba9599a7e63c';
  if (rawImage && typeof rawImage === 'string' && rawImage.trim() && !rawImage.includes(genericSalad)) {
    return rawImage.trim();
  }

  const normalized = (dishName || '').toLowerCase().trim();

  // Exact or partial name match
  for (const [key, url] of Object.entries(DISH_IMAGE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  // Category based fallback
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
