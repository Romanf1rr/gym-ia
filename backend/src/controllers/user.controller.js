const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userController = {
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          fechaNac: true,
          genero: true,
          rol: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error en getProfile:', error);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { nombre, apellido, telefono, fechaNac, genero } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(nombre && { nombre }),
          ...(apellido && { apellido }),
          ...(telefono && { telefono }),
          ...(fechaNac && { fechaNac: new Date(fechaNac) }),
          ...(genero && { genero })
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          fechaNac: true,
          genero: true,
          rol: true
        }
      });

      res.json(user);
    } catch (error) {
      console.error('Error en updateProfile:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
};

module.exports = userController;
