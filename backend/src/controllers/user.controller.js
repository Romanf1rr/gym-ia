const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userController = {
  async getProfile(req, res) {
    try {
      const userId = req.user.userId; // Cambio: usar userId en lugar de id
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error en getProfile:', error);
      res.status(500).json({ 
        message: 'Error al obtener perfil',
        error: error.message 
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { nombre, apellido, telefono, fechaNac, genero } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          nombre,
          apellido,
          telefono,
          fechaNac: fechaNac ? new Date(fechaNac) : null,
          genero
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          fechaNac: true,
          genero: true,
          rol: true,
          updatedAt: true
        }
      });

      res.json(user);
    } catch (error) {
      console.error('Error en updateProfile:', error);
      res.status(500).json({ 
        message: 'Error al actualizar perfil',
        error: error.message 
      });
    }
  }
};

module.exports = userController;