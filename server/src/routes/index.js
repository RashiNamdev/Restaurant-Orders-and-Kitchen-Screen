const express = require('express');
const healthRoutes = require('./healthRoutes');
const orderRoutes = require('./orderRoutes');
const categoryRoutes = require('./categoryRoutes');
const menuRoutes = require('./menuRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

// Mount sub-routers
router.use('/health', healthRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu', menuRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
