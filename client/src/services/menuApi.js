import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Fetch public menu data from Express backend using Axios
 * @param {Object} queryParams { category, isVeg, search, isAvailable }
 * @returns {Promise<{ categories: Array, items: Array, categoryCounts: Object, total: number }>}
 */
export const fetchPublicMenuApi = async (queryParams = {}) => {
  const cleanParams = {};
  if (queryParams.category && queryParams.category !== 'all') {
    cleanParams.category = queryParams.category;
  }
  if (queryParams.isVeg !== undefined && queryParams.isVeg !== 'all') {
    cleanParams.isVeg = queryParams.isVeg;
  }
  if (queryParams.search && queryParams.search.trim()) {
    cleanParams.search = queryParams.search.trim();
  }

  const response = await apiClient.get('/menu', { params: cleanParams });
  if (!response.data || !response.data.success) {
    throw new Error(response.data?.message || 'Failed to fetch menu from server');
  }

  return response.data.data;
};

export default {
  fetchPublicMenuApi,
  apiClient,
};
