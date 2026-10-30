const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint (server status, uptime, DB connection)
 * @access  Public
 */
router.get('/', healthController.getHealth);

module.exports = router;
