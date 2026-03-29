const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../validators/schemas');
const { getUsageStatus } = require('../middleware/usageLimits.middleware');

router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, validate(schemas.updateProfile), userController.updateProfile);
router.post('/me/complete-onboarding', authMiddleware, userController.completeOnboarding);
router.post('/me/push-token', authMiddleware, userController.registerPushToken);
router.get('/usage', authMiddleware, getUsageStatus);

module.exports = router;
