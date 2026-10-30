const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = require('../config/env');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Order = require('../models/Order');

const demoUsers = [
  {
    name: 'Restaurant Admin',
    email: 'admin@restaurant.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91 98765 43210',
  },
  {
    name: 'Head Chef',
    email: 'kitchen@restaurant.com',
    password: 'kitchen123',
    role: 'kitchen',
    phone: '+91 98765 43211',
  },
  {
    name: 'Sample Customer',
    email: 'customer@restaurant.com',
    password: 'customer123',
    role: 'customer',
    phone: '+91 98765 43212',
  },
];

const demoCategories = [
  {
    name: 'Starters',
    description: 'Crispy, flavorful appetizers and tandoori bites',
    displayOrder: 1,
    isActive: true,
  },
  {
    name: 'Main Course',
    description: 'Rich curries, paneer delicacies, and signature gravies',
    displayOrder: 2,
    isActive: true,
  },
  {
    name: 'Breads & Rice',
    description: 'Tandoori naans, rotis, and aromatic biryanis',
    displayOrder: 3,
    isActive: true,
  },
  {
    name: 'Desserts',
    description: 'Traditional sweets and cold artisan treats',
    displayOrder: 4,
    isActive: true,
  },
  {
    name: 'Beverages',
    description: 'Refreshing coolers, lassis, and freshly brewed teas',
    displayOrder: 5,
    isActive: true,
  },
];

const runSeed = async () => {
  console.log('========================================================');
  console.log('🌱 Starting Restaurant System Database Seeding');
  console.log(`🔌 Connecting to: ${config.mongoUri}`);
  console.log('========================================================\n');

  try {
    await mongoose.connect(config.mongoUri);
    console.log(' Connected to MongoDB.');

    // 1. Clear existing collections
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log(' Cleared Category, MenuItem, User, and Order collections.\n');

    // 2. Seed Users (pre-save hook hashes password with bcrypt)
    console.log('👤 Seeding Demo Users...');
    const createdUsers = [];
    for (const u of demoUsers) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log(` Seeded ${createdUsers.length} users with secure bcrypt hashes.\n`);

    // 3. Seed Categories
    console.log('📁 Seeding Categories...');
    const categoryDocs = await Category.insertMany(demoCategories);
    const categoryMap = {};
    categoryDocs.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });
    console.log(` Seeded ${categoryDocs.length} categories.\n`);

    // 4. Seed Menu Items
    console.log('🍽️  Seeding Menu Items with Variants...');
    const demoMenuItems = [
      {
        name: 'Paneer Tikka',
        description: 'Tender cottage cheese cubes marinated in spiced yogurt and grilled to perfection in a clay tandoor.',
        category: categoryMap['Starters'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        variants: [
          { name: 'Half', price: 180 },
          { name: 'Full', price: 320 },
        ],
      },
      {
        name: 'Crispy Corn Salt & Pepper',
        description: 'Golden fried sweet corn kernels tossed with fresh spring onions, cracked black pepper, and bell peppers.',
        category: categoryMap['Starters'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 12,
        variants: [
          { name: 'Full', price: 210 },
        ],
      },
      {
        name: 'Chicken Malai Tikka',
        description: 'Succulent boneless chicken chunks marinated in cream, cashew paste, and mild aromatic cardamom.',
        category: categoryMap['Starters'],
        isVeg: false,
        isAvailable: true,
        preparationTime: 18,
        variants: [
          { name: 'Half', price: 240 },
          { name: 'Full', price: 420 },
        ],
      },
      {
        name: 'Butter Chicken Masala',
        description: 'Smoked roasted chicken simmered in a velvety smooth tomato, butter, and cashew nut gravy.',
        category: categoryMap['Main Course'],
        isVeg: false,
        isAvailable: true,
        preparationTime: 20,
        variants: [
          { name: 'Half', price: 280 },
          { name: 'Full', price: 490 },
        ],
      },
      {
        name: 'Paneer Butter Masala',
        description: 'Fresh paneer cubes in a creamy and mildly sweet tomato gravy enriched with fresh butter.',
        category: categoryMap['Main Course'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        variants: [
          { name: 'Half', price: 220 },
          { name: 'Full', price: 380 },
        ],
      },
      {
        name: 'Dal Makhani',
        description: 'Whole black lentils slow-cooked overnight with churned butter and fresh cream on charcoal embers.',
        category: categoryMap['Main Course'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        variants: [
          { name: 'Half', price: 160 },
          { name: 'Full', price: 280 },
        ],
      },
      {
        name: 'Butter Garlic Naan',
        description: 'Refined flour flatbread infused with roasted minced garlic, coriander, and generously brushed with butter.',
        category: categoryMap['Breads & Rice'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 8,
        variants: [
          { name: 'Full', price: 65 },
        ],
      },
      {
        name: 'Hyderabadi Dum Biryani',
        description: 'Fragrant basmati rice layered with marinated vegetables, caramelized onions, mint, and saffron.',
        category: categoryMap['Breads & Rice'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 20,
        variants: [
          { name: 'Half', price: 190 },
          { name: 'Full', price: 340 },
        ],
      },
      {
        name: 'Gulab Jamun with Rabdi',
        description: 'Warm melt-in-mouth milk dumplings served over chilled thickened rabdi topped with roasted pistachios.',
        category: categoryMap['Desserts'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 5,
        variants: [
          { name: 'Full', price: 130 },
        ],
      },
      {
        name: 'Mango Lassi',
        description: 'Chilled creamy yogurt blended with Alphonso mango pulp and fragrant saffron strands.',
        category: categoryMap['Beverages'],
        isVeg: true,
        isAvailable: true,
        preparationTime: 5,
        variants: [
          { name: 'Full', price: 110 },
        ],
      },
    ];

    const menuDocs = await MenuItem.insertMany(demoMenuItems);
    console.log(` Seeded ${menuDocs.length} menu items with Half/Full price tiers.\n`);

    // 5. Seed Demo Orders for Kitchen Display & Admin Tracking
    console.log('🧾 Seeding Sample Orders for Kitchen Screen & Admin...');
    const paneer = menuDocs.find((m) => m.name === 'Paneer Butter Masala');
    const naan = menuDocs.find((m) => m.name === 'Butter Garlic Naan');
    const butterChicken = menuDocs.find((m) => m.name === 'Butter Chicken Masala');
    const biryani = menuDocs.find((m) => m.name === 'Hyderabadi Dum Biryani');

    const sampleOrders = [
      {
        orderId: 'ORD-101',
        orderType: 'Dine-in',
        tableNumber: 'Table 4',
        status: 'Preparing',
        customerName: 'Sarah Jenkins',
        customerPhone: '+91 98765 11111',
        kitchenNotes: 'Medium spice level, extra crispy naan',
        subtotal: 505,
        grandTotal: 505,
        items: [
          {
            itemId: String(paneer._id),
            name: paneer.name,
            variant: 'Half',
            unitPrice: 220,
            quantity: 1,
            lineTotal: 220,
          },
          {
            itemId: String(naan._id),
            name: naan.name,
            variant: 'Full',
            unitPrice: 65,
            quantity: 2,
            lineTotal: 130,
          },
          {
            itemId: String(biryani._id),
            name: biryani.name,
            variant: 'Half',
            unitPrice: 190,
            quantity: 1,
            lineTotal: 190,
          },
        ],
      },
      {
        orderId: 'ORD-102',
        orderType: 'Dine-in',
        tableNumber: 'Table 2',
        status: 'Received',
        customerName: 'Michael Brown',
        customerPhone: '+91 98765 22222',
        kitchenNotes: 'Please serve quickly',
        subtotal: 490,
        grandTotal: 490,
        items: [
          {
            itemId: String(butterChicken._id),
            name: butterChicken.name,
            variant: 'Full',
            unitPrice: 490,
            quantity: 1,
            lineTotal: 490,
          },
        ],
      },
      {
        orderId: 'ORD-103',
        orderType: 'Takeaway',
        tableNumber: 'Takeaway',
        status: 'Ready',
        customerName: 'David Wilson',
        customerPhone: '+91 98765 33333',
        kitchenNotes: 'Pack plastic cutlery and napkins',
        subtotal: 380,
        grandTotal: 380,
        items: [
          {
            itemId: String(paneer._id),
            name: paneer.name,
            variant: 'Full',
            unitPrice: 380,
            quantity: 1,
            lineTotal: 380,
          },
        ],
      },
      {
        orderId: 'ORD-104',
        orderType: 'Dine-in',
        tableNumber: 'Table 7',
        status: 'Served',
        customerName: 'Emily Clarke',
        customerPhone: '+91 98765 44444',
        kitchenNotes: 'Completed dine-in order',
        subtotal: 410,
        grandTotal: 410,
        items: [
          {
            itemId: String(biryani._id),
            name: biryani.name,
            variant: 'Half',
            unitPrice: 190,
            quantity: 1,
            lineTotal: 190,
          },
          {
            itemId: String(paneer._id),
            name: paneer.name,
            variant: 'Half',
            unitPrice: 220,
            quantity: 1,
            lineTotal: 220,
          },
        ],
      },
    ];

    for (const ord of sampleOrders) {
      await Order.create(ord);
    }
    console.log(` Seeded ${sampleOrders.length} sample active kitchen orders.\n`);

    console.log('========================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
    console.log('Demo Logins for Testing:');
    console.log('• Admin:    admin@restaurant.com    / Password: admin123');
    console.log('• Kitchen:  kitchen@restaurant.com  / Password: kitchen123');
    console.log('• Customer: customer@restaurant.com / Password: customer123');
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runSeed();
