const mongoose = require('mongoose');

/**
 * Sub-schema for price variants (e.g. Half Plate, Full Plate, Standard)
 */
const VariantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variant name is required (e.g., Half, Full, Standard)'],
      trim: true,
    },
    portion: {
      type: String,
      trim: true,
      default: '', // e.g. 'Serves 1-2', '4 pcs', '350ml'
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Price must be a positive number'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const MenuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters long'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.Mixed, // Supports ObjectId ref or category slug string for flexible integration
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    isVeg: {
      type: Boolean,
      default: true,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    variants: {
      type: [VariantSchema],
      required: [true, 'At least one price variant is required'],
      validate: {
        validator: function (variants) {
          return Array.isArray(variants) && variants.length >= 1;
        },
        message: 'A menu item must have at least one price variant (e.g. Half, Full, or Standard)',
      },
    },
    spiceLevel: {
      type: String,
      enum: {
        values: ['mild', 'medium', 'hot', null],
        message: '{VALUE} is not a valid spice level (mild, medium, hot)',
      },
      default: null,
    },
    isChefSpecial: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 4.5,
    },
    prepTime: {
      type: String,
      default: '15 min',
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual: minimum starting base price for listing views
MenuItemSchema.virtual('basePrice').get(function () {
  if (!this.variants || this.variants.length === 0) return 0;
  return Math.min(...this.variants.map((v) => v.price));
});

// Virtual: single display price (from default or first variant)
MenuItemSchema.virtual('price').get(function () {
  if (!this.variants || this.variants.length === 0) return 0;
  const defaultVariant = this.variants.find((v) => v.isDefault);
  return defaultVariant ? defaultVariant.price : this.variants[0].price;
});

// Virtual: boolean indicator whether item has multiple plate options
MenuItemSchema.virtual('hasMultipleVariants').get(function () {
  return Boolean(this.variants && this.variants.length > 1);
});

MenuItemSchema.virtual('hasVariants').get(function () {
  return Boolean(this.variants && this.variants.length > 1);
});

// Virtual: variantsMap for component access like item.variants.half
MenuItemSchema.virtual('variantsMap').get(function () {
  if (!this.variants) return {};
  const map = {};
  this.variants.forEach((v) => {
    const key = (v.name || '').toLowerCase().trim();
    map[key] = {
      id: v._id ? v._id.toString() : key,
      name: v.name,
      label: `${v.name} Plate`,
      portion: v.portion || '',
      price: v.price,
      isDefault: v.isDefault,
    };
  });
  return map;
});

// Compound indexes for optimal menu queries and filtering
MenuItemSchema.index({ category: 1, isAvailable: 1 });
MenuItemSchema.index({ isAvailable: 1, isBestseller: -1 });
MenuItemSchema.index({ isAvailable: 1, isVeg: 1 });

// Full text search index across dish name and description
MenuItemSchema.index(
  { name: 'text', description: 'text' },
  { weights: { name: 5, description: 1 } }
);

module.exports = mongoose.model('MenuItem', MenuItemSchema);
