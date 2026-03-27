const prisma = require('../utils/prisma');

// Límites por plan
const LIMITS = {
  free: {
    rutinas: { cantidad: 1, dias: 15 },       // 1 rutina cada 15 días
    nutricion: { cantidad: 1, dias: 15 },      // 1 plan cada 15 días
    fotos: { cantidad: 1, dias: 30 },          // 1 análisis por mes
    chat: { cantidad: 20, dias: 7 },           // 20 mensajes por semana
  },
  premium: null, // sin límites
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Verifica límite de generación de rutinas
const checkRoutineLimit = async (req, res, next) => {
  try {
    const { userId, plan, rol } = req.user;
    if (plan === 'premium' || rol === 'admin') return next();

    const { cantidad, dias } = LIMITS.free.rutinas;

    const count = await prisma.rutina.count({
      where: {
        userId,
        generadaPorIA: true,
        createdAt: { gte: daysAgo(dias) },
      },
    });

    if (count >= cantidad) {
      return res.status(429).json({
        message: `Plan gratuito: solo podés generar ${cantidad} rutina cada ${dias} días.`,
        limite: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verifica límite de generación de planes nutricionales
const checkNutritionLimit = async (req, res, next) => {
  try {
    const { userId, plan, rol } = req.user;
    if (plan === 'premium' || rol === 'admin') return next();

    const { cantidad, dias } = LIMITS.free.nutricion;

    const count = await prisma.planNutricional.count({
      where: {
        userId,
        generadoPorIA: true,
        createdAt: { gte: daysAgo(dias) },
      },
    });

    if (count >= cantidad) {
      return res.status(429).json({
        message: `Plan gratuito: solo podés generar ${cantidad} plan nutricional cada ${dias} días.`,
        limite: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verifica límite de análisis de fotos
const checkPhotoLimit = async (req, res, next) => {
  try {
    const { userId, plan, rol } = req.user;
    if (plan === 'premium' || rol === 'admin') return next();

    const { cantidad, dias } = LIMITS.free.fotos;

    const count = await prisma.fotoProgreso.count({
      where: {
        userId,
        createdAt: { gte: daysAgo(dias) },
      },
    });

    if (count >= cantidad) {
      return res.status(429).json({
        message: `Plan gratuito: solo podés hacer ${cantidad} análisis de fotos por mes.`,
        limite: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verifica límite de mensajes de chat
const checkChatLimit = async (req, res, next) => {
  try {
    const { userId, plan, rol } = req.user;
    if (plan === 'premium' || rol === 'admin') return next();

    const { cantidad, dias } = LIMITS.free.chat;

    const count = await prisma.mensajeChat.count({
      where: {
        userId,
        rol: 'user',
        createdAt: { gte: daysAgo(dias) },
      },
    });

    if (count >= cantidad) {
      return res.status(429).json({
        message: `Plan gratuito: límite de ${cantidad} mensajes por semana alcanzado.`,
        limite: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Devuelve el uso actual del usuario (para mostrarlo en la app)
const getUsageStatus = async (req, res) => {
  try {
    const { userId, plan } = req.user;

    if (plan === 'premium') {
      return res.json({ plan: 'premium', limites: null });
    }

    const ahora = new Date();

    const [rutinas, nutricion, fotos, chat] = await Promise.all([
      prisma.rutina.count({ where: { userId, generadaPorIA: true, createdAt: { gte: daysAgo(15) } } }),
      prisma.planNutricional.count({ where: { userId, generadoPorIA: true, createdAt: { gte: daysAgo(15) } } }),
      prisma.fotoProgreso.count({ where: { userId, createdAt: { gte: daysAgo(30) } } }),
      prisma.mensajeChat.count({ where: { userId, rol: 'user', createdAt: { gte: daysAgo(7) } } }),
    ]);

    res.json({
      plan: 'free',
      limites: {
        rutinas:   { usado: rutinas,   maximo: LIMITS.free.rutinas.cantidad,   periodo: '15 días' },
        nutricion: { usado: nutricion, maximo: LIMITS.free.nutricion.cantidad,  periodo: '15 días' },
        fotos:     { usado: fotos,     maximo: LIMITS.free.fotos.cantidad,      periodo: '30 días' },
        chat:      { usado: chat,      maximo: LIMITS.free.chat.cantidad,       periodo: '7 días'  },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estado de uso' });
  }
};

module.exports = {
  checkRoutineLimit,
  checkNutritionLimit,
  checkPhotoLimit,
  checkChatLimit,
  getUsageStatus,
};
