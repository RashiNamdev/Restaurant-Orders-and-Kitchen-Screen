const { connectDB, disconnectDB } = require('../src/config/db');
const { Category, MenuItem, User, Order } = require('../src/models');

describe('Mongoose Schemas Validation & Integrity Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test documents
    await Category.deleteMany({ slug: /^test-/ });
    await MenuItem.deleteMany({ name: /^Test Dish/ });
    await User.deleteMany({ email: /@schematest\.com$/ });
    await Order.deleteMany({ orderId: /^SCHEMA-TEST-/ });
    await disconnectDB();
  });

  describe('1. Category Schema', () => {
    it('should create a valid Category and auto-generate slug and timestamps', async () => {
      const category = await Category.create({
        name: 'Test Appetizers & Starters',
        description: 'Mouth-watering starter dishes',
        icon: 'Flame',
      });

      expect(category._id).toBeDefined();
      expect(category.name).toBe('Test Appetizers & Starters');
      expect(category.slug).toBe('test-appetizers-starters');
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject a Category without a name', async () => {
      await expect(Category.create({})).rejects.toThrow();
    });
  });

  describe('2. MenuItem Schema', () => {
    it('should create a MenuItem with multiple price variants (Half & Full)', async () => {
      const item = await MenuItem.create({
        name: 'Test Dish Paneer Tikka',
        category: 'starters',
        isAvailable: true,
        isVeg: true,
        variants: [
          { name: 'Half Plate', portion: '4 pcs', price: 180, isDefault: true },
          { name: 'Full Plate', portion: '8 pcs', price: 320, isDefault: false },
        ],
      });

      expect(item._id).toBeDefined();
      expect(item.name).toBe('Test Dish Paneer Tikka');
      expect(item.isAvailable).toBe(true);
      expect(item.variants).toHaveLength(2);
      expect(item.basePrice).toBe(180);
      expect(item.hasMultipleVariants).toBe(true);
      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject a MenuItem with zero variants', async () => {
      await expect(
        MenuItem.create({
          name: 'Test Dish No Variants',
          category: 'starters',
          variants: [],
        })
      ).rejects.toThrow(/must have at least one price variant/);
    });

    it('should reject negative variant prices', async () => {
      await expect(
        MenuItem.create({
          name: 'Test Dish Negative Price',
          category: 'starters',
          variants: [{ name: 'Standard', price: -50 }],
        })
      ).rejects.toThrow();
    });
  });

  describe('3. User Schema & Password Security', () => {
    it('should create a User, NEVER store plaintext password, and verify hash comparison', async () => {
      const rawPassword = 'SecretPassword123!';
      const user = await User.create({
        name: 'Test Chef',
        email: 'chef@schematest.com',
        password: rawPassword,
        role: 'kitchen',
      });

      expect(user._id).toBeDefined();
      expect(user.role).toBe('kitchen');
      // Password must be hashed with bcrypt, NEVER plaintext!
      expect(user.password).not.toBe(rawPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // Bcrypt hash signature

      // comparePassword method check
      const isMatch = await user.comparePassword(rawPassword);
      expect(isMatch).toBe(true);

      const isWrongMatch = await user.comparePassword('WrongPassword');
      expect(isWrongMatch).toBe(false);

      // JSON output should not include password
      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should support roles: customer, kitchen, admin and reject invalid roles', async () => {
      const customer = await User.create({
        name: 'Customer One',
        email: 'cust1@schematest.com',
        password: 'Password123',
        role: 'customer',
      });
      expect(customer.role).toBe('customer');

      const admin = await User.create({
        name: 'Admin One',
        email: 'admin1@schematest.com',
        password: 'Password123',
        role: 'admin',
      });
      expect(admin.role).toBe('admin');

      // Invalid role should throw validation error
      await expect(
        User.create({
          name: 'Invalid Role User',
          email: 'invalid@schematest.com',
          password: 'Password123',
          role: 'superhero',
        })
      ).rejects.toThrow(/is not a valid role/);
    });
  });

  describe('4. Order Schema', () => {
    it('should create a Dine-in Order with tableNumber, item snapshots, and timestamps', async () => {
      const order = await Order.create({
        orderId: 'SCHEMA-TEST-1001',
        orderType: 'Dine-in',
        tableNumber: 'Table 04',
        status: 'Received',
        items: [
          {
            name: 'Tandoori Chicken Tikka',
            variant: 'Full Plate',
            portion: '8 pcs',
            unitPrice: 380,
            quantity: 1,
            isVeg: false,
          },
          {
            name: 'Butter Naan',
            variant: 'Standard',
            unitPrice: 65,
            quantity: 2,
            isVeg: true,
          },
        ],
        subtotal: 510,
        taxAmount: 26,
        grandTotal: 536,
      });

      expect(order._id).toBeDefined();
      expect(order.orderId).toBe('SCHEMA-TEST-1001');
      expect(order.orderType).toBe('Dine-in');
      expect(order.tableNumber).toBe('Table 04');
      expect(order.status).toBe('Received');

      // Snapshot checks
      expect(order.items).toHaveLength(2);
      expect(order.items[0].name).toBe('Tandoori Chicken Tikka');
      expect(order.items[0].variant).toBe('Full Plate');
      expect(order.items[0].unitPrice).toBe(380);
      expect(order.items[0].quantity).toBe(1);
      expect(order.items[0].subtotal).toBe(380);

      expect(order.items[1].unitPrice).toBe(65);
      expect(order.items[1].quantity).toBe(2);
      expect(order.items[1].subtotal).toBe(130);

      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    it('should require tableNumber for Dine-in orders', async () => {
      await expect(
        Order.create({
          orderId: 'SCHEMA-TEST-1002',
          orderType: 'Dine-in',
          tableNumber: '', // Empty table on Dine-in
          items: [{ name: 'Rice', variant: 'Half', unitPrice: 100, quantity: 1 }],
          subtotal: 100,
          grandTotal: 105,
        })
      ).rejects.toThrow(/Table number is required for Dine-in orders/);
    });

    it('should allow Takeaway orders without requiring a table number', async () => {
      const takeawayOrder = await Order.create({
        orderId: 'SCHEMA-TEST-1003',
        orderType: 'Takeaway',
        items: [{ name: 'Biryani', variant: 'Full', unitPrice: 250, quantity: 1 }],
        subtotal: 250,
        grandTotal: 262,
      });

      expect(takeawayOrder.orderType).toBe('Takeaway');
      expect(takeawayOrder.tableNumber).toBe('Takeaway');
      expect(takeawayOrder.status).toBe('Received');
    });

    it('should validate allowed order statuses: Received, Preparing, Ready, Served', async () => {
      const statuses = ['Received', 'Preparing', 'Ready', 'Served'];

      for (let i = 0; i < statuses.length; i++) {
        const ord = await Order.create({
          orderId: `SCHEMA-TEST-STATUS-${i}`,
          orderType: 'Takeaway',
          status: statuses[i],
          items: [{ name: 'Dish', variant: 'Full', unitPrice: 100, quantity: 1 }],
          subtotal: 100,
          grandTotal: 105,
        });
        expect(ord.status).toBe(statuses[i]);
      }

      // Reject non-whitelisted status
      await expect(
        Order.create({
          orderId: 'SCHEMA-TEST-STATUS-BAD',
          orderType: 'Takeaway',
          status: 'DeliveringByDrone',
          items: [{ name: 'Dish', variant: 'Full', unitPrice: 100, quantity: 1 }],
          subtotal: 100,
          grandTotal: 105,
        })
      ).rejects.toThrow(/is not a valid order status/);
    });
  });
});
