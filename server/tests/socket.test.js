const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { initSocket } = require('../src/socket');
const orderService = require('../src/services/orderService');
const { Order, MenuItem, Category } = require('../src/models');

describe('Socket.IO Real-Time Communication & Authorization Tests', () => {
  let httpServer;
  let serverPort;
  let serverUrl;
  let testCategory;
  let testMenuItem;
  let testActiveOrder;

  beforeAll(async () => {
    await connectDB();

    // Create dedicated HTTP server with Socket.IO for testing
    httpServer = http.createServer(app);
    initSocket(httpServer);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        serverPort = httpServer.address().port;
        serverUrl = `http://localhost:${serverPort}`;
        resolve();
      });
    });

    // Cleanup & seed test items
    await Category.deleteMany({ name: /^TestSocket / });
    await MenuItem.deleteMany({ name: /^TestSocket / });
    await Order.deleteMany({ orderId: /^SOCK-/ });

    testCategory = await Category.create({
      name: 'TestSocket Category',
      slug: 'testsocket-category',
      icon: 'Soup',
    });

    testMenuItem = await MenuItem.create({
      name: 'TestSocket Paneer Korma',
      category: testCategory._id,
      isAvailable: true,
      variants: [
        { name: 'Half', portion: '1 bowl', price: 180, isDefault: true },
        { name: 'Full', portion: '2 bowls', price: 320, isDefault: false },
      ],
    });

    // Create an active order in MongoDB
    testActiveOrder = await Order.create({
      orderId: 'SOCK-9001',
      orderType: 'Dine-in',
      tableNumber: 'Table 03',
      status: 'Received',
      items: [
        {
          menuItem: testMenuItem._id,
          name: 'TestSocket Paneer Korma',
          variant: 'Half',
          unitPrice: 180,
          quantity: 1,
        },
      ],
      subtotal: 180,
      taxAmount: 9,
      grandTotal: 189,
    });
  });

  afterAll(async () => {
    await Category.deleteMany({ name: /^TestSocket / });
    await MenuItem.deleteMany({ name: /^TestSocket / });
    await Order.deleteMany({ orderId: /^SOCK-/ });
    await disconnectDB();

    await new Promise((resolve) => {
      httpServer.close(resolve);
    });
  });

  describe('1. Socket Authentication & Role Authorization', () => {
    it('should allow kitchen client to connect and automatically join kitchen stream', (done) => {
      const clientSocket = Client(serverUrl, {
        auth: { role: 'kitchen' },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        done();
      });
    });

    it('should reject socket connection when an invalid role is provided', (done) => {
      const badSocket = Client(serverUrl, {
        auth: { role: 'hacker_role' },
        transports: ['websocket'],
      });

      badSocket.on('connect_error', (err) => {
        expect(err.message).toMatch(/Unauthorized socket connection/i);
        badSocket.disconnect();
        done();
      });
    });

    it('should deny unauthorized customer from joining kitchen room', (done) => {
      const customerSocket = Client(serverUrl, {
        auth: { role: 'customer' },
        transports: ['websocket'],
      });

      customerSocket.on('connect', () => {
        customerSocket.emit('join:kitchen');
      });

      customerSocket.on('error', (data) => {
        expect(data.message).toMatch(/Kitchen credentials required/i);
        customerSocket.disconnect();
        done();
      });
    });
  });

  describe('2. Active-Order Snapshot on Kitchen Connection', () => {
    it('should send active-order snapshot to kitchen client upon connection', (done) => {
      const kitchenSocket = Client(serverUrl, {
        auth: { role: 'kitchen' },
        transports: ['websocket'],
      });

      kitchenSocket.on('kitchen:active_snapshot', (payload) => {
        expect(payload).toHaveProperty('orders');
        expect(Array.isArray(payload.orders)).toBe(true);
        expect(payload.orders.length).toBeGreaterThanOrEqual(1);

        const found = payload.orders.find((o) => o.orderId === 'SOCK-9001');
        expect(found).toBeDefined();
        expect(found.status).toBe('Received');

        kitchenSocket.disconnect();
        done();
      });
    });
  });

  describe('3. Real-Time order:new Event Emission to Kitchen', () => {
    it('should emit order:new to kitchen clients when an order is saved in database', (done) => {
      const kitchenSocket = Client(serverUrl, {
        auth: { role: 'kitchen' },
        transports: ['websocket'],
      });

      kitchenSocket.on('connect', async () => {
        // Now create a new order through orderService
        await orderService.createOrder({
          orderType: 'Dine-in',
          tableNumber: 'Table 08',
          items: [
            {
              menuItem: testMenuItem._id.toString(),
              variant: 'Full',
              quantity: 1,
            },
          ],
        });
      });

      kitchenSocket.on('order:new', (newOrder) => {
        expect(newOrder).toHaveProperty('orderId');
        expect(newOrder.tableNumber).toBe('Table 08');
        expect(newOrder.status).toBe('Received');
        expect(newOrder.items[0].name).toBe('TestSocket Paneer Korma');
        expect(newOrder.items[0].variant).toBe('Full');
        expect(newOrder.grandTotal).toBe(336); // 320 + 5% tax (16) = 336

        kitchenSocket.disconnect();
        done();
      });
    });
  });

  describe('4. Real-Time order:statusUpdated Event to Kitchen & Specific Customer Room', () => {
    it('should emit order:statusUpdated to both kitchen and the customer order room, but not leak to unrelated rooms', (done) => {
      let kitchenReceived = false;
      let customerReceived = false;
      let unassociatedReceived = false;

      // 1. Kitchen Socket
      const kitchenSocket = Client(serverUrl, {
        auth: { role: 'kitchen' },
        transports: ['websocket'],
      });

      // 2. Customer Socket for this specific order
      const targetCustomerSocket = Client(serverUrl, {
        auth: { role: 'customer', orderId: testActiveOrder.orderId },
        transports: ['websocket'],
      });

      // 3. Unassociated Customer Socket at another table/order
      const unrelatedCustomerSocket = Client(serverUrl, {
        auth: { role: 'customer', orderId: 'SOCK-OTHER-9999' },
        transports: ['websocket'],
      });

      const checkComplete = () => {
        if (kitchenReceived && customerReceived) {
          expect(unassociatedReceived).toBe(false);
          kitchenSocket.disconnect();
          targetCustomerSocket.disconnect();
          unrelatedCustomerSocket.disconnect();
          done();
        }
      };

      // Set up listeners
      kitchenSocket.on('order:statusUpdated', (data) => {
        if (data.orderId === testActiveOrder.orderId && data.status === 'Preparing') {
          kitchenReceived = true;
          checkComplete();
        }
      });

      targetCustomerSocket.on('order:statusUpdated', (data) => {
        if (data.orderId === testActiveOrder.orderId && data.status === 'Preparing') {
          customerReceived = true;
          checkComplete();
        }
      });

      unrelatedCustomerSocket.on('order:statusUpdated', (data) => {
        if (data.orderId === testActiveOrder.orderId) {
          unassociatedReceived = true;
        }
      });

      // Connect all sockets, join respective rooms, and trigger status update
      targetCustomerSocket.on('connect', () => {
        targetCustomerSocket.emit('join:order', { orderId: testActiveOrder.orderId });
      });

      unrelatedCustomerSocket.on('connect', () => {
        unrelatedCustomerSocket.emit('join:order', { orderId: 'SOCK-OTHER-9999' });
      });

      kitchenSocket.on('connect', () => {
        setTimeout(async () => {
          // Advance order to Preparing
          await orderService.updateOrderStatus(testActiveOrder.orderId, 'Preparing', 'kitchen', 'Chef started grilling');
        }, 100);
      });
    });
  });
});
