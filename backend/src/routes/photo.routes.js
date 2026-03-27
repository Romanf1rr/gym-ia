const express = require('express');
const router = express.Router();
const multer = require('multer');
const photoController = require('../controllers/photo.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkPhotoLimit } = require('../middleware/usageLimits.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
});

const uploadFields = upload.fields([
  { name: 'frente', maxCount: 1 },
  { name: 'lateral', maxCount: 1 },
  { name: 'espalda', maxCount: 1 },
]);

router.use(authMiddleware);

// Subir fotos + análisis IA (con límite de uso)
router.post('/upload', checkPhotoLimit, uploadFields, photoController.uploadPhotos);

// Historial de fotos
router.get('/', photoController.getPhotos);

// Detalle de una foto
router.get('/:id', photoController.getPhotoById);

module.exports = router;
