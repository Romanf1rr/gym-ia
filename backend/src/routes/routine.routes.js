const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routine.controller');

const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { checkRoutineLimit } = require('../middleware/usageLimits.middleware');
const schemas = require('../validators/schemas');

// Proxy de GIF de ejercicio (sirve la imagen con la RapidAPI key)
// Endpoint: GET /image?exerciseId={id}&resolution=360
router.get('/gif/:exerciseId', async (req, res) => {
  const https = require('https');
  const { exerciseId } = req.params;
  const key = process.env.EXERCISEDB_API_KEY;
  if (!key) return res.status(503).send('ExerciseDB key not configured');

  const options = {
    method: 'GET',
    hostname: 'exercisedb.p.rapidapi.com',
    path: `/image?exerciseId=${exerciseId}&resolution=360`,
    headers: {
      'x-rapidapi-key': key,
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => res.status(502).send('Error fetching gif'));
  proxyReq.end();
});

router.use(authMiddleware);

// Generar rutina con IA (con límite de uso)
router.post('/generate', checkRoutineLimit, routineController.generateRoutine);

// Obtener rutina activa
router.get('/active', routineController.getActiveRoutine);

// Obtener todas las rutinas
router.get('/', routineController.getRoutines);

// Activar una rutina guardada
router.put('/:id/activate', routineController.activateRoutine);

// Renombrar una rutina
router.patch('/:id/rename', routineController.renameRoutine);

// Eliminar una rutina
router.delete('/:id', routineController.deleteRoutine);

// Obtener rutina por ID
router.get('/:id', routineController.getRoutineById);

// Registrar entrenamiento completado
router.post('/workout/log', routineController.logWorkout);

// Historial de entrenamientos de una rutina
router.get('/workout/history/:rutinaId', routineController.getWorkoutHistory);

// Calendario de entrenamientos del mes
router.get('/workout/calendar', routineController.getWorkoutCalendar);

// Estadísticas del dashboard
router.get('/workout/stats', routineController.getWorkoutStats);

module.exports = router;
