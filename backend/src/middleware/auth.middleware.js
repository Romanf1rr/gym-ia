const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Leer rol y plan actuales de la DB (evita tokens desactualizados)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { rol: true, plan: true },
    });

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      rol: user?.rol || decoded.rol,
      plan: user?.plan || decoded.plan || 'free',
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
};

module.exports = authMiddleware;