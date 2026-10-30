const request = require('supertest');
const express = require('express');
const { validate } = require('../src/middlewares/validation');
const errorHandler = require('../src/middlewares/errorHandler');

describe('Request Validation Middleware Tests', () => {
  let testApp;

  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());

    const testSchema = {
      body: {
        tableNumber: { required: true, type: 'string' },
        orderType: { required: true, enum: ['Dine-in', 'Takeaway'] },
        items: { required: true, type: 'array', minLength: 1 },
      },
    };

    testApp.post('/test-validate', validate(testSchema), (req, res) => {
      res.status(200).json({ success: true, data: req.body });
    });

    testApp.use(errorHandler);
  });

  it('should pass with 200 OK when request body is valid', async () => {
    const validPayload = {
      tableNumber: 'Table 04',
      orderType: 'Dine-in',
      items: [{ name: 'Paneer Butter Masala', quantity: 1 }],
    };

    const res = await request(testApp).post('/test-validate').send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tableNumber).toBe('Table 04');
  });

  it('should reject with 400 Bad Request when required fields are missing', async () => {
    const invalidPayload = {
      tableNumber: '',
    };

    const res = await request(testApp).post('/test-validate').send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Request validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('should reject with 400 when enum value is invalid', async () => {
    const invalidEnumPayload = {
      tableNumber: 'Table 02',
      orderType: 'DeliveryUnknown',
      items: [{ name: 'Biryani' }],
    };

    const res = await request(testApp).post('/test-validate').send(invalidEnumPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details.some((d) => d.field === 'orderType')).toBe(true);
  });
});
