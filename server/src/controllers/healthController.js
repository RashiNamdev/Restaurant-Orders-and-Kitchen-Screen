const healthService = require('../services/healthService');
const { successResponse } = require('../utils/apiResponse');

const getHealth = (req, res, next) => {
  try {
    const healthData = healthService.checkHealth();
    return successResponse(res, healthData, 'Server is running smoothly', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
