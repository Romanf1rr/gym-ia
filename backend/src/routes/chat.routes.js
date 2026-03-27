const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { checkChatLimit } = require('../middleware/usageLimits.middleware');
const schemas = require('../validators/schemas');

router.use(authMiddleware);

// Enviar mensaje (con límite de uso)
router.post('/', checkChatLimit, validate(schemas.chat), chatController.sendMessage);

// Obtener historial
router.get('/history', chatController.getChatHistory);

// Limpiar historial
router.delete('/history', chatController.clearHistory);

module.exports = router;
