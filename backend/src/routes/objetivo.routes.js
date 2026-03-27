const express = require('express');
const router = express.Router();
const { getActiveObjetivo, createObjetivo } = require('../controllers/objetivo.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);
router.get('/active', getActiveObjetivo);
router.post('/', createObjetivo);

module.exports = router;
