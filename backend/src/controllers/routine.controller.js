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
    const { rutinaId, diaIndex, ejercicios, duracion, notas, fecha } = req.body;

    const entrenamiento = await prisma.entrenamiento.create({
      data: {
        userId,
        rutinaId,
        ejercicios,
        duracion: duracion || null,
        notas: notas || null,
        completado: true,
        // diaIndex y fecha se guardan dentro de ejercicios como metadata
      },
    });

    res.status(201).json(entrenamiento);
  } catch (error) {
    console.error('Error registrando entrenamiento:', error);
    res.status(500).json({ message: 'Error al registrar entrenamiento' });
  }
};

// Obtener historial de entrenamientos de una rutina
const getWorkoutHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rutinaId } = req.params;

    const entrenamientos = await prisma.entrenamiento.findMany({
      where: { userId, rutinaId, completado: true },
      orderBy: { fecha: 'desc' },
      take: 30,
    });

    res.json(entrenamientos);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};

// Obtener entrenamientos del mes actual (para el calendario)
const getWorkoutCalendar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;

    const inicio = new Date(parseInt(year), parseInt(month) - 1, 1);
    const fin = new Date(parseInt(year), parseInt(month), 1);

    const entrenamientos = await prisma.entrenamiento.findMany({
      where: {
        userId,
        completado: true,
        fecha: { gte: inicio, lt: fin },
      },
      select: { id: true, fecha: true, rutinaId: true, duracion: true, ejercicios: true },
      orderBy: { fecha: 'asc' },
    });

    // Agrupar por fecha (YYYY-MM-DD)
    const porFecha = {};
    entrenamientos.forEach(e => {
      const dia = e.fecha.toISOString().split('T')[0];
      if (!porFecha[dia]) porFecha[dia] = [];
      porFecha[dia].push(e);
    });

    res.json(porFecha);
  } catch (error) {
    console.error('Error obteniendo calendario:', error);
    res.status(500).json({ message: 'Error al obtener calendario' });
  }
};

// Estadísticas para el dashboard: racha, semana actual, próximo día
const getWorkoutStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const hoy = now.toISOString().split('T')[0];

    // Lunes de esta semana
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    // Últimos 60 días para racha
    const hace60 = new Date();
    hace60.setDate(hace60.getDate() - 60);
    hace60.setHours(0, 0, 0, 0);

    const [estaSemana, ultimos60, rutina, ultimoEntreno] = await Promise.all([
      prisma.entrenamiento.findMany({
        where: { userId, completado: true, fecha: { gte: monday, lt: nextMonday } },
        select: { id: true, fecha: true, duracion: true, ejercicios: true },
      }),
      prisma.entrenamiento.findMany({
        where: { userId, completado: true, fecha: { gte: hace60 } },
        select: { fecha: true },
        orderBy: { fecha: 'desc' },
      }),
      prisma.rutina.findFirst({
        where: { userId, activa: true },
        select: { id: true, nombre: true, ejercicios: true, diasSemana: true },
      }),
      prisma.entrenamiento.findFirst({
        where: { userId, completado: true },
        orderBy: { fecha: 'desc' },
        select: { ejercicios: true, fecha: true },
      }),
    ]);

    // Días únicos entrenados
    const diasEntrenados = [...new Set(
      ultimos60.map(e => e.fecha.toISOString().split('T')[0])
    )].sort().reverse();

    // Calcular racha
    let rachaActual = 0;
    const ayer = new Date(now);
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];
    const inicioRacha = diasEntrenados.includes(hoy) ? hoy
      : diasEntrenados.includes(ayerStr) ? ayerStr : null;

    if (inicioRacha) {
      const base = new Date(inicioRacha);
      for (let i = 0; i < diasEntrenados.length; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        if (diasEntrenados.includes(d.toISOString().split('T')[0])) rachaActual++;
        else break;
      }
    }

    // Días de la semana (Lun-Dom)
    const LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const diasSemana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      return { label: LABELS[i], entrenado: diasEntrenados.includes(ds), esHoy: ds === hoy };
    });

    // Próximo día de rutina
    let proximoDia = null;
    if (rutina?.ejercicios?.length) {
      const total = rutina.ejercicios.length;
      let lastDiaIndex = -1;
      if (ultimoEntreno?.ejercicios?.length) {
        const diaIndexes = ultimoEntreno.ejercicios.map(e => e.diaIndex).filter(d => d !== undefined);
        if (diaIndexes.length) lastDiaIndex = Math.max(...diaIndexes);
      }
      const nextIndex = lastDiaIndex >= 0 ? (lastDiaIndex + 1) % total : 0;
      const dia = rutina.ejercicios[nextIndex];
      proximoDia = {
        diaIndex: nextIndex,
        nombreDia: dia.nombreDia || `Día ${dia.dia}`,
        cantidadEjercicios: dia.ejercicios?.length || 0,
        musculos: [...new Set(dia.ejercicios?.flatMap(e => e.musculos || []).slice(0, 4))],
      };
    }

    const duracionSemana = estaSemana.reduce((acc, e) => acc + (e.duracion || 0), 0);

    res.json({
      rachaActual,
      entrenamientosEstaSemana: estaSemana.length,
      duracionSemana,
      diasSemana,
      proximoDia,
    });
  } catch (error) {
    console.error('Error en getWorkoutStats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
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
  getWorkoutHistory,
  getWorkoutCalendar,
  getWorkoutStats,
};
