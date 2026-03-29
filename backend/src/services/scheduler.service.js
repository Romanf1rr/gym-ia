const cron = require('node-cron');
const prisma = require('../utils/prisma');
const { sendPushNotifications } = require('./notification.service');

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get all users that have a push token and an active routine,
 * grouped by days since their last workout.
 */
async function getUsersWithToken() {
  return prisma.user.findMany({
    where: {
      activo: true,
      pushToken: { not: null },
    },
    select: {
      id: true,
      nombre: true,
      pushToken: true,
      entrenamientos: {
        orderBy: { fecha: 'desc' },
        take: 1,
        select: { fecha: true },
      },
      rutinas: {
        where: { activo: true },
        take: 1,
        select: { id: true },
      },
    },
  });
}

// ── Notification jobs ──────────────────────────────────────────────────────────

/**
 * Daily at 18:00 — "Chris te extraña": users who haven't trained in 2+ days.
 */
async function jobExtranaNotification() {
  console.log('[Scheduler] Running: Chris te extraña');
  try {
    const users = await getUsersWithToken();
    const cutoff = daysAgo(2);

    const targets = users.filter(u => {
      const last = u.entrenamientos[0]?.fecha;
      if (!last) return !!u.rutinas[0]; // never trained but has routine
      return new Date(last) < cutoff;
    });

    if (!targets.length) return;

    const MESSAGES = [
      'Chris te extraña 💪 ¿Volvemos hoy al gym?',
      'Han pasado varios días... tu cuerpo te pide movimiento 🔥',
      '¡La constancia es la clave! Chris está esperándote.',
      'Los músculos se recuperan, pero la consistencia no espera 🏋️',
    ];

    const messages = targets.map(u => ({
      token: u.pushToken,
      title: `¡${u.nombre}, te estábamos buscando!`,
      body: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      data: { screen: 'Rutinas' },
    }));

    await sendPushNotifications(messages);
    console.log(`[Scheduler] Extraña: sent to ${messages.length} users`);
  } catch (err) {
    console.error('[Scheduler] Extraña error:', err.message);
  }
}

/**
 * Daily at 08:00 — Morning training reminder for users with an active routine.
 */
async function jobMorningReminder() {
  console.log('[Scheduler] Running: morning reminder');
  try {
    const users = await getUsersWithToken();

    // Only send to users that have an active routine
    const targets = users.filter(u => u.rutinas[0]);

    if (!targets.length) return;

    const MESSAGES = [
      '¡Buenos días! Hoy es un buen día para entrenar 🌅',
      'Cada rep cuenta. ¿Arrancamos hoy? 💪',
      '¡El gym te espera! Chris tiene tu rutina lista 🏋️‍♂️',
      'Pequeños pasos, grandes cambios. ¡A moverla hoy! 🔥',
      '¿Listo para superar tu marca de hoy? Chris confía en vos 💯',
    ];

    const messages = targets.map(u => ({
      token: u.pushToken,
      title: `¡Hola ${u.nombre}! 🌞`,
      body: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      data: { screen: 'Rutinas' },
    }));

    await sendPushNotifications(messages);
    console.log(`[Scheduler] Morning: sent to ${messages.length} users`);
  } catch (err) {
    console.error('[Scheduler] Morning error:', err.message);
  }
}

/**
 * Sundays at 10:00 — Weekly summary notification.
 */
async function jobWeeklySummary() {
  console.log('[Scheduler] Running: weekly summary');
  try {
    const users = await getUsersWithToken();

    // Fetch weekly entrenos per user
    const weekStart = daysAgo(7);
    const summaries = await Promise.all(
      users.map(async u => {
        const count = await prisma.entrenamiento.count({
          where: { userId: u.id, fecha: { gte: weekStart } },
        });
        return { ...u, weekCount: count };
      })
    );

    const messages = summaries
      .filter(u => u.pushToken)
      .map(u => {
        const entrenosText = u.weekCount === 0
          ? 'Esta semana no entrenaste — la próxima es tuya 💪'
          : u.weekCount === 1
          ? '1 entrenamiento esta semana. ¡Podés más! 🔥'
          : `${u.weekCount} entrenamientos esta semana. ¡Sos un crack! 🏆`;
        return {
          token: u.pushToken,
          title: `Resumen semanal, ${u.nombre} 📊`,
          body: entrenosText,
          data: { screen: 'Inicio' },
        };
      });

    await sendPushNotifications(messages);
    console.log(`[Scheduler] Weekly: sent to ${messages.length} users`);
  } catch (err) {
    console.error('[Scheduler] Weekly error:', err.message);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────────

function initScheduler() {
  // Daily at 18:00 — "Chris te extraña" for inactive users
  cron.schedule('0 18 * * *', jobExtranaNotification, { timezone: 'America/Argentina/Buenos_Aires' });

  // Daily at 08:00 — Morning motivation
  cron.schedule('0 8 * * *', jobMorningReminder, { timezone: 'America/Argentina/Buenos_Aires' });

  // Sundays at 10:00 — Weekly summary
  cron.schedule('0 10 * * 0', jobWeeklySummary, { timezone: 'America/Argentina/Buenos_Aires' });

  console.log('[Scheduler] Jobs registered: morning(8am), extraña(6pm), weekly(Sun 10am) — TZ: Buenos Aires');
}

module.exports = { initScheduler, jobExtranaNotification, jobMorningReminder, jobWeeklySummary };
