const prisma = require('../utils/prisma');
const aiService = require('../services/ai/openai.service');

// Generar plan nutricional con IA
const generateNutritionPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('[Nutrition] Generando plan para usuario:', userId);
    const { restricciones, horaEntrenamiento, horaPrimerAlimento } = req.body;

    const [perfilFisico, objetivo, rutinaActiva] = await Promise.all([
      prisma.perfilFisico.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.objetivo.findFirst({ where: { userId, activo: true }, orderBy: { createdAt: 'desc' } }),
      prisma.rutina.findFirst({ where: { userId, activa: true }, select: { nombre: true } }),
    ]);

    if (!objetivo) {
      return res.status(400).json({
        message: 'Necesitás configurar tu objetivo antes de generar un plan nutricional',
      });
    }

    const extras = {
      restricciones: restricciones || null,
      horaEntrenamiento: horaEntrenamiento || null,
      horaPrimerAlimento: horaPrimerAlimento || null,
      tipoRutina: rutinaActiva?.nombre || null,
    };

    const t0 = Date.now();
    const planIA = await aiService.generateNutritionPlan(perfilFisico || {}, objetivo, extras);
    console.log(`[Nutrition] OpenAI respondió en ${Date.now() - t0}ms`);

    // Desactivar plan anterior
    await prisma.planNutricional.updateMany({
      where: { userId, activo: true },
      data: { activo: false },
    });

    const plan = await prisma.planNutricional.create({
      data: {
        userId,
        nombre: planIA.nombre || 'Plan nutricional personalizado',
        caloriasDiarias: parseInt(planIA.caloriasDiarias) || 2000,
        proteinas: parseInt(planIA.proteinas) || 0,
        carbohidratos: parseInt(planIA.carbohidratos) || 0,
        grasas: parseInt(planIA.grasas) || 0,
        comidas: planIA.comidas || [],
        restricciones: restricciones || null,
        generadoPorIA: true,
        activo: true,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error generando plan nutricional:', error);
    res.status(500).json({ message: 'Error al generar plan nutricional con IA' });
  }
};

// Obtener plan nutricional activo
const getActivePlan = async (req, res) => {
  try {
    const userId = req.user.userId;

    const plan = await prisma.planNutricional.findFirst({
      where: { userId, activo: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      return res.status(404).json({ message: 'No tenés un plan nutricional activo' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error obteniendo plan nutricional:', error);
    res.status(500).json({ message: 'Error al obtener plan nutricional' });
  }
};

// Registrar comida del día
const logMeal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      planNutricionalId,
      tipoComida,
      alimentos,
      caloriasTotal,
      proteinasTotal,
      carbohidratosTotal,
      grasasTotal,
      notas,
    } = req.body;

    const registro = await prisma.registroComida.create({
      data: {
        userId,
        planNutricionalId: planNutricionalId || null,
        tipoComida,
        alimentos,
        caloriasTotal,
        proteinasTotal,
        carbohidratosTotal,
        grasasTotal,
        notas: notas || null,
      },
    });

    res.status(201).json(registro);
  } catch (error) {
    console.error('Error registrando comida:', error);
    res.status(500).json({ message: 'Error al registrar comida' });
  }
};

// Obtener registros de comida del día
const getTodayMeals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const registros = await prisma.registroComida.findMany({
      where: {
        userId,
        fecha: { gte: hoy, lt: manana },
      },
      orderBy: { fecha: 'asc' },
    });

    const totales = registros.reduce(
      (acc, r) => ({
        calorias: acc.calorias + r.caloriasTotal,
        proteinas: acc.proteinas + r.proteinasTotal,
        carbohidratos: acc.carbohidratos + r.carbohidratosTotal,
        grasas: acc.grasas + r.grasasTotal,
      }),
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
    );

    res.json({ registros, totales });
  } catch (error) {
    console.error('Error obteniendo comidas de hoy:', error);
    res.status(500).json({ message: 'Error al obtener comidas' });
  }
};

// Historial de registros agrupados por día (últimos N días)
const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const days = Math.min(parseInt(req.query.days) || 7, 30);

    const desde = new Date();
    desde.setDate(desde.getDate() - (days - 1));
    desde.setHours(0, 0, 0, 0);

    const registros = await prisma.registroComida.findMany({
      where: { userId, fecha: { gte: desde } },
      orderBy: { fecha: 'desc' },
    });

    // Agrupar por fecha (YYYY-MM-DD)
    const byDate = {};
    registros.forEach((r) => {
      const key = r.fecha.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { fecha: key, registros: [], totales: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 } };
      byDate[key].registros.push(r);
      byDate[key].totales.calorias += r.caloriasTotal;
      byDate[key].totales.proteinas += r.proteinasTotal;
      byDate[key].totales.carbohidratos += r.carbohidratosTotal;
      byDate[key].totales.grasas += r.grasasTotal;
    });

    res.json(Object.values(byDate).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  } catch (error) {
    console.error('Error obteniendo historial nutricional:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};

module.exports = {
  generateNutritionPlan,
  getActivePlan,
  logMeal,
  getTodayMeals,
  getHistory,
};
