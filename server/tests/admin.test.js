const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { Order, MenuItem, Category } = require('../src/models');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await Order.deleteMany({});
  await MenuItem.deleteMany({ name: /^Dal Makhani/ });
  await Category.deleteMany({ name: /^Curries/ });
  await disconnectDB();
});

beforeEach(async () => {
  await Order.deleteMany({});
});

describe('Admin Dashboard APIs & Role-Based Security', () => {
  describe('1. Role-Based Access Control on /api/admin', () => {
    it('should reject GET /api/admin/summary with 401 when no credentials are provided', async () => {
      const res = await request(app).get('/api/admin/summary');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Authentication required/i);
    });

    it('should reject GET /api/admin/summary with 403 when role is "customer"', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('x-user-role', 'customer');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should reject GET /api/admin/summary with 403 when role is "kitchen"', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('x-user-role', 'kitchen');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should permit GET /api/admin/summary when role is "admin"', async () => {
      const res = await request(app)
        .get('/api/admin/summary')
        .set('x-user-role', 'admin');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('todayOrdersCount');
      expect(res.body.data).toHaveProperty('todayRevenue');
      expect(res.body.data).toHaveProperty('pendingOrdersCount');
      expect(res.body.data).toHaveProperty('completedOrdersCount');
    });
  });

  describe('2. Today\'s Revenue & Metrics Calculation', () => {
    it('should correctly calculate today\'s revenue and order counts based on local date', async () => {
      // 1. Create orders placed today with various statuses
      await Order.create({
        orderId: 'KTC-ADM-001',
        orderNumber: 'KTC-001',
        orderType: 'Dine-in',
        tableNumber: 'Table 01',
        status: 'Served',
        subtotal: 500,
        taxAmount: 25,
        grandTotal: 525,
        totalAmount: 525,
        items: [{ name: 'Biryani', unitPrice: 500, quantity: 1 }],
      });

      await Order.create({
        orderId: 'KTC-ADM-002',
        orderNumber: 'KTC-002',
        orderType: 'Takeaway',
        status: 'Served',
        subtotal: 300,
        taxAmount: 15,
        grandTotal: 315,
        totalAmount: 315,
        items: [{ name: 'Naan', unitPrice: 150, quantity: 2 }],
      });

      await Order.create({
        orderId: 'KTC-ADM-003',
        orderNumber: 'KTC-003',
        orderType: 'Dine-in',
        tableNumber: 'Table 05',
        status: 'Preparing', // Pending
        subtotal: 200,
        taxAmount: 10,
        grandTotal: 210,
        totalAmount: 210,
        items: [{ name: 'Paneer Tikka', unitPrice: 200, quantity: 1 }],
      });

      await Order.create({
        orderId: 'KTC-ADM-004',
        orderNumber: 'KTC-004',
        orderType: 'Dine-in',
        tableNumber: 'Table 08',
        status: 'Cancelled',
        subtotal: 400,
        taxAmount: 20,
        grandTotal: 420,
        totalAmount: 420,
        items: [{ name: 'Kebab', unitPrice: 400, quantity: 1 }],
      });

      const res = await request(app)
        .get('/api/admin/summary')
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      const { data } = res.body;

      // 4 orders created today
      expect(data.todayOrdersCount).toBe(4);
      // 1 order pending (Preparing)
      expect(data.pendingOrdersCount).toBe(1);
      // 2 completed orders (Served)
      expect(data.completedOrdersCount).toBe(2);
      // 1 cancelled order
      expect(data.todayCancelledCount).toBe(1);
      // Today's revenue = 525 + 315 = 840
      expect(data.todayRevenue).toBe(840);
    });
  });

  describe('3. Searchable and Filterable Orders List for Admin', () => {
    beforeEach(async () => {
      await Order.create([
        {
          orderId: 'KTC-101',
          orderNumber: 'KTC-101',
          orderType: 'Dine-in',
          tableNumber: 'Table 10',
          status: 'Received',
          subtotal: 100,
          grandTotal: 100,
          totalAmount: 100,
          items: [{ name: 'Spring Rolls', unitPrice: 100, quantity: 1 }],
        },
        {
          orderId: 'KTC-102',
          orderNumber: 'KTC-102',
          orderType: 'Takeaway',
          status: 'Served',
          subtotal: 450,
          grandTotal: 450,
          totalAmount: 450,
          items: [{ name: 'Butter Chicken', unitPrice: 450, quantity: 1 }],
        },
      ]);
    });

    it('should filter orders by status', async () => {
      const res = await request(app)
        .get('/api/admin/orders?status=Received')
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBe(1);
      expect(res.body.data.orders[0].orderId).toBe('KTC-101');
    });

    it('should search orders by order ID or table number', async () => {
      const res = await request(app)
        .get('/api/admin/orders?search=Table 10')
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBe(1);
      expect(res.body.data.orders[0].tableNumber).toBe('Table 10');
    });

    it('should filter orders by orderType', async () => {
      const res = await request(app)
        .get('/api/admin/orders?orderType=Takeaway')
        .set('x-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBe(1);
      expect(res.body.data.orders[0].orderId).toBe('KTC-102');
    });
  });

  describe('4. Item Availability Enforcement on Order Creation', () => {
    it('should reject order if an item was toggled out of stock by admin', async () => {
      const cat = await Category.create({ name: 'Curries', slug: 'curries' });
      const item = await MenuItem.create({
        name: 'Dal Makhani',
        category: cat._id,
        isAvailable: true,
        variants: [{ name: 'Full', price: 260, portion: 'Full Plate' }],
      });

      // Admin toggles availability to false
      const toggleRes = await request(app)
        .patch(`/api/menu/items/${item._id}/availability`)
        .set('x-user-role', 'admin')
        .send({ isAvailable: false });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.data.isAvailable).toBe(false);

      // Customer attempts to order this unavailable item
      const orderRes = await request(app)
        .post('/api/orders')
        .send({
          orderType: 'Takeaway',
          items: [{ menuItem: item._id.toString(), variant: 'Full', quantity: 1 }],
        });

      expect(orderRes.status).toBe(400);
      expect(orderRes.body.success).toBe(false);
      expect(orderRes.body.message).toMatch(/unavailable or sold out/i);
    });
  });
});
