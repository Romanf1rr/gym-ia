const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routine.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { checkRoutineLimit } = require('../middleware/usageLimits.middleware');
const schemas = require('../validators/schemas');

router.use(authMiddleware);

// Generar rutina con IA (con límite de uso)
router.post('/generate', checkRoutineLimit, routineController.generateRoutine);

// Obtener rutina activa
router.get('/active', routineController.getActiveRoutine);

// Obtener todas las rutinas
router.get('/', routineController.getRoutines);

// Obtener rutina por ID
router.get('/:id', routineController.getRoutineById);

// Registrar entrenamiento completado
router.post('/workout/log', validate(schemas.logWorkout), routineController.logWorkout);

module.exports = router;
