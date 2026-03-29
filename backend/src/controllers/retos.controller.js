const prisma = require('../utils/prisma');

// ── Admin: crear reto ──────────────────────────────────────────
const crearReto = async (req, res) => {
  try {
    const { titulo, descripcion, tipo, meta, unidad, premio, imagen, fechaInicio, fechaFin } = req.body;
    const reto = await prisma.reto.create({
      data: {
        titulo,
        descripcion,
        tipo,
        meta: parseFloat(meta),
        unidad,
        premio,
        imagen: imagen || null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        creadoPor: req.user.userId,
      },
    });
    res.status(201).json(reto);
  } catch (e) {
    console.error('[Retos] crearReto:', e);
    res.status(500).json({ message: 'Error al crear reto' });
  }
};

// ── Admin: listar todos (activos e inactivos) ──────────────────
const listarRetosAdmin = async (req, res) => {
  try {
    const retos = await prisma.reto.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { participaciones: true } } },
    });
    res.json(retos);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener retos' });
  }
};

// ── Admin: activar/desactivar reto ────────────────────────────
const toggleReto = async (req, res) => {
  try {
    const { id } = req.params;
    const reto = await prisma.reto.findUnique({ where: { id } });
    if (!reto) return res.status(404).json({ message: 'Reto no encontrado' });
    const updated = await prisma.reto.update({ where: { id }, data: { activo: !reto.activo } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar reto' });
  }
};

// ── Cliente: listar retos activos con estado de participación ──
const listarRetos = async (req, res) => {
  try {
    const userId = req.user.userId;
    const ahora = new Date();

    const retos = await prisma.reto.findMany({
      where: { activo: true, fechaFin: { gte: ahora } },
      orderBy: { fechaFin: 'asc' },
      include: {
        _count: { select: { participaciones: true } },
        participaciones: { where: { userId }, select: { progreso: true, completado: true, createdAt: true } },
      },
    });

    const result = retos.map((r) => {
      const participacion = r.participaciones[0] || null;
      const { participaciones, ...rest } = r;
      return {
        ...rest,
        participantes: r._count.participaciones,
        miParticipacion: participacion,
        diasRestantes: Math.max(0, Math.ceil((new Date(r.fechaFin) - ahora) / 86400000)),
      };
    });

    res.json(result);
  } catch (e) {
    console.error('[Retos] listarRetos:', e);
    res.status(500).json({ message: 'Error al obtener retos' });
  }
};

// ── Cliente: unirse a un reto ──────────────────────────────────
const unirse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const reto = await prisma.reto.findUnique({ where: { id } });
    if (!reto || !reto.activo) return res.status(404).json({ message: 'Reto no disponible' });
    if (new Date(reto.fechaFin) < new Date()) return res.status(400).json({ message: 'Este reto ya terminó' });

    const existente = await prisma.participacionReto.findUnique({ where: { retoId_userId: { retoId: id, userId } } });
    if (existente) return res.status(400).json({ message: 'Ya estás participando en este reto' });

    const participacion = await prisma.participacionReto.create({
      data: { retoId: id, userId, progreso: 0 },
    });
    res.status(201).json(participacion);
  } catch (e) {
    console.error('[Retos] unirse:', e);
    res.status(500).json({ message: 'Error al unirse al reto' });
  }
};

// ── Cliente: actualizar progreso ───────────────────────────────
const actualizarProgreso = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { progreso } = req.body;

    const participacion = await prisma.participacionReto.findUnique({
      where: { retoId_userId: { retoId: id, userId } },
      include: { reto: true },
    });
    if (!participacion) return res.status(404).json({ message: 'No estás participando en este reto' });

    const nuevoProgreso = Math.max(0, parseFloat(progreso));
    const completado = nuevoProgreso >= participacion.reto.meta;

    const updated = await prisma.participacionReto.update({
      where: { retoId_userId: { retoId: id, userId } },
      data: {
        progreso: nuevoProgreso,
        completado,
        fechaCompletado: completado && !participacion.completado ? new Date() : participacion.fechaCompletado,
      },
    });
    res.json(updated);
  } catch (e) {
    console.error('[Retos] actualizarProgreso:', e);
    res.status(500).json({ message: 'Error al actualizar progreso' });
  }
};

// ── Leaderboard de un reto ─────────────────────────────────────
const leaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reto = await prisma.reto.findUnique({ where: { id } });
    if (!reto) return res.status(404).json({ message: 'Reto no encontrado' });

    const participaciones = await prisma.participacionReto.findMany({
      where: { retoId: id },
      orderBy: [{ completado: 'desc' }, { progreso: 'desc' }, { createdAt: 'asc' }],
      include: { user: { select: { id: true, nombre: true, apellido: true } } },
      take: 20,
    });

    const result = participaciones.map((p, i) => ({
      posicion: i + 1,
      userId: p.user.id,
      nombre: `${p.user.nombre} ${p.user.apellido || ''}`.trim(),
      progreso: p.progreso,
      completado: p.completado,
      fechaCompletado: p.fechaCompletado,
      esMio: p.user.id === userId,
    }));

    res.json({ reto, leaderboard: result });
  } catch (e) {
    console.error('[Retos] leaderboard:', e);
    res.status(500).json({ message: 'Error al obtener leaderboard' });
  }
};

module.exports = { crearReto, listarRetosAdmin, toggleReto, listarRetos, unirse, actualizarProgreso, leaderboard };
