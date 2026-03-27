const express = require('express');
const router = express.Router();
const physicalProfileController = require('../controllers/physical-profile.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../validators/schemas');

router.use(authMiddleware);

router.get('/', physicalProfileController.getPhysicalProfiles);
router.get('/latest', physicalProfileController.getLatestProfile);
router.post('/', validate(schemas.createPhysicalProfile), physicalProfileController.createPhysicalProfile);

module.exports = router;
