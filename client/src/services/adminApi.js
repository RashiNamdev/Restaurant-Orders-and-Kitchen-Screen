const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Common helper to attach role authorization header
 */
const getAuthHeaders = (role = 'admin') => ({
  'Content-Type': 'application/json',
  'x-user-role': role,
});

/**
 * Fetch executive admin summary and local date revenue
 */
export const fetchAdminSummary = async (role = 'admin') => {
  const res = await fetch(`${API_BASE_URL}/admin/summary`, {
    headers: getAuthHeaders(role),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to fetch admin summary');
  }
  return result.data;
};

/**
 * Fetch searchable and filterable order list for admin
 */
export const fetchAdminOrders = async (
  { search = '', status = 'all', orderType = 'all', date = 'all', page = 1, limit = 25 } = {},
  role = 'admin'
) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'all') params.append('status', status);
  if (orderType && orderType !== 'all') params.append('orderType', orderType);
  if (date && date !== 'all') params.append('date', date);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${API_BASE_URL}/admin/orders?${params.toString()}`, {
    headers: getAuthHeaders(role),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to fetch admin orders');
  }
  return result.data;
};

/**
 * Create a new menu item with variants
 */
export const createMenuItemApi = async (itemData, role = 'admin') => {
  const res = await fetch(`${API_BASE_URL}/menu/items`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(itemData),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to create menu item');
  }
  return result.data;
};

/**
 * Update an existing menu item and variants
 */
export const updateMenuItemApi = async (id, itemData, role = 'admin') => {
  const res = await fetch(`${API_BASE_URL}/menu/items/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(role),
    body: JSON.stringify(itemData),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to update menu item');
  }
  return result.data;
};

/**
 * Toggle menu item availability (In-Stock vs Out-of-Stock)
 */
export const toggleItemAvailabilityApi = async (id, isAvailable, role = 'admin') => {
  const res = await fetch(`${API_BASE_URL}/menu/items/${id}/availability`, {
    method: 'PATCH',
    headers: getAuthHeaders(role),
    body: JSON.stringify({ isAvailable }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to update item availability');
  }
  return result.data;
};

/**
 * Delete a menu item
 */
export const deleteMenuItemApi = async (id, role = 'admin') => {
  const res = await fetch(`${API_BASE_URL}/menu/items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(role),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to delete menu item');
  }
  return result.data;
};

/**
 * Fetch all categories
 */
export const fetchCategoriesApi = async () => {
  const res = await fetch(`${API_BASE_URL}/categories`);
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to fetch categories');
  }
  return result.data;
};

/**
 * Create category
 */
export const createCategoryApi = async (categoryData, role = 'admin') => {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(role),
    body: JSON.stringify(categoryData),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to create category');
  }
  return result.data;
};
