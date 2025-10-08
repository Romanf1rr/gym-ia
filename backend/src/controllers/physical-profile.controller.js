const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener perfil físico del usuario
exports.getPhysicalProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profiles = await prisma.perfilFisico.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ profiles });
  } catch (error) {
    console.error('Error al obtener perfil físico:', error);
    res.status(500).json({ message: 'Error al obtener perfil físico' });
  }
};

// Obtener último perfil físico
exports.getLatestProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await prisma.perfilFisico.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!profile) {
      return res.status(404).json({ message: 'No se encontró perfil físico' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error al obtener perfil físico:', error);
    res.status(500).json({ message: 'Error al obtener perfil físico' });
  }
};

// Crear nuevo perfil físico
exports.createPhysicalProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      altura,
      peso,
      porcentajeGrasa,
      masaMuscular,
      circunferenciaBrazo,
      circunferenciaPecho,
      circunferenciaCintura,
      circunferenciaCadera,
      circunferenciaMuslo,
      notas
    } = req.body;

    // Calcular IMC
    const alturaEnMetros = altura / 100;
    const imc = peso / (alturaEnMetros * alturaEnMetros);

    const profile = await prisma.perfilFisico.create({
      data: {
        userId,
        altura,
        peso,
        imc: parseFloat(imc.toFixed(2)),
        porcentajeGrasa,
        masaMuscular,
        circunferenciaBrazo,
        circunferenciaPecho,
        circunferenciaCintura,
        circunferenciaCadera,
        circunferenciaMuslo,
        notas
      }
    });

    res.status(201).json({
      message: 'Perfil físico creado exitosamente',
      profile
    });
  } catch (error) {
    console.error('Error al crear perfil físico:', error);
    res.status(500).json({ message: 'Error al crear perfil físico' });
  }
};