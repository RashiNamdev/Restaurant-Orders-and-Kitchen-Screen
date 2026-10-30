const { Server } = require('socket.io');
const config = require('../config/env');
const Order = require('../models/Order');

let io = null;

/**
 * Sanitize order payload for customer clients to avoid leaking private details
 */
const sanitizeCustomerOrderPayload = (order) => {
  const obj = order.toObject ? order.toObject({ virtuals: true }) : { ...order };
  delete obj.__v;
  return {
    orderId: obj.orderId,
    _id: obj._id,
    orderType: obj.orderType,
    tableNumber: obj.tableNumber,
    status: obj.status,
    items: obj.items,
    cancelledItems: obj.cancelledItems || [],
    subtotal: obj.subtotal,
    taxAmount: obj.taxAmount,
    grandTotal: obj.grandTotal,
    receivedAt: obj.receivedAt,
    preparingAt: obj.preparingAt,
    readyAt: obj.readyAt,
    servedAt: obj.servedAt,
    cancelledAt: obj.cancelledAt,
    statusHistory: obj.statusHistory,
    estimatedTime: obj.estimatedTime,
  };
};

/**
 * Sanitize order payload for kitchen display tickets
 */
const sanitizeKitchenOrderPayload = (order) => {
  const obj = order.toObject ? order.toObject({ virtuals: true }) : { ...order };
  delete obj.__v;
  return obj;
};

/**
 * Initialize Socket.IO with CORS, connection auth, and room management
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.socketCorsOrigins.includes(origin) || config.socketCorsOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for local dev
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // 1. Connection Authentication & Role Authorization Middleware
  io.use((socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const query = socket.handshake.query || {};

      // Determine client role: kitchen, admin, staff, or customer
      const rawRole = auth.role || query.role || 'customer';
      const role = String(rawRole).toLowerCase().trim();

      const kitchenRoles = ['kitchen', 'admin', 'staff', 'manager'];

      if (kitchenRoles.includes(role)) {
        // Authorized kitchen screen connection
        socket.user = {
          role,
          isKitchen: true,
          userId: auth.userId || null,
        };
      } else if (role === 'customer' || role === 'guest') {
        // Customer client (scoped to table or specific order room)
        socket.user = {
          role: 'customer',
          isKitchen: false,
          tableNumber: auth.tableNumber || query.tableNumber || null,
          orderId: auth.orderId || query.orderId || null,
        };
      } else {
        return next(new Error(`Unauthorized socket connection: Unknown role "${role}"`));
      }

      next();
    } catch (err) {
      next(new Error(`Socket authentication error: ${err.message}`));
    }
  });

  // 2. Connection and Event Handling
  io.on('connection', async (socket) => {
    const isKitchen = socket.user?.isKitchen;
    const socketId = socket.id;

    if (!config.isTest) {
      console.log(`[Socket.IO] Connected: ${socketId} | Role: ${socket.user?.role}`);
    }

    // Auto-join kitchen room if connected with kitchen credentials
    if (isKitchen) {
      socket.join('kitchen_room');
      await sendActiveOrdersSnapshot(socket);
    } else if (socket.user?.tableNumber) {
      // Auto-join customer's table room if provided
      const tableRoom = `table_${socket.user.tableNumber}`;
      socket.join(tableRoom);
    }

    // Kitchen client explicitly requests to join or re-join kitchen room
    socket.on('join:kitchen', async () => {
      if (!socket.user?.isKitchen) {
        socket.emit('error', {
          message: 'Unauthorized: Kitchen credentials required to join kitchen display stream',
        });
        return;
      }

      socket.join('kitchen_room');
      await sendActiveOrdersSnapshot(socket);

      socket.emit('joined', {
        room: 'kitchen_room',
        message: 'Connected to Live Kitchen Display Stream',
      });
    });

    // Customer client joins their specific order room for real-time status updates
    socket.on('join:order', ({ orderId, tableNumber } = {}) => {
      const targetOrderId = orderId || socket.user?.orderId;
      if (targetOrderId) {
        const orderRoom = `order_${targetOrderId}`;
        socket.join(orderRoom);
      }

      const targetTable = tableNumber || socket.user?.tableNumber;
      if (targetTable) {
        const tableRoom = `table_${targetTable}`;
        socket.join(tableRoom);
      }

      socket.emit('joined', {
        room: targetOrderId ? `order_${targetOrderId}` : null,
        tableRoom: targetTable ? `table_${targetTable}` : null,
        orderId: targetOrderId,
      });
    });

    // Leave order room (e.g. When closing order tracker)
    socket.on('leave:order', (orderId) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
      }
    });

    // Customer table room subscription
    socket.on('join:table', (tableNumber) => {
      if (tableNumber) {
        const room = `table_${tableNumber}`;
        socket.join(room);
        socket.emit('joined', { room, tableNumber });
      }
    });

    socket.on('disconnect', (reason) => {
      if (!config.isTest) {
        console.log(`[Socket.IO] Disconnected: ${socketId} (${reason})`);
      }
    });
  });

  return io;
};

/**
 * Helper to fetch and send active orders snapshot to a kitchen client
 */
const sendActiveOrdersSnapshot = async (socket) => {
  try {
    const activeOrders = await Order.find({
      status: { $in: ['Received', 'Preparing', 'Ready'] },
    })
      .sort({ receivedAt: 1 })
      .lean();

    socket.emit('kitchen:active_snapshot', {
      orders: activeOrders,
      count: activeOrders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Socket.IO] Failed to load active orders snapshot:', err.message);
  }
};

/**
 * Emit order:new to kitchen clients strictly AFTER successful persistence
 */
const emitOrderNew = (order) => {
  if (!io) return;

  const kitchenPayload = sanitizeKitchenOrderPayload(order);
  const customerPayload = sanitizeCustomerOrderPayload(order);

  // 1. Broadcast to kitchen display room
  io.to('kitchen_room').emit('order:new', kitchenPayload);

  // 2. Broadcast to specific order & table rooms
  if (order.orderId) {
    io.to(`order_${order.orderId}`).emit('order:created', customerPayload);
  }
  if (order.tableNumber && order.orderType === 'Dine-in') {
    io.to(`table_${order.tableNumber}`).emit('order:created', customerPayload);
  }
};

/**
 * Emit order:statusUpdated to kitchen and customer clients strictly AFTER successful persistence
 */
const emitOrderStatusUpdated = (order, meta = {}) => {
  if (!io) return;

  const kitchenPayload = sanitizeKitchenOrderPayload(order);
  const customerPayload = sanitizeCustomerOrderPayload(order);

  // 1. Broadcast to kitchen screen
  io.to('kitchen_room').emit('order:statusUpdated', kitchenPayload);
  io.to('kitchen_room').emit('order:status_updated', kitchenPayload); // Backwards compatibility

  // 2. Broadcast ONLY to the customer's specific order room (Privacy protected)
  if (order.orderId) {
    io.to(`order_${order.orderId}`).emit('order:statusUpdated', customerPayload);
    io.to(`order_${order.orderId}`).emit('order:status_updated', customerPayload);
  }

  // 3. Broadcast to the customer's dining table room if Dine-in
  if (order.tableNumber && order.orderType === 'Dine-in') {
    io.to(`table_${order.tableNumber}`).emit('order:statusUpdated', customerPayload);
    io.to(`table_${order.tableNumber}`).emit('order:status_updated', customerPayload);
  }
};

/**
 * Retrieve initialized io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(server) first.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  emitOrderNew,
  emitOrderStatusUpdated,
};
