const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch orders from backend
 * @param {'active' | 'history' | null} view 
 * @param {string | null} status 
 */
export const fetchOrders = async (view = 'active', status = null) => {
  const params = new URLSearchParams();
  if (view) params.append('view', view);
  if (status) params.append('status', status);

  const res = await fetch(`${API_BASE_URL}/orders?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch orders from server');
  }
  const result = await res.json();
  return result.data || [];
};

/**
 * Advance an order's status
 * Enforces role check on backend via x-user-role header
 * @param {string} orderId 
 * @param {'Preparing' | 'Ready' | 'Served' | 'Cancelled'} nextStatus 
 * @param {string} role 
 * @param {string} note 
 */
export const updateOrderStatusApi = async (
  orderId,
  nextStatus,
  role = 'kitchen',
  note = ''
) => {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': role, // Role check header enforced by backend authRole middleware
    },
    body: JSON.stringify({
      status: nextStatus,
      note,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || 'Server rejected status update');
  }

  return result.data;
};

/**
 * Seed demo orders for testing
 */
export const seedDemoOrdersApi = async () => {
  const res = await fetch(`${API_BASE_URL}/orders/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const result = await res.json();
  return result.data;
};

/**
 * Submit customer order to backend database
 * @param {Object} orderData 
 */
export const createOrderApi = async (orderData) => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Failed to submit order to backend');
  }
  return result.data;
};

/**
 * Fetch single order by orderId or MongoDB ObjectId
 * @param {string} orderId 
 */
export const fetchOrderByIdApi = async (orderId) => {
  if (!orderId || !orderId.trim()) {
    throw new Error('Please enter a valid order ID');
  }

  const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId.trim())}`);
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || `Order not found with ID #${orderId}`);
  }

  return result.data;
};

