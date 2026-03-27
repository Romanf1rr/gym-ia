const prisma = require('../utils/prisma');

const getActiveObjetivo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const objetivo = await prisma.objetivo.findFirst({
      where: { userId, activo: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(objetivo || null);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener objetivo' });
  }
};

const createObjetivo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { objetivoPrincipal, nivelExperiencia, nivelActividad, diasSemana, pesoObjetivo, limitaciones, preferencias } = req.body;

    // Desactivar objetivo anterior
    await prisma.objetivo.updateMany({ where: { userId, activo: true }, data: { activo: false } });

    const objetivo = await prisma.objetivo.create({
      data: {
        userId,
        objetivoPrincipal,
        nivelExperiencia,
        nivelActividad,
        diasSemana: parseInt(diasSemana),
        pesoObjetivo: pesoObjetivo ? parseFloat(pesoObjetivo) : null,
        limitaciones: limitaciones || null,
        preferencias: preferencias || null,
        activo: true,
      },
    });
    res.status(201).json(objetivo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear objetivo' });
  }
};

module.exports = { getActiveObjetivo, createObjetivo };
