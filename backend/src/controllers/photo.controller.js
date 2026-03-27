const prisma = require('../utils/prisma');
const aiService = require('../services/ai/openai.service');
const storageService = require('../services/storage.service');

// Subir fotos de progreso y analizarlas con IA
const uploadPhotos = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { peso } = req.body;

    const { frente, lateral, espalda } = req.files;

    if (!frente || !lateral || !espalda) {
      return res.status(400).json({
        message: 'Se requieren las 3 fotos: frente, lateral y espalda',
      });
    }

    // Subir las 3 fotos a Supabase Storage en paralelo
    const [fotoFrenteUrl, fotoLateralUrl, fotoEspaldaUrl] = await Promise.all([
      storageService.uploadPhoto(frente[0].buffer, `${userId}_frente.jpg`, frente[0].mimetype),
      storageService.uploadPhoto(lateral[0].buffer, `${userId}_lateral.jpg`, lateral[0].mimetype),
      storageService.uploadPhoto(espalda[0].buffer, `${userId}_espalda.jpg`, espalda[0].mimetype),
    ]);

    // Analizar foto de frente con GPT-4o Vision
    const perfilFisico = await prisma.perfilFisico.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const analisisIA = await aiService.analyzePhoto(fotoFrenteUrl, {
      peso: peso || perfilFisico?.peso,
      altura: perfilFisico?.altura,
      imc: perfilFisico?.imc,
    });

    // Guardar en BD
    const foto = await prisma.fotoProgreso.create({
      data: {
        userId,
        fotoFrenteUrl,
        fotoLateralUrl,
        fotoEspaldaUrl,
        peso: peso ? parseFloat(peso) : perfilFisico?.peso || null,
        analisisIA,
        mediciones: perfilFisico
          ? {
              altura: perfilFisico.altura,
              peso: perfilFisico.peso,
              imc: perfilFisico.imc,
              porcentajeGrasa: perfilFisico.porcentajeGrasa,
              masaMuscular: perfilFisico.masaMuscular,
            }
          : null,
      },
    });

    res.status(201).json(foto);
  } catch (error) {
    console.error('Error subiendo fotos:', error);
    res.status(500).json({ message: 'Error al procesar las fotos' });
  }
};

// Obtener historial de fotos de progreso
const getPhotos = async (req, res) => {
  try {
    const userId = req.user.userId;

    const fotos = await prisma.fotoProgreso.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fotoFrenteUrl: true,
        fotoLateralUrl: true,
        fotoEspaldaUrl: true,
        peso: true,
        analisisIA: true,
        mediciones: true,
        createdAt: true,
      },
    });

    res.json(fotos);
  } catch (error) {
    console.error('Error obteniendo fotos:', error);
    res.status(500).json({ message: 'Error al obtener fotos de progreso' });
  }
};

// Obtener detalle de una foto con su análisis IA
const getPhotoById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const foto = await prisma.fotoProgreso.findFirst({
      where: { id, userId },
    });

    if (!foto) {
      return res.status(404).json({ message: 'Foto no encontrada' });
    }

    res.json(foto);
  } catch (error) {
    console.error('Error obteniendo foto:', error);
    res.status(500).json({ message: 'Error al obtener foto' });
  }
};

module.exports = { uploadPhotos, getPhotos, getPhotoById };
