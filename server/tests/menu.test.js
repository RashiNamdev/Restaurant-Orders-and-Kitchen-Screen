const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { Category, MenuItem } = require('../src/models');

describe('Menu & Category APIs - Validation, Authorization & Sanitization', () => {
  let testCategory;
  let testMenuItem;

  beforeAll(async () => {
    await connectDB();
    // Clean test collections
    await Category.deleteMany({ name: /^Test / });
    await MenuItem.deleteMany({ name: /^Test / });

    // Seed test category
    testCategory = await Category.create({
      name: 'Test Starters',
      slug: 'test-starters',
      icon: 'Flame',
      displayOrder: 1,
      isActive: true,
    });

    // Seed test item
    testMenuItem = await MenuItem.create({
      name: 'Test Paneer Tikka',
      category: testCategory._id,
      description: 'Test spiced cottage cheese skewers',
      isVeg: true,
      isAvailable: true,
      variants: [
        { name: 'Half', portion: '4 pcs', price: 180, isDefault: true },
        { name: 'Full', portion: '8 pcs', price: 320, isDefault: false },
      ],
    });
  });

  afterAll(async () => {
    await Category.deleteMany({ name: /^Test / });
    await MenuItem.deleteMany({ name: /^Test / });
    await disconnectDB();
  });

  describe('1. Role-Based Authorization for Admin Mutations', () => {
    it('should reject POST /api/menu/items with 401 when no auth role header is provided', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .send({
          name: 'Test Dish Unauthorized',
          category: testCategory._id,
          variants: [{ name: 'Standard', price: 100 }],
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it('should reject POST /api/menu/items with 403 when role is "customer"', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'customer')
        .send({
          name: 'Test Customer Item',
          category: testCategory._id,
          variants: [{ name: 'Standard', price: 150 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden: Role "customer" is not authorized/i);
    });

    it('should reject POST /api/menu/items with 403 when role is "kitchen"', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'kitchen')
        .send({
          name: 'Test Kitchen Item',
          category: testCategory._id,
          variants: [{ name: 'Standard', price: 150 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should reject POST /api/categories with 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Test Dessert Cat' });

      expect(res.status).toBe(401);
    });

    it('should reject DELETE /api/menu/items/:id with 403 when role is not admin', async () => {
      const res = await request(app)
        .delete(`/api/menu/items/${testMenuItem._id}`)
        .set('x-user-role', 'customer');

      expect(res.status).toBe(403);
    });
  });

  describe('2. Server-Side Input, Price and ID Validation', () => {
    it('should reject menu item creation when name is missing', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'admin')
        .send({
          category: testCategory._id,
          variants: [{ name: 'Standard', price: 100 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/name is required/i);
    });

    it('should reject negative variant prices with clear error response', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'admin')
        .send({
          name: 'Test Negative Price Dish',
          category: testCategory._id,
          variants: [
            { name: 'Half', price: 100 },
            { name: 'Full', price: -50 }, // Negative price
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/price cannot be negative/i);
    });

    it('should reject menu item with zero/empty variants array', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'admin')
        .send({
          name: 'Test No Variants Dish',
          category: testCategory._id,
          variants: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least one price variant/i);
    });

    it('should reject malformed category ID with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'admin')
        .send({
          name: 'Test Malformed Category Dish',
          category: 'invalid-non-hex-id-12345',
          variants: [{ name: 'Standard', price: 100 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/category/i);
    });

    it('should reject non-existent category reference with 400 Bad Request', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'admin')
        .send({
          name: 'Test Phantom Category Dish',
          category: nonExistentId,
          variants: [{ name: 'Standard', price: 100 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Category not found/i);
    });

    it('should reject malformed item ID on GET /api/menu/items/:id with 400 Bad Request', async () => {
      const res = await request(app).get('/api/menu/items/not-a-valid-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid ID format/i);
    });
  });

  describe('3. Admin Operations: Create, Update and Disable Categories & Menu Items', () => {
    let createdCategory;
    let createdMenuItem;

    it('should allow admin to create a new category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('x-user-role', 'admin')
        .send({
          name: 'Test Biryani Corner',
          icon: 'Sparkles',
          displayOrder: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Biryani Corner');
      expect(res.body.data.slug).toBe('test-biryani-corner');
      createdCategory = res.body.data;
    });

    it('should allow admin to update a category', async () => {
      const res = await request(app)
        .put(`/api/categories/${createdCategory._id}`)
        .set('x-user-role', 'admin')
        .send({
          description: 'Updated aromatic dum biryanis and claypot rice',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated aromatic dum biryanis and claypot rice');
    });

    it('should allow admin to disable a category (isActive: false)', async () => {
      const res = await request(app)
        .patch(`/api/categories/${createdCategory._id}/disable`)
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should allow admin to create a menu item with Half and Full variants', async () => {
      const res = await request(app)
        .post('/api/menu/items')
        .set('x-user-role', 'admin')
        .send({
          name: 'Test Chicken Malai Tikka',
          category: testCategory._id,
          description: 'Creamy marinated chicken charred in clay oven',
          isVeg: false,
          isAvailable: true,
          spiceLevel: 'mild',
          variants: [
            { name: 'Half', portion: '4 pcs', price: 220, isDefault: true },
            { name: 'Full', portion: '8 pcs', price: 390, isDefault: false },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Chicken Malai Tikka');
      expect(res.body.data.variants).toHaveLength(2);
      createdMenuItem = res.body.data;
    });

    it('should allow admin to update menu item details', async () => {
      const res = await request(app)
        .put(`/api/menu/items/${createdMenuItem._id}`)
        .set('x-user-role', 'admin')
        .send({
          description: 'Updated with rich cashew cream and cardamom',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated with rich cashew cream and cardamom');
    });

    it('should allow kitchen to toggle menu item availability', async () => {
      const res = await request(app)
        .patch(`/api/menu/items/${createdMenuItem._id}/availability`)
        .set('x-user-role', 'kitchen')
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(false);
    });

    it('should allow admin to disable menu item', async () => {
      const res = await request(app)
        .patch(`/api/menu/items/${createdMenuItem._id}/disable`)
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(false);
    });
  });

  describe('4. Public Menu API & Field Sanitization', () => {
    it('should return public menu with categories and items without exposing __v', async () => {
      const res = await request(app).get('/api/menu');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('categories');
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.categories)).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);

      // Verify internal __v field is not exposed
      res.body.data.items.forEach((item) => {
        expect(item.__v).toBeUndefined();
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('variants');
        expect(item).toHaveProperty('category');
      });

      res.body.data.categories.forEach((cat) => {
        expect(cat.__v).toBeUndefined();
      });
    });

    it('should filter public menu by category query parameter', async () => {
      const res = await request(app).get(`/api/menu?category=${testCategory.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      const match = res.body.data.items.find((i) => i.name === 'Test Paneer Tikka');
      expect(match).toBeDefined();
    });

    it('should filter public menu by dietary flag (isVeg)', async () => {
      const res = await request(app).get('/api/menu?isVeg=true');

      expect(res.status).toBe(200);
      res.body.data.items.forEach((i) => {
        expect(i.isVeg).toBe(true);
      });
    });
  });
});
