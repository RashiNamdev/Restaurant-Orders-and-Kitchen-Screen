import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket Manager for Kitchen and Customer clients
 * Handles role-based authentication, automatic reconnection,
 * room join/leave lifecycle, and event deduplication.
 */
class SocketService {
  constructor() {
    this.kitchenSocket = null;
    this.customerSocket = null;
    this.subscribedOrderRooms = new Set();
    this.subscribedTableRooms = new Set();
  }

  /**
   * Get or create kitchen socket
   * @param {string} role 'kitchen' | 'admin' | 'staff'
   */
  getKitchenSocket(role = 'kitchen') {
    if (this.kitchenSocket && this.kitchenSocket.connected) {
      return this.kitchenSocket;
    }

    if (this.kitchenSocket) {
      this.kitchenSocket.disconnect();
    }

    this.kitchenSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        role: role || 'kitchen',
      },
    });

    this.kitchenSocket.on('connect', () => {
      console.log(`[Socket] Kitchen connected (ID: ${this.kitchenSocket.id}) with role: ${role}`);
      // Join kitchen room on connect and reconnect
      this.kitchenSocket.emit('join:kitchen');
    });

    this.kitchenSocket.on('disconnect', (reason) => {
      console.log(`[Socket] Kitchen disconnected: ${reason}`);
    });

    this.kitchenSocket.on('connect_error', (err) => {
      console.warn(`[Socket] Kitchen connection error: ${err.message}`);
    });

    return this.kitchenSocket;
  }

  /**
   * Get or create customer socket
   * @param {string} tableNumber Table identifier for dine-in
   */
  getCustomerSocket(tableNumber = '') {
    if (this.customerSocket && this.customerSocket.connected) {
      return this.customerSocket;
    }

    if (this.customerSocket) {
      this.customerSocket.disconnect();
    }

    this.customerSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        role: 'customer',
        tableNumber: tableNumber || undefined,
      },
    });

    this.customerSocket.on('connect', () => {
      console.log(`[Socket] Customer connected (ID: ${this.customerSocket.id})`);
      // Re-join any previously subscribed orders/tables upon reconnect
      this.subscribedOrderRooms.forEach((orderId) => {
        this.customerSocket.emit('join:order', { orderId });
      });
      this.subscribedTableRooms.forEach((tbl) => {
        this.customerSocket.emit('join:order', { tableNumber: tbl });
      });
    });

    this.customerSocket.on('disconnect', (reason) => {
      console.log(`[Socket] Customer disconnected: ${reason}`);
    });

    this.customerSocket.on('connect_error', (err) => {
      console.warn(`[Socket] Customer connection error: ${err.message}`);
    });

    return this.customerSocket;
  }

  /**
   * Subscribe customer socket to updates for a specific order and/or table
   * @param {Object} params
   * @param {string} [params.orderId]
   * @param {string} [params.tableNumber]
   * @param {Function} [params.onStatusUpdated] Callback when order status changes
   * @returns {Function} Unsubscribe cleanup function
   */
  subscribeToCustomerOrder({ orderId, tableNumber, onStatusUpdated }) {
    const socket = this.getCustomerSocket(tableNumber);

    if (orderId) {
      this.subscribedOrderRooms.add(orderId);
      socket.emit('join:order', { orderId });
    }
    if (tableNumber) {
      this.subscribedTableRooms.add(tableNumber);
      socket.emit('join:order', { tableNumber });
    }

    const handleStatusUpdate = (payload) => {
      if (!payload) return;
      // Filter to relevant order if orderId was specified
      if (orderId && payload.orderId && payload.orderId !== orderId) {
        return;
      }
      if (onStatusUpdated) {
        onStatusUpdated(payload);
      }
    };

    // Listen to both standard camelCase and snake_case events
    socket.on('order:statusUpdated', handleStatusUpdate);
    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      if (orderId) {
        this.subscribedOrderRooms.delete(orderId);
        socket.emit('leave:order', { orderId });
      }
      if (tableNumber) {
        this.subscribedTableRooms.delete(tableNumber);
        socket.emit('leave:order', { tableNumber });
      }
      socket.off('order:statusUpdated', handleStatusUpdate);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }

  /**
   * Disconnect all active sockets
   */
  disconnectAll() {
    if (this.kitchenSocket) {
      this.kitchenSocket.disconnect();
      this.kitchenSocket = null;
    }
    if (this.customerSocket) {
      this.customerSocket.disconnect();
      this.customerSocket = null;
    }
    this.subscribedOrderRooms.clear();
    this.subscribedTableRooms.clear();
  }
}

export const socketService = new SocketService();
export default socketService;
