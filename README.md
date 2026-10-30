# 🍽️ Restaurant Orders & Real-Time Kitchen Display System (KDS)

A full-stack, contactless digital ordering platform and real-time Kitchen Display System (KDS) built with **React**, **Express.js**, **Socket.IO**, and **MongoDB (Mongoose)**. Designed with a mobile-first responsive interface for dine-in and takeaway customers, paired with a live synchronized kitchen dispatch console and management dashboard.

---

## 🌟 Key Highlights & Features

- **📱 Customer Digital Menu & Ordering (Mobile & Desktop)**
  - Dynamic category navigation (*Starters, Main Course, Breads & Rice, Desserts, Beverages*).
  - Multi-tier portion pricing (**Half Plate** vs. **Full Plate**).
  - Dietary filters (**Pure Veg / Non-Veg**) and instant keyword search.
  - Seamless support for **Dine-In** (with validated Table Numbers) and **Takeaway**.
  - Interactive slide-over cart drawer and sticky mobile bottom checkout bar.
  - Tamper-proof pricing: All calculations and snapshots are enforced server-side.

- **🍳 Real-Time Kitchen Display System (KDS)**
  - Bi-directional instant updates via **Socket.IO** (zero page refreshes needed).
  - Structured 4-stage kitchen order workflow: **Received ➔ Preparing ➔ Ready ➔ Served**.
  - Live sound alerts and visual notification tags on incoming orders.
  - Granular dish-level cancellation controls with customer order receipt syncing.

- **📍 Live Customer Order Tracking**
  - Real-time animated 4-stage visual progress tracker.
  - Isolated room subscriptions (`order:${orderId}`) for customer privacy.
  - Automatic reconnection recovery fetching the latest status if network drops.

- **📊 Protected Admin Management Dashboard**
  - Local-date business revenue calculations and daily total orders tally.
  - Pending vs. Completed order breakdown.
  - Searchable and filterable order history (by Status, Order ID, Table, and Type).
  - Live inventory stock toggling (**In Stock** / **Out of Stock**) with instant ordering restrictions.

- **🛡️ Enterprise Security & Validation**
  - **73 Automated Backend Tests** covering RBAC, status transitions, schema constraints, price tamper resistance, and socket events.
  - Bcrypt password hashing (passwords never stored in plaintext and excluded from JSON serializations).
  - Strict input sanitization and validation on all routes.

---

## 🔑 Demo Logins & Credentials

The database includes pre-configured demo users across all roles:

| Role | Email Address | Password | Permissions & Views |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@restaurant.com` | `admin123` | Full access: Metrics, Revenue, Menu Management, Orders Audit |
| **Kitchen** | `kitchen@restaurant.com` | `kitchen123` | Kitchen Screen: Advance status (Preparing, Ready, Served), Active Ticket Queue |
| **Customer** | `customer@restaurant.com` | `customer123` | Menu Ordering, Cart Checkout, Order Tracking |

---

## 🏗️ Architecture & Technology Stack

```
restaurantSystem/
├── client/                     # Frontend Application (React 19 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/         # Header, CartDrawer, Modals, Badges, Tracker
│   │   ├── context/            # Global Cart & Ordering State Context
│   │   ├── pages/              # MenuPage, KitchenDisplayPage, OrderTrackingPage, AdminDashboardPage
│   │   ├── services/           # Axios API Clients & Socket.IO Event Manager
│   └── .env.example            # Frontend environment variable template
│
├── server/                     # Backend API & WebSocket Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # MongoDB connection & environment settings
│   │   ├── controllers/        # Express route handlers
│   │   ├── middlewares/        # Role-based authorization & schema validators
│   │   ├── models/             # Mongoose schemas: Category, MenuItem, User, Order
│   │   ├── routes/             # REST API endpoints (/api/menu, /api/orders, /api/admin)
│   │   ├── scripts/            # Database seed script
│   │   ├── services/           # Core domain logic & price calculations
│   │   └── socket/             # Socket.IO room manager and emitter handlers
│   ├── tests/                  # Jest test suites (73 automated tests)
│   └── .env.example            # Server environment variable template
│
├── .env.example                # Root environment template
└── package.json                # Project root workspace shortcuts
```

---

## 🗄️ Data Model & Design Decisions

### 1. `Category`
Organizes the menu catalog into logical sections with slug generation and display sorting:
- `name` (String, required, unique)
- `slug` (String, indexed)
- `displayOrder` (Number, for custom menu sorting)
- `isActive` (Boolean)

### 2. `MenuItem`
Supports granular portion-based pricing:
- `name`, `description`, `category` (Ref to Category)
- `isVeg` (Boolean)
- `isAvailable` (Boolean, live stock toggle)
- `preparationTime` (Number in minutes)
- `variants` (Subdocument Array): e.g., `[{ name: 'Half', price: 180 }, { name: 'Full', price: 320 }]`

### 3. `Order`
Maintains financial and historical integrity via immutable snapshots:
- `orderId` (String, unique e.g., `ORD-101`)
- `orderType` (Enum: `Dine-in`, `Takeaway`)
- `tableNumber` (Required for Dine-in orders)
- `status` (Enum: `Received`, `Preparing`, `Ready`, `Served`, `Cancelled`)
- `items` (Subdocument Array storing immutable snapshots):
  - `name`, `variant`, `unitPrice`, `quantity`, `lineTotal`
- `subtotal` & `grandTotal` (Calculated strictly on the server from current database prices)
- `statusHistory` (Audit trail with timestamps and role identifiers)

### 4. `User`
- `name`, `email` (unique, lowercase), `role` (`customer`, `kitchen`, `admin`), `isActive`
- `password` (Hashed with `bcryptjs` via Mongoose `pre('save')` hook; hidden with `{ select: false }`)

### Key Design Decisions:
1. **Server-Side Price Authority**: The client never determines line totals or grand totals. When `POST /api/orders` is invoked, the backend fetches active menu items from MongoDB, matches the requested variant, computes all math, and rejects unavailable dishes.
2. **Event-Driven Room Isolation**: Instead of broadcasting private customer orders to everyone, Socket.IO isolates events into targeted rooms:
   - `kitchen-room`: Staff receiving `order:new` and active tickets.
   - `order:${orderId}`: Customers receiving real-time status transitions (`order:statusUpdated`).
3. **State Transition Guard**: The backend enforces the linear order lifecycle (`Received ➔ Preparing ➔ Ready ➔ Served`). Invalid state jumps (e.g., jumping from `Received` directly to `Served`) are rejected with `400 Bad Request`.

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** installed and running locally on port `27017` **OR** a cloud connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/RashiNamdev/Restaurant-Orders-and-Kitchen-Screen.git
cd Restaurant-Orders-and-Kitchen-Screen
```

---

### Step 2: Environment Configuration
Never commit `.env` files. Both the root and subfolders include `.env.example` templates.

1. **Backend Environment Setup**:
   Create `server/.env` based on `server/.env.example`:
   ```bash
   cp server/.env.example server/.env
   ```
   *Default `server/.env` content:*
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/restaurant_db
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000
   SOCKET_CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000
   ```

2. **Frontend Environment Setup**:
   Create `client/.env` based on `client/.env.example`:
   ```bash
   cp client/.env.example client/.env
   ```
   *Default `client/.env` content:*
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

---

### Step 3: Install Dependencies
You can install dependencies for both server and client with:
```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

---

### Step 4: Seed the Database
Populate categories, menu items with Half/Full price tiers, demo users, and initial kitchen orders:
```bash
cd server
npm run seed
```
*Output confirmation:*
```
 Connected to MongoDB.
 Cleared Category, MenuItem, User, and Order collections.
 Seeded 3 users with secure bcrypt hashes.
 Seeded 5 categories.
 Seeded 10 menu items with Half/Full price tiers.
 Seeded 4 sample active kitchen orders.
 DATABASE SEEDING COMPLETED SUCCESSFULLY!
```

---

### Step 5: Start the Application

Open two terminal windows (or tabs):

**Terminal 1 — Backend Server:**
```bash
cd server
npm start
```
*The Express & Socket.IO server starts at `http://localhost:5000`.*

**Terminal 2 — Frontend Application:**
```bash
cd client
npm run dev
```
*The React + Vite client opens at `http://localhost:5173` (or `http://localhost:5175`).*

Visit **`http://localhost:5175`** (or the port indicated by Vite) in your browser!

---

## 🧪 Automated Testing

The project includes an automated test suite with **73 passing unit and integration tests** built with **Jest** and **Supertest**.

To execute all test suites:
```bash
cd server
npm test
```

### Test Coverage Highlights:
- **`tests/schemas.test.js`**: Mongoose constraints, variant validations, negative price rejection, and bcrypt hashing.
- **`tests/orderPlacement.test.js`**: Server pricing calculation, tamper resistance, dine-in table requirements, quantity constraints, and out-of-stock validation.
- **`tests/orderStatus.test.js`**: State transition enforcement, illegal jump rejection, and role-based access control.
- **`tests/admin.test.js`**: Local-date daily revenue calculation, order search/filter queries, and item stock toggles.
- **`tests/socket.test.js`**: Real-time event delivery (`order:new`, `order:statusUpdated`), room targeting, and snapshot emissions.
- **`tests/menu.test.js` & `tests/validation.test.js`**: Input sanitation and category mutations.

---

## 📈 Status: What Is Finished & What's Next

### ✅ What Is Finished
- [x] Complete customer menu browsing with live search, veg/non-veg filters, and Half/Full variant selection.
- [x] Full customer cart slide-out with Dine-in (table number) and Takeaway checkout.
- [x] Server-side price authority preventing any client manipulation of prices.
- [x] Real-time Kitchen Display System (KDS) with audio alerts and linear status progression.
- [x] Customer order tracking page with 4-stage progress visualization and Socket.IO live sync.
- [x] Protected Admin Dashboard with daily revenue aggregation, order filtering, and live stock toggles.
- [x] Automated database seed script with realistic items and demo accounts.
- [x] 73 comprehensive automated backend tests passing at 100%.
- [x] Fully responsive layout tested on both mobile viewports and desktop screens.

### 🔮 What Would Be Done With More Time
- [ ] **Payment Gateway Integration**: Direct online payment flow via Stripe or Razorpay webhooks.
- [ ] **Thermal Receipt Printing**: ESC/POS driver integration for automatic kitchen slip and bill printing.
- [ ] **Multi-Outlet Support**: Multi-tenant database modeling for restaurant chains with different kitchen stations (e.g., Bar vs. Grill vs. Dessert station).
- [ ] **Customer SMS / WhatsApp Alerts**: Twilio or WhatsApp Business API integration when an order reaches `Ready` status.

---

## 🤖 AI Tools Disclosure

In accordance with project transparency guidelines, the following AI tools and workflows were utilized during development:
- **Google DeepMind Antigravity Pair-Programming Assistant**:
  - Assisted in designing the Mongoose schemas and strict validation constraints.
  - Formulated comprehensive Jest and Supertest test fixtures covering edge cases and tamper attacks.
  - Accelerated frontend styling and glassmorphism UI components using TailwindCSS.
  - Simulated real-time Socket.IO multi-client testing across virtual browser sessions.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
