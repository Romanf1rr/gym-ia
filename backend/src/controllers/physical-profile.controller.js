const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPhysicalProfiles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profiles = await prisma.perfilFisico.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(profiles);
  } catch (error) {
    console.error('Error obteniendo perfiles físicos:', error);
    res.status(500).json({ 
      message: 'Error al obtener perfiles físicos',
      error: error.message 
    });
  }
};

const createPhysicalProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      altura,
      peso,
      porcentajeGrasa,
      masaMuscular,
      brazo,
      pecho,
      cintura,
      cadera,
      muslo,
      notas
    } = req.body;

    if (!altura || !peso) {
      return res.status(400).json({ 
        message: 'Altura y peso son requeridos' 
      });
    }

    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);

    const profile = await prisma.perfilFisico.create({
      data: {
        userId,
        altura: parseFloat(altura),
        peso: parseFloat(peso),
        imc: parseFloat(imc.toFixed(2)),
        porcentajeGrasa: porcentajeGrasa ? parseFloat(porcentajeGrasa) : null,
        masaMuscular: masaMuscular ? parseFloat(masaMuscular) : null,
        circunferenciaBrazo: brazo ? parseFloat(brazo) : null,
        circunferenciaPecho: pecho ? parseFloat(pecho) : null,
        circunferenciaCintura: cintura ? parseFloat(cintura) : null,
        circunferenciaCadera: cadera ? parseFloat(cadera) : null,
        circunferenciaMuslo: muslo ? parseFloat(muslo) : null,
        notas: notas || null,
      },
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creando perfil físico:', error);
    res.status(500).json({ 
      message: 'Error al crear perfil físico',
      error: error.message 
    });
  }
};

const getLatestProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await prisma.perfilFisico.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!profile) {
      return res.status(404).json({ 
        message: 'No se encontró ningún perfil físico' 
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error obteniendo último perfil:', error);
    res.status(500).json({ 
      message: 'Error al obtener último perfil',
      error: error.message 
    });
  }
};

module.exports = {
  getPhysicalProfiles,
  createPhysicalProfile,
  getLatestProfile
};