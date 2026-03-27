const prisma = require('../utils/prisma');
const aiService = require('../services/ai/openai.service');
const exerciseDBService = require('../services/exercisedb.service');

// Generar rutina con IA
const generateRoutine = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Obtener perfil físico y objetivo del usuario
    const [perfilFisico, objetivo] = await Promise.all([
      prisma.perfilFisico.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.objetivo.findFirst({ where: { userId, activo: true }, orderBy: { createdAt: 'desc' } }),
    ]);

    if (!objetivo) {
      return res.status(400).json({
        message: 'Necesitás configurar tu objetivo antes de generar una rutina',
      });
    }

    // Generar rutina con GPT-4o
    const rutinaIA = await aiService.generateRoutine(perfilFisico || {}, objetivo);

    // Enriquecer ejercicios con ExerciseDB (gifUrl + músculos)
    const rutinaEnriquecida = await exerciseDBService.enrichRoutine(rutinaIA);

    // Desactivar rutina anterior si existe
    await prisma.rutina.updateMany({
      where: { userId, activa: true },
      data: { activa: false },
    });

    // Guardar en BD
    const rutina = await prisma.rutina.create({
      data: {
        userId,
        nombre: rutinaEnriquecida.nombre,
        descripcion: rutinaEnriquecida.descripcion || null,
        diasSemana: rutinaEnriquecida.diasSemana,
        duracionSemanas: rutinaEnriquecida.duracionSemanas,
        nivelDificultad: objetivo.nivelExperiencia,
        ejercicios: rutinaEnriquecida.ejercicios,
        generadaPorIA: true,
        activa: true,
      },
    });

    res.status(201).json(rutina);
  } catch (error) {
    console.error('Error generando rutina:', error);
    res.status(500).json({ message: 'Error al generar rutina con IA' });
  }
};

// Obtener rutina activa del usuario
const getActiveRoutine = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rutina = await prisma.rutina.findFirst({
      where: { userId, activa: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!rutina) {
      return res.status(404).json({ message: 'No tenés una rutina activa' });
    }

    res.json(rutina);
  } catch (error) {
    console.error('Error obteniendo rutina activa:', error);
    res.status(500).json({ message: 'Error al obtener rutina' });
  }
};

// Obtener todas las rutinas del usuario
const getRoutines = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rutinas = await prisma.rutina.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        diasSemana: true,
        duracionSemanas: true,
        nivelDificultad: true,
        generadaPorIA: true,
        activa: true,
        createdAt: true,
      },
    });

    res.json(rutinas);
  } catch (error) {
    console.error('Error obteniendo rutinas:', error);
    res.status(500).json({ message: 'Error al obtener rutinas' });
  }
};

// Obtener detalle de una rutina
const getRoutineById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const rutina = await prisma.rutina.findFirst({
      where: { id, userId },
    });

    if (!rutina) {
      return res.status(404).json({ message: 'Rutina no encontrada' });
    }

    res.json(rutina);
  } catch (error) {
    console.error('Error obteniendo rutina:', error);
    res.status(500).json({ message: 'Error al obtener rutina' });
  }
};

// Registrar entrenamiento completado
const logWorkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rutinaId, ejercicios, duracion, notas } = req.body;

    const entrenamiento = await prisma.entrenamiento.create({
      data: {
        userId,
        rutinaId,
        ejercicios,
        duracion: duracion || null,
        notas: notas || null,
        completado: true,
      },
    });

    res.status(201).json(entrenamiento);
  } catch (error) {
    console.error('Error registrando entrenamiento:', error);
    res.status(500).json({ message: 'Error al registrar entrenamiento' });
  }
};

module.exports = {
  generateRoutine,
  getActiveRoutine,
  getRoutines,
  getRoutineById,
  logWorkout,
};
