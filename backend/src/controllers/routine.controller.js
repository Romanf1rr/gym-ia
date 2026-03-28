const prisma = require('../utils/prisma');
const aiService = require('../services/ai/openai.service');
const exerciseDBService = require('../services/exercisedb.service');

// Obtiene lista de ejercicios del cache agrupados por bodyPart (máx 40 por grupo)
const getEjerciciosParaPrompt = async () => {
  const GRUPOS = {
    chest:       'Pecho',
    back:        'Espalda',
    'upper arms':'Brazos (bíceps y tríceps)',
    shoulders:   'Hombros',
    'upper legs':'Piernas (cuádriceps, isquiotibiales, glúteos)',
    'lower legs':'Pantorrillas',
    waist:       'Abdomen y cintura',
    'lower arms':'Antebrazos',
    cardio:      'Cardio',
  };

  const ejercicios = await prisma.ejercicioCache.findMany({
    where: {
      gifUrl: { startsWith: 'https://' },
      bodyPart: { in: Object.keys(GRUPOS) },
    },
    select: { nombre: true, bodyPart: true },
    orderBy: { nombre: 'asc' },
  });

  const porGrupo = {};
  ejercicios.forEach(e => {
    if (!porGrupo[e.bodyPart]) porGrupo[e.bodyPart] = [];
    if (porGrupo[e.bodyPart].length < 40) porGrupo[e.bodyPart].push(e.nombre);
  });

  return Object.entries(GRUPOS)
    .filter(([bp]) => porGrupo[bp]?.length)
    .map(([bp, label]) => `${label}: ${porGrupo[bp].join(', ')}`)
    .join('\n');
};

// Generar rutina con IA
const generateRoutine = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Obtener perfil físico, objetivo y lista de ejercicios disponibles
    const [perfilFisico, objetivo, listaEjercicios] = await Promise.all([
      prisma.perfilFisico.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.objetivo.findFirst({ where: { userId, activo: true }, orderBy: { createdAt: 'desc' } }),
      getEjerciciosParaPrompt(),
    ]);

    if (!objetivo) {
      return res.status(400).json({
        message: 'Necesitás configurar tu objetivo antes de generar una rutina',
      });
    }

    // Extraer preferencias adicionales del body
    const { lugar, zonasPrioritarias, lesiones, duracionSesion } = req.body;
    const extras = { lugar, zonasPrioritarias, lesiones, duracionSesion, listaEjercicios };

    // Generar rutina con GPT-4o
    const rutinaIA = await aiService.generateRoutine(perfilFisico || {}, objetivo, extras);

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
    res.status(500).json({ message: error.message || 'Error al generar rutina con IA' });
  }
};

// Re-enriquece ejercicios con gifUrl null en background y actualiza la DB
const reEnrichMissingGifs = async (rutinaId, ejercicios) => {
  try {
    let changed = false;
    const diasActualizados = await Promise.all(
      ejercicios.map(async (dia) => {
        const ejerciciosActualizados = await Promise.all(
          dia.ejercicios.map(async (ejercicio) => {
            if (ejercicio.gifUrl) return ejercicio;
            const data = await exerciseDBService.enrichExercise(ejercicio.nombreEn || ejercicio.nombre);
            if (data?.gifUrl) {
              changed = true;
              return { ...ejercicio, gifUrl: data.gifUrl };
            }
            return ejercicio;
          })
        );
        return { ...dia, ejercicios: ejerciciosActualizados };
      })
    );
    if (changed) {
      await prisma.rutina.update({ where: { id: rutinaId }, data: { ejercicios: diasActualizados } });
      console.log(`[Rutina] Re-enriquecida rutina ${rutinaId}`);
    }
  } catch (e) {
    console.error('[Rutina] Error re-enriching:', e.message);
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

    // Re-enriquecer en background si hay ejercicios sin GIF
    const tieneNulos = rutina.ejercicios?.some(dia =>
      dia.ejercicios?.some(e => !e.gifUrl)
    );
    if (tieneNulos) {
      reEnrichMissingGifs(rutina.id, rutina.ejercicios);
    }
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

// Activar una rutina guardada
const activateRoutine = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const rutina = await prisma.rutina.findFirst({ where: { id, userId } });
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    await prisma.rutina.updateMany({ where: { userId, activa: true }, data: { activa: false } });
    const updated = await prisma.rutina.update({ where: { id }, data: { activa: true } });

    res.json(updated);
  } catch (error) {
    console.error('Error activando rutina:', error);
    res.status(500).json({ message: 'Error al activar rutina' });
  }
};

// Renombrar una rutina
const renameRoutine = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ message: 'El nombre es requerido' });

    const rutina = await prisma.rutina.findFirst({ where: { id, userId } });
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    const updated = await prisma.rutina.update({ where: { id }, data: { nombre: nombre.trim() } });
    res.json(updated);
  } catch (error) {
    console.error('Error renombrando rutina:', error);
    res.status(500).json({ message: 'Error al renombrar rutina' });
  }
};

// Eliminar una rutina
const deleteRoutine = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const rutina = await prisma.rutina.findFirst({ where: { id, userId } });
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    await prisma.rutina.delete({ where: { id } });
    res.json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error('Error eliminando rutina:', error);
    res.status(500).json({ message: 'Error al eliminar rutina' });
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
  activateRoutine,
  renameRoutine,
  deleteRoutine,
  logWorkout,
};
