const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutrition.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { checkNutritionLimit } = require('../middleware/usageLimits.middleware');
const schemas = require('../validators/schemas');

router.use(authMiddleware);

// Generar plan nutricional con IA (con límite de uso)
router.post('/generate', checkNutritionLimit, validate(schemas.generateNutrition), nutritionController.generateNutritionPlan);

// Obtener plan activo
router.get('/active', nutritionController.getActivePlan);

// Registrar comida
router.post('/log', validate(schemas.logMeal), nutritionController.logMeal);

// Comidas de hoy
router.get('/today', nutritionController.getTodayMeals);

// Historial de registros agrupados por día
router.get('/history', nutritionController.getHistory);

module.exports = router;
