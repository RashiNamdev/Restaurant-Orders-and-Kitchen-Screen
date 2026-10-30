const mongoose = require('mongoose');
const { Order, MenuItem } = require('../models');
const AppError = require('../utils/appError');
const { getIO, emitOrderNew, emitOrderStatusUpdated } = require('../socket');

/**
 * Strict state machine for kitchen order lifecycle
 */
const VALID_TRANSITIONS = {
  Received: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Served', 'Cancelled'],
  Served: [],     // Terminal state
  Cancelled: [],  // Terminal state
};

/**
 * Fetch orders with flexible view filters
 */
const getOrders = async ({ view, status, orderType, limit = 50 }) => {
  const query = {};

  if (view === 'active') {
    query.status = { $in: ['Received', 'Preparing', 'Ready'] };
  } else if (view === 'history' || view === 'completed') {
    query.status = { $in: ['Served', 'Cancelled'] };
  } else if (status) {
    query.status = status;
  }

  if (orderType) {
    query.orderType = orderType;
  }

  // Active orders: sort by receivedAt ascending (oldest/most urgent first)
  // History orders: sort by updatedAt descending (most recently served first)
  const sortDirection = (view === 'history' || view === 'completed') ? -1 : 1;
  const sortField = (view === 'history' || view === 'completed') ? 'updatedAt' : 'receivedAt';

  const orders = await Order.find(query)
    .sort({ [sortField]: sortDirection })
    .limit(limit);

  return orders;
};

/**
 * Get single order by orderId or MongoDB ObjectId
 */
const getOrderById = async (identifier) => {
  let order = await Order.findOne({ orderId: identifier }).select('-__v');
  if (!order && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    order = await Order.findById(identifier).select('-__v');
  }

  if (!order) {
    throw new AppError(`Order not found with identifier: ${identifier}`, 404);
  }

  return order;
};

/**
 * Advance an order's status with server-side validation and state machine checks
 */
const updateOrderStatus = async (identifier, nextStatus, role = 'kitchen', note = '') => {
  const order = await getOrderById(identifier);
  const currentStatus = order.status;

  // Check if target status is identical
  if (currentStatus === nextStatus) {
    return order;
  }

  // Validate allowed transitions
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed transitions: ${
        allowed.length > 0 ? allowed.join(', ') : 'None (Terminal status)'
      }`,
      400,
      {
        currentStatus,
        attemptedStatus: nextStatus,
        allowedTransitions: allowed,
      }
    );
  }

  // Update timestamps corresponding to new status
  const now = new Date();
  order.status = nextStatus;

  if (nextStatus === 'Preparing') {
    order.preparingAt = now;
  } else if (nextStatus === 'Ready') {
    order.readyAt = now;
  } else if (nextStatus === 'Served') {
    order.servedAt = now;
  } else if (nextStatus === 'Cancelled') {
    order.cancelledAt = now;
  }

  // Record audit history
  order.statusHistory.push({
    status: nextStatus,
    changedAt: now,
    changedByRole: role,
    note: note || `Status transitioned to ${nextStatus} by ${role}`,
  });

  const updatedOrder = await order.save();

  // Broadcast real-time update via Socket.IO strictly AFTER persistence
  try {
    emitOrderStatusUpdated(updatedOrder, { nextStatus, role, note });
  } catch (socketErr) {
    // Non-fatal if socket is not initialized in testing environments
  }

  return updatedOrder;
};

/**
 * Create a new order with complete server-side price validation,
 * availability checks, and status isolation.
 */
const createOrder = async (orderData) => {
  // 1. Validate Order Type & Table Number
  const orderType = orderData.orderType || 'Dine-in';
  if (!['Dine-in', 'Takeaway'].includes(orderType)) {
    throw new AppError(
      `Invalid order type: "${orderType}". Allowed types: Dine-in, Takeaway`,
      400
    );
  }

  let tableNumber = '';
  if (orderType === 'Dine-in') {
    const rawTable = orderData.tableNumber;
    if (!rawTable || typeof rawTable !== 'string' || rawTable.trim().length === 0) {
      throw new AppError('Table number is required for Dine-in orders', 400);
    }
    tableNumber = rawTable.trim();
  } else {
    tableNumber = orderData.tableNumber ? String(orderData.tableNumber).trim() : 'Takeaway';
  }

  // 2. Validate Items Array
  const rawItems = orderData.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError('An order must contain at least one item', 400);
  }

  // 3. Process every item: validate ID, fetch current menu price from MongoDB, check availability and variants
  const validatedItems = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    if (!item || typeof item !== 'object') {
      throw new AppError(`Item at index ${i} must be a valid object`, 400);
    }

    // Resolve MenuItem ObjectId
    const rawId = item.menuItem || item.menuItemId || item.itemId || item._id || item.id;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      throw new AppError(
        `Invalid or malformed menu item ID: "${rawId}" at item index ${i}`,
        400
      );
    }

    // Fetch canonical MenuItem from MongoDB
    const menuItem = await MenuItem.findById(rawId);
    if (!menuItem) {
      throw new AppError(`Menu item not found with ID: "${rawId}"`, 404);
    }

    // Reject unavailable / sold-out items
    if (menuItem.isAvailable === false) {
      throw new AppError(
        `Menu item "${menuItem.name}" is currently unavailable or sold out`,
        400
      );
    }

    // Validate Quantity
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw new AppError(
        `Invalid quantity for item "${menuItem.name}". Quantity must be an integer >= 1`,
        400
      );
    }

    // Validate Variant & extract canonical MongoDB price
    const requestedVariant = (
      item.variant ||
      item.variantName ||
      item.variantKey ||
      item.variantLabel ||
      'standard'
    )
      .toString()
      .trim()
      .toLowerCase();

    let matchedVariant = null;

    if (Array.isArray(menuItem.variants) && menuItem.variants.length > 0) {
      // Find variant by name, slug key, or ID
      matchedVariant = menuItem.variants.find((v) => {
        const vName = (v.name || '').toLowerCase().trim();
        return (
          vName === requestedVariant ||
          `${vName} plate` === requestedVariant ||
          (v._id && v._id.toString() === item.variant)
        );
      });

      // If requested 'standard' or no variant specified and single variant exists, use it
      if (!matchedVariant && (requestedVariant === 'standard' || requestedVariant === '')) {
        matchedVariant = menuItem.variants.find((v) => v.isDefault) || menuItem.variants[0];
      }

      if (!matchedVariant) {
        const availableNames = menuItem.variants.map((v) => v.name).join(', ');
        throw new AppError(
          `Invalid variant "${item.variant || requestedVariant}" for menu item "${menuItem.name}". Available variants: ${availableNames}`,
          400
        );
      }
    } else {
      // Single price fallback if item has no variants array
      matchedVariant = {
        name: 'Standard',
        price: menuItem.price || menuItem.basePrice || 0,
        portion: menuItem.portionNote || '',
      };
    }

    // Guaranteed canonical price directly from MongoDB (ignoring any client-sent unitPrice)
    const canonicalUnitPrice = matchedVariant.price;
    const canonicalVariantName = matchedVariant.name;
    const canonicalPortion = matchedVariant.portion || '';

    validatedItems.push({
      menuItem: menuItem._id,
      itemId: menuItem._id.toString(),
      name: menuItem.name,
      variant: canonicalVariantName,
      variantKey: canonicalVariantName.toLowerCase(),
      variantLabel: `${canonicalVariantName} Plate`,
      portion: canonicalPortion,
      unitPrice: canonicalUnitPrice, // Immutable snapshot price
      quantity: qty,
      isVeg: menuItem.isVeg,
      notes: typeof item.notes === 'string' ? item.notes.trim() : '',
    });
  }

  // 4. Calculate Billing on the Server (Client totals are strictly ignored)
  const subtotal = validatedItems.reduce(
    (acc, it) => acc + it.unitPrice * it.quantity,
    0
  );
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + taxAmount;

  // 5. Generate Unique Human-Readable Order Identifier
  let orderId;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    orderId = `KTC-${randomSuffix}`;
    const existing = await Order.findOne({ orderId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    orderId = `KTC-${Date.now().toString().slice(-4)}`;
  }

  // 6. Safe Order Creation (Forcing initial status to 'Received' to prevent arbitrary status injection)
  const newOrder = new Order({
    orderId,
    customer: orderData.customer && mongoose.Types.ObjectId.isValid(orderData.customer)
      ? orderData.customer
      : undefined,
    orderType,
    tableNumber,
    items: validatedItems,
    subtotal,
    taxAmount,
    grandTotal,
    status: 'Received', // Strictly forced initial status
    kitchenNotes: typeof orderData.kitchenNotes === 'string' ? orderData.kitchenNotes.trim() : '',
    receivedAt: new Date(),
    statusHistory: [
      {
        status: 'Received',
        changedAt: new Date(),
        changedByRole: 'customer',
        note: `Order placed via digital menu (${orderType}: ${tableNumber})`,
      },
    ],
  });

  const savedOrder = await newOrder.save();

  // 7. Broadcast real-time ticket to kitchen and table strictly AFTER persistence
  try {
    emitOrderNew(savedOrder);
  } catch (socketErr) {
    // Non-fatal if socket is uninitialized (e.g. In unit tests)
  }

  return savedOrder;
};

/**
 * Seed realistic initial orders if DB is empty or explicitly requested
 */
const seedDemoOrders = async () => {
  const existingCount = await Order.countDocuments();
  if (existingCount > 0) {
    return { count: existingCount, message: 'Database already contains orders' };
  }

  const now = Date.now();
  const demoOrders = [
    {
      orderId: 'KTC-1042',
      tableNumber: 'Table 04',
      orderType: 'Dine-in',
      status: 'Received',
      receivedAt: new Date(now - 3 * 60 * 1000), // 3 min ago (New)
      kitchenNotes: 'Make butter chicken medium spicy, extra butter on naan',
      items: [
        {
          itemId: 'item-1',
          name: 'Tandoori Chicken Tikka',
          variantKey: 'full',
          variantLabel: 'Full Plate',
          portion: '8 pcs',
          unitPrice: 380,
          quantity: 1,
          isVeg: false,
        },
        {
          itemId: 'item-13',
          name: 'Butter Garlic Naan',
          variantKey: 'standard',
          portion: '1 large piece',
          unitPrice: 65,
          quantity: 2,
          isVeg: true,
        },
      ],
      subtotal: 510,
      taxAmount: 26,
      grandTotal: 536,
    },
    {
      orderId: 'KTC-1041',
      tableNumber: 'Table 02',
      orderType: 'Dine-in',
      status: 'Preparing',
      receivedAt: new Date(now - 16 * 60 * 1000), // 16 min ago (Urgent!)
      preparingAt: new Date(now - 12 * 60 * 1000),
      kitchenNotes: 'Guest is in a hurry for cinema show at 4 PM',
      items: [
        {
          itemId: 'item-5',
          name: 'Paneer Butter Masala',
          variantKey: 'half',
          variantLabel: 'Half Plate',
          portion: 'Serves 1-2',
          unitPrice: 190,
          quantity: 1,
          isVeg: true,
        },
        {
          itemId: 'item-10',
          name: 'Hyderabadi Chicken Dum Biryani',
          variantKey: 'half',
          variantLabel: 'Half Plate',
          portion: 'Serves 1',
          unitPrice: 220,
          quantity: 1,
          isVeg: false,
        },
        {
          itemId: 'item-17',
          name: 'Royal Alphonso Mango Lassi',
          variantKey: 'standard',
          portion: '350ml glass',
          unitPrice: 110,
          quantity: 2,
          isVeg: true,
        },
      ],
      subtotal: 630,
      taxAmount: 32,
      grandTotal: 662,
    },
    {
      orderId: 'KTC-1039',
      tableNumber: 'Takeaway Counter',
      orderType: 'Takeaway',
      status: 'Ready',
      receivedAt: new Date(now - 19 * 60 * 1000), // 19 min ago
      preparingAt: new Date(now - 15 * 60 * 1000),
      readyAt: new Date(now - 2 * 60 * 1000),
      kitchenNotes: 'Pack extra paper napkins & disposable cutlery',
      items: [
        {
          itemId: 'item-7',
          name: 'Dal Makhani (Slow-Cooked 24hrs)',
          variantKey: 'full',
          variantLabel: 'Full Plate',
          portion: 'Serves 2-3',
          unitPrice: 280,
          quantity: 1,
          isVeg: true,
        },
        {
          itemId: 'item-14',
          name: 'Cheese & Chilli Stuffed Kulcha',
          variantKey: 'standard',
          portion: '1 full stuffed kulcha',
          unitPrice: 95,
          quantity: 2,
          isVeg: true,
        },
      ],
      subtotal: 470,
      taxAmount: 24,
      grandTotal: 494,
    },
    {
      orderId: 'KTC-1035',
      tableNumber: 'Table 08',
      orderType: 'Dine-in',
      status: 'Served',
      receivedAt: new Date(now - 45 * 60 * 1000),
      preparingAt: new Date(now - 40 * 60 * 1000),
      readyAt: new Date(now - 28 * 60 * 1000),
      servedAt: new Date(now - 25 * 60 * 1000),
      kitchenNotes: '',
      items: [
        {
          itemId: 'item-2',
          name: 'Crispy Chilli Paneer Dry',
          variantKey: 'half',
          variantLabel: 'Half Plate',
          portion: 'Small',
          unitPrice: 180,
          quantity: 1,
          isVeg: true,
        },
      ],
      subtotal: 180,
      taxAmount: 9,
      grandTotal: 189,
    },
  ];

  await Order.insertMany(demoOrders);
  return { count: demoOrders.length, message: 'Seeded demo orders successfully' };
};

module.exports = {
  VALID_TRANSITIONS,
  getOrders,
  getOrderById,
  updateOrderStatus,
  createOrder,
  seedDemoOrders,
};
