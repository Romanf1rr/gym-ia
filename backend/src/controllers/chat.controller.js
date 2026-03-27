const prisma = require('../utils/prisma');
const aiService = require('../services/ai/openai.service');

// Enviar mensaje al chat con IA
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mensaje } = req.body;

    // Obtener historial reciente (últimos 10 mensajes para contexto)
    const historial = await prisma.mensajeChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Invertir para orden cronológico
    const mensajesParaIA = historial.reverse().map((m) => ({
      role: m.rol,
      content: m.contenido,
    }));

    // Agregar el nuevo mensaje del usuario
    mensajesParaIA.push({ role: 'user', content: mensaje });

    // Guardar mensaje del usuario en BD
    await prisma.mensajeChat.create({
      data: { userId, rol: 'user', contenido: mensaje },
    });

    // Obtener respuesta de GPT-4o
    const respuesta = await aiService.chatWithAI(mensajesParaIA);

    // Guardar respuesta del asistente en BD
    const mensajeGuardado = await prisma.mensajeChat.create({
      data: { userId, rol: 'assistant', contenido: respuesta },
    });

    res.json({
      mensaje: mensajeGuardado.contenido,
      id: mensajeGuardado.id,
      createdAt: mensajeGuardado.createdAt,
    });
  } catch (error) {
    console.error('Error en chat con IA:', error);
    res.status(500).json({ message: 'Error al comunicarse con el asistente' });
  }
};

// Obtener historial de chat
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;

    const mensajes = await prisma.mensajeChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        rol: true,
        contenido: true,
        createdAt: true,
      },
    });

    res.json(mensajes);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ message: 'Error al obtener historial del chat' });
  }
};

// Limpiar historial de chat
const clearHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.mensajeChat.deleteMany({ where: { userId } });

    res.json({ message: 'Historial eliminado' });
  } catch (error) {
    console.error('Error limpiando historial:', error);
    res.status(500).json({ message: 'Error al limpiar historial' });
  }
};

module.exports = { sendMessage, getChatHistory, clearHistory };
