const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware que verifica que el usuario sea admin
const adminOnly = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso restringido a administradores' });
  }
  next();
};

router.use(authMiddleware, adminOnly);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id/plan', adminController.updateUserPlan);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/photos', adminController.getPhotos);
router.delete('/photos/:id', adminController.deletePhoto);

module.exports = router;
