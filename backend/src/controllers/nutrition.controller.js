const prisma = require('../utils/prisma');
const aiService = require('../services/ai/openai.service');

// Generar plan nutricional con IA
const generateNutritionPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
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

    const planIA = await aiService.generateNutritionPlan(perfilFisico || {}, objetivo, extras);

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

module.exports = {
  generateNutritionPlan,
  getActivePlan,
  logMeal,
  getTodayMeals,
};
