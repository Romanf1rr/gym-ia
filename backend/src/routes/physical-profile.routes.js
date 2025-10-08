const express = require('express');
const router = express.Router();
const physicalProfileController = require('../controllers/physical-profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los perfiles físicos del usuario
router.get('/', physicalProfileController.getPhysicalProfile);

// Obtener último perfil físico
router.get('/latest', physicalProfileController.getLatestProfile);

// Crear nuevo perfil físico
router.post('/', physicalProfileController.createPhysicalProfile);

module.exports = router;