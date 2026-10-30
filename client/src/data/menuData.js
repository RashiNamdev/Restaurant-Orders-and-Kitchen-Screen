/**
 * Restaurant metadata and configuration
 * Note: Menu items and categories are now dynamically served by Express + MongoDB backend
 * via the GET /api/menu endpoint.
 */
export const RESTAURANT_INFO = {
  name: "Saffron & Spice Bistro",
  tagline: "Authentic Indian Flavors & Tandoori Delights",
  rating: 4.8,
  reviewCount: 384,
  location: "Table 04 • Indoor Dining",
  openingHours: "11:30 AM - 11:00 PM",
  kitchenStatus: "Open & Accepting Orders",
  estimatedWait: "15-25 min",
  phone: "+91 98765 43210",
  gstPercent: 5,
};

// Deprecated: Maintained as empty fallbacks; dishes are loaded dynamically from /api/menu
export const CATEGORIES = [];
export const MENU_ITEMS = [];
