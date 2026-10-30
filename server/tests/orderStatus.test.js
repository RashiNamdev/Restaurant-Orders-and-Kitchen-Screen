const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const Order = require('../src/models/Order');

describe('Order Status API & State Transition Enforcement Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Order.deleteMany({ orderId: /^TEST-/ });
    await disconnectDB();
  });

  let testOrder;

  beforeEach(async () => {
    // Create a fresh test order in 'Received' status
    testOrder = await Order.create({
      orderId: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: 'Table 03',
      orderType: 'Dine-in',
      status: 'Received',
      items: [
        {
          itemId: 'item-1',
          name: 'Tandoori Chicken Tikka',
          variantKey: 'half',
          variantLabel: 'Half Plate',
          portion: '4 pcs',
          unitPrice: 210,
          quantity: 1,
          isVeg: false,
        },
      ],
      subtotal: 210,
      taxAmount: 11,
      grandTotal: 221,
    });
  });

  afterEach(async () => {
    if (testOrder && testOrder._id) {
      await Order.findByIdAndDelete(testOrder._id);
    }
  });

  describe('Role-Based Access Control', () => {
    it('should reject status update with 401 when x-user-role header is missing', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .send({ status: 'Preparing' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing x-user-role header');
    });

    it('should reject status update with 403 when role is "customer"', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'customer')
        .send({ status: 'Preparing' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden: Role "customer" is not authorized');
    });

    it('should permit status update when role is "kitchen"', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Preparing' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Preparing');
    });
  });

  describe('Valid Order Status Transitions', () => {
    it('should advance order cleanly: Received -> Preparing -> Ready -> Served', async () => {
      // 1. Advance to Preparing
      const prepRes = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Preparing', note: 'Chef started tandoor' });

      expect(prepRes.status).toBe(200);
      expect(prepRes.body.data.status).toBe('Preparing');
      expect(prepRes.body.data.preparingAt).toBeDefined();

      // 2. Advance to Ready
      const readyRes = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Ready', note: 'Plated and ready for pickup' });

      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.status).toBe('Ready');
      expect(readyRes.body.data.readyAt).toBeDefined();

      // 3. Advance to Served
      const servedRes = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'staff')
        .send({ status: 'Served', note: 'Delivered to table 03' });

      expect(servedRes.status).toBe(200);
      expect(servedRes.body.data.status).toBe('Served');
      expect(servedRes.body.data.servedAt).toBeDefined();
    });
  });

  describe('Server-Side Transition Enforcement (Illegal Jumps)', () => {
    it('should reject invalid skip from Received -> Ready (must go through Preparing)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Ready' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid status transition');
      expect(res.body.details.allowedTransitions).toContain('Preparing');
    });

    it('should reject invalid skip from Received -> Served directly', async () => {
      const res = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Served' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid status transition');
    });

    it('should reject updates to a terminal "Served" order', async () => {
      // First advance to Served
      await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Preparing' });

      await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Ready' });

      await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'staff')
        .send({ status: 'Served' });

      // Now attempt to transition Served -> Preparing
      const invalidRes = await request(app)
        .patch(`/api/orders/${testOrder.orderId}/status`)
        .set('x-user-role', 'kitchen')
        .send({ status: 'Preparing' });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.success).toBe(false);
      expect(invalidRes.body.message).toContain('Terminal status');
    });
  });

  describe('View Filters: Active vs History', () => {
    it('should filter active orders (Received, Preparing, Ready)', async () => {
      const res = await request(app).get('/api/orders?view=active');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((ord) => {
        expect(['Received', 'Preparing', 'Ready']).toContain(ord.status);
      });
    });
  });
});
