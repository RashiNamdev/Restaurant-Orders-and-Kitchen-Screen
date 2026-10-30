const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Health & Server Initialization Tests', () => {
  beforeAll(async () => {
    // Connect to database before running tests
    await connectDB();
  });

  afterAll(async () => {
    // Close database connection after tests complete
    await disconnectDB();
  });

  describe('GET /', () => {
    it('should return welcome message and health endpoint URL', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.health).toBe('/api/health');
      expect(res.body.message).toContain('Restaurant Orders');
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 OK with healthy status and connected MongoDB state', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { status, database, service, uptimeSeconds, timestamp } = res.body.data;

      expect(status).toBe('healthy');
      expect(service).toBe('Restaurant Orders & Kitchen Display Backend');
      expect(typeof uptimeSeconds).toBe('number');
      expect(timestamp).toBeDefined();

      // Database health verification
      expect(database.status).toBe('connected');
      expect(database.healthy).toBe(true);
      expect(database.host).toBeDefined();
      expect(database.name).toBe('restaurant_db');
    });
  });

  describe('404 Handling for undefined routes', () => {
    it('should return 404 with structured JSON error', async () => {
      const res = await request(app).get('/api/unknown-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Endpoint not found');
    });
  });
});
