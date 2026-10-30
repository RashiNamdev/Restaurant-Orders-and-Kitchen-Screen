const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { MenuItem, Category, Order } = require('../src/models');

describe('Customer Order Placement API (POST /api/orders)', () => {
  let availableItem;
  let unavailableItem;
  let testCategory;

  beforeAll(async () => {
    await connectDB();
    // Clean test records
    await Category.deleteMany({ name: /^TestOrder / });
    await MenuItem.deleteMany({ name: /^TestOrder / });
    await Order.deleteMany({ orderId: /^KTC-TEST/ });

    testCategory = await Category.create({
      name: 'TestOrder Category',
      slug: 'testorder-category',
      icon: 'Flame',
    });

    // Available item with two variants: Half (150) and Full (280)
    availableItem = await MenuItem.create({
      name: 'TestOrder Paneer Tikka',
      category: testCategory._id,
      isAvailable: true,
      variants: [
        { name: 'Half', portion: '4 pcs', price: 150, isDefault: true },
        { name: 'Full', portion: '8 pcs', price: 280, isDefault: false },
      ],
    });

    // Unavailable / Sold out item
    unavailableItem = await MenuItem.create({
      name: 'TestOrder SoldOut Biryani',
      category: testCategory._id,
      isAvailable: false,
      variants: [{ name: 'Standard', portion: '1 plate', price: 250, isDefault: true }],
    });
  });

  afterAll(async () => {
    await Category.deleteMany({ name: /^TestOrder / });
    await MenuItem.deleteMany({ name: /^TestOrder / });
    await Order.deleteMany({ orderId: /^KTC-TEST/ });
    await disconnectDB();
  });

  describe('1. Valid Orders Placement', () => {
    it('should create a valid Dine-in order with table number and return 201 with tracking ID', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 12',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              quantity: 2,
              notes: 'Make it crispy',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('orderId');
      expect(res.body.data.orderType).toBe('Dine-in');
      expect(res.body.data.tableNumber).toBe('Table 12');
      expect(res.body.data.status).toBe('Received');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('TestOrder Paneer Tikka');
      expect(res.body.data.items[0].variant).toBe('Half');
      expect(res.body.data.items[0].unitPrice).toBe(150);
      expect(res.body.data.items[0].quantity).toBe(2);
      // Subtotal = 150 * 2 = 300, Tax = 5% of 300 = 15, GrandTotal = 315
      expect(res.body.data.subtotal).toBe(300);
      expect(res.body.data.taxAmount).toBe(15);
      expect(res.body.data.grandTotal).toBe(315);
    });

    it('should create a valid Takeaway order without requiring a table number', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Takeaway',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Full',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderType).toBe('Takeaway');
      expect(res.body.data.subtotal).toBe(280);
      expect(res.body.data.taxAmount).toBe(14); // 5% of 280
      expect(res.body.data.grandTotal).toBe(294);
    });
  });

  describe('2. Server Pricing Calculation & Tamper Resistance', () => {
    it('should ignore client-supplied unitPrice, subtotal, and grandTotal, calculating all prices strictly from MongoDB', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 05',
          // Client attempts to manipulate price to ₹1!
          subtotal: 1,
          taxAmount: 0,
          grandTotal: 1,
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              unitPrice: 1, // Tampered client price
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Unit price must be 150 from MongoDB, NOT 1
      expect(res.body.data.items[0].unitPrice).toBe(150);
      expect(res.body.data.subtotal).toBe(300);
      expect(res.body.data.taxAmount).toBe(15);
      expect(res.body.data.grandTotal).toBe(315);
    });
  });

  describe('3. Validation of Table Number for Dine-in', () => {
    it('should reject Dine-in order with 400 Bad Request when tableNumber is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: '',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/table number is required/i);
    });
  });

  describe('4. Validation of Quantities', () => {
    it('should reject order with quantity 0', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 01',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              quantity: 0,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/quantity must be an integer >= 1/i);
    });

    it('should reject order with negative quantity', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 01',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              quantity: -3,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/quantity must be an integer >= 1/i);
    });

    it('should reject order with non-integer/fractional quantity', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 01',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              quantity: 1.5,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/quantity must be an integer >= 1/i);
    });
  });

  describe('5. Validation of Unavailable or Invalid Items & Variants', () => {
    it('should reject order when an item is marked unavailable/sold-out', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 08',
          items: [
            {
              menuItem: unavailableItem._id.toString(),
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/currently unavailable or sold out/i);
    });

    it('should reject order with malformed item ID', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Takeaway',
          items: [
            {
              menuItem: 'malformed-not-an-objectid',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or malformed menu item id/i);
    });

    it('should reject order with non-existent item ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Takeaway',
          items: [
            {
              menuItem: fakeId.toString(),
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/menu item not found/i);
    });

    it('should reject order with invalid variant that does not exist on the item', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 03',
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Family Jumbo', // Invalid variant
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid variant/i);
    });
  });

  describe('6. Prevention of Arbitrary Order Status Injection', () => {
    it('should always enforce initial status to "Received" even if client sends "Served"', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Dine-in',
          tableNumber: 'Table 07',
          status: 'Served', // Client attempts to mark order as already served!
          items: [
            {
              menuItem: availableItem._id.toString(),
              variant: 'Half',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('Received'); // Must be Received!
    });
  });
});
