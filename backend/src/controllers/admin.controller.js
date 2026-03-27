const prisma = require('../utils/prisma');

const getStats = async (req, res) => {
  try {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    const [totalUsuarios, usuariosPremium, llamadasIA] = await Promise.all([
      prisma.user.count({ where: { activo: true } }),
      prisma.user.count({ where: { plan: 'premium', activo: true } }),
      prisma.mensajeChat.count({ where: { createdAt: { gte: hoy, lt: manana } } }),
    ]);

    res.json({ totalUsuarios, usuariosPremium, activosHoy: 0, llamadasIA, costoEstimadoHoy: llamadasIA * 0.0006 });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

const getUsers = async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, nombre: true, apellido: true, plan: true, rol: true, activo: true, createdAt: true },
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

const updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    if (!['free', 'premium'].includes(plan)) return res.status(400).json({ message: 'Plan inválido' });
    const user = await prisma.user.update({ where: { id }, data: { plan } });
    res.json({ id: user.id, plan: user.plan });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar plan' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const user = await prisma.user.update({ where: { id }, data: { activo } });
    res.json({ id: user.id, activo: user.activo });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

const getPhotos = async (req, res) => {
  try {
    const fotos = await prisma.fotoProgreso.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, nombre: true, apellido: true, email: true } } },
    });
    const fotosConUsuario = fotos.map((f) => ({ ...f, usuario: f.user }));
    res.json(fotosConUsuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener fotos' });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fotoProgreso.delete({ where: { id } });
    res.json({ message: 'Foto eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar foto' });
  }
};

module.exports = { getStats, getUsers, updateUserPlan, updateUserStatus, getPhotos, deletePhoto };
