const mongoose = require('mongoose');

/**
 * Sub-schema for items in an order.
 * Stores an immutable snapshot of item name, selected variant, unit price and quantity
 * so future changes to menu items or prices never corrupt historical order receipts.
 */
const OrderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: false, // Optional reference to original menu document
    },
    itemId: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Item name snapshot is required'],
      trim: true,
    },
    variant: {
      type: String,
      required: [true, 'Selected variant snapshot is required (e.g., Half, Full, Standard)'],
      trim: true,
      default: function () {
        return this.variantLabel || this.variantKey || 'Standard';
      },
    },
    variantKey: {
      type: String,
      trim: true,
    },
    variantLabel: {
      type: String,
      trim: true,
    },
    portion: {
      type: String,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price snapshot is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: item line total
OrderItemSchema.virtual('subtotal').get(function () {
  return this.unitPrice * this.quantity;
});

/**
 * Sub-schema for tracking removed or cancelled items
 */
const CancelledItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    variant: { type: String, default: 'Standard' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    cancelledAt: { type: Date, default: Date.now },
    reason: { type: String, default: 'Customer requested removal' },
  },
  { _id: false }
);

/**
 * Sub-schema for audit logs of status transitions
 */
const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Received', 'Preparing', 'Ready', 'Served', 'Cancelled'],
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedByRole: {
      type: String,
      default: 'kitchen',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order identifier is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest dine-in or anonymous walk-ins
      index: true,
    },
    orderType: {
      type: String,
      required: [true, 'Order type is required'],
      enum: {
        values: ['Dine-in', 'Takeaway'],
        message: '{VALUE} is not a valid order type (Dine-in, Takeaway)',
      },
      default: 'Dine-in',
      index: true,
    },
    tableNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          // Table number is required when orderType is 'Dine-in'
          if (this.orderType === 'Dine-in') {
            return typeof val === 'string' && val.trim().length > 0;
          }
          return true;
        },
        message: 'Table number is required for Dine-in orders',
      },
      default: function () {
        return this.orderType === 'Takeaway' ? 'Takeaway' : '';
      },
    },
    status: {
      type: String,
      required: [true, 'Order status is required'],
      enum: {
        values: ['Received', 'Preparing', 'Ready', 'Served', 'Cancelled'],
        message: '{VALUE} is not a valid order status (Received, Preparing, Ready, Served, Cancelled)',
      },
      default: 'Received',
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'An order must contain at least one item',
      },
    },
    cancelledItems: {
      type: [CancelledItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: [true, 'Order subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    taxAmount: {
      type: Number,
      required: [true, 'Tax amount is required'],
      min: [0, 'Tax amount cannot be negative'],
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative'],
    },
    kitchenNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Kitchen notes cannot exceed 300 characters'],
      default: '',
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    preparingAt: {
      type: Date,
    },
    readyAt: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    estimatedTime: {
      type: String,
      default: '15-25 min',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for elapsed waiting time in seconds
OrderSchema.virtual('elapsedSeconds').get(function () {
  const referenceTime = this.servedAt || this.cancelledAt || new Date();
  const startTime = this.receivedAt || this.createdAt || new Date();
  return Math.max(0, Math.floor((referenceTime.getTime() - startTime.getTime()) / 1000));
});

// Compound indexes for kitchen display queries and performance
OrderSchema.index({ status: 1, receivedAt: 1 });
OrderSchema.index({ orderType: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
