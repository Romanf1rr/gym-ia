const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/retos.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

router.use(authMiddleware);

// Cliente
router.get('/', ctrl.listarRetos);
router.post('/:id/unirse', ctrl.unirse);
router.patch('/:id/progreso', ctrl.actualizarProgreso);
router.get('/:id/leaderboard', ctrl.leaderboard);

// Admin
router.post('/', adminMiddleware, ctrl.crearReto);
router.get('/admin/todos', adminMiddleware, ctrl.listarRetosAdmin);
router.patch('/:id/toggle', adminMiddleware, ctrl.toggleReto);

module.exports = router;
