const https = require('https');
const prisma = require('../utils/prisma');

const RAPIDAPI_KEY = process.env.EXERCISEDB_API_KEY;
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';

// L1: caché en memoria (rápido, se pierde al reiniciar)
const memoryCache = new Map();

const fetchExerciseDB = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: RAPIDAPI_HOST,
      path,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.end();
  });
};

const normalizeKey = (name) => name.toLowerCase().trim();

const exerciseDBService = {
  // Busca un ejercicio con caché en 2 capas: memoria → DB → API
  async enrichExercise(exerciseName) {
    if (!RAPIDAPI_KEY) return null;

    const key = normalizeKey(exerciseName);

    // L1: memoria
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }

    // L2: base de datos
    try {
      const cached = await prisma.ejercicioCache.findUnique({ where: { nombre: key } });
      // Solo usar caché si tiene gifUrl válido (entradas sin gifUrl son stale)
      if (cached && cached.gifUrl) {
        const result = {
          gifUrl: cached.gifUrl,
          musculos: cached.musculos,
          musculosSecundarios: cached.musculosSecundarios,
          equipamiento: cached.equipamiento,
          bodyPart: cached.bodyPart,
        };
        memoryCache.set(key, result);
        return result;
      }
      // Si está en cache pero sin gifUrl, eliminar para re-fetchear
      if (cached && !cached.gifUrl) {
        await prisma.ejercicioCache.delete({ where: { nombre: key } }).catch(() => {});
      }
    } catch {
      // Si falla la DB, seguimos con la API
    }

    // L3: llamada a ExerciseDB API
    try {
      const encoded = encodeURIComponent(key);
      console.log(`[ExerciseDB] Buscando: "${key}"`);
      const results = await fetchExerciseDB(`/exercises/name/${encoded}?limit=1&offset=0`);
      console.log(`[ExerciseDB] Respuesta raw para "${key}":`, JSON.stringify(results)?.substring(0, 300));

      // La API puede devolver array directo o { exercises: [...] } o { data: [...] }
      const lista = Array.isArray(results) ? results
        : Array.isArray(results?.exercises) ? results.exercises
        : Array.isArray(results?.data) ? results.data
        : null;

      if (!lista || !lista.length) {
        // Fallback: intentar con el último par de palabras del nombre
        const words = key.split(' ');
        if (words.length > 1) {
          const fallbackKey = words.slice(-2).join(' ');
          if (fallbackKey !== key) {
            console.log(`[ExerciseDB] Fallback buscando: "${fallbackKey}"`);
            const fallbackResults = await fetchExerciseDB(`/exercises/name/${encodeURIComponent(fallbackKey)}?limit=1&offset=0`);
            const fallbackLista = Array.isArray(fallbackResults) ? fallbackResults
              : Array.isArray(fallbackResults?.exercises) ? fallbackResults.exercises
              : Array.isArray(fallbackResults?.data) ? fallbackResults.data
              : null;
            if (fallbackLista?.length) {
              const ex2 = fallbackLista[0];
              const result2 = {
                gifUrl: ex2.id || null,
                musculos: ex2.target ? [ex2.target] : [],
                musculosSecundarios: ex2.secondaryMuscles || [],
                equipamiento: ex2.equipment || null,
                bodyPart: ex2.bodyPart || null,
              };
              memoryCache.set(key, result2);
              return result2;
            }
          }
        }
        console.log(`[ExerciseDB] Sin resultados para "${key}"`);
        memoryCache.set(key, null);
        return null;
      }

      const ex = lista[0];
      const result = {
        gifUrl: ex.id || null,   // guardamos solo el ID, la URL se construye en el móvil
        musculos: ex.target ? [ex.target] : [],
        musculosSecundarios: ex.secondaryMuscles || [],
        equipamiento: ex.equipment || null,
        bodyPart: ex.bodyPart || null,
        instrucciones: ex.instructions?.join(' ') || null,
      };

      // Guardar en DB (L2)
      try {
        await prisma.ejercicioCache.create({
          data: {
            nombre: key,
            gifUrl: result.gifUrl,
            musculos: result.musculos,
            musculosSecundarios: result.musculosSecundarios,
            equipamiento: result.equipamiento,
            bodyPart: result.bodyPart,
          },
        });
      } catch {
        // Puede fallar si otro request guardó el mismo ejercicio en paralelo (race condition) — ignorar
      }

      // Guardar en memoria (L1)
      memoryCache.set(key, result);
      return result;
    } catch {
      return null;
    }
  },

  // Enriquece todos los ejercicios de una rutina
  async enrichRoutine(rutina) {
    if (!RAPIDAPI_KEY) return rutina;

    const diasEnriquecidos = await Promise.all(
      rutina.ejercicios.map(async (dia) => {
        const ejerciciosEnriquecidos = await Promise.all(
          dia.ejercicios.map(async (ejercicio) => {
            // Usar nombre en inglés para búsqueda en ExerciseDB (mejor coincidencia)
            const data = await exerciseDBService.enrichExercise(ejercicio.nombreEn || ejercicio.nombre);
            return {
              ...ejercicio,
              gifUrl: data?.gifUrl || null,
              musculos: data?.musculos?.length ? data.musculos : (ejercicio.musculos || []),
              musculosSecundarios: data?.musculosSecundarios?.length
                ? data.musculosSecundarios
                : (ejercicio.musculosSecundarios || []),
              equipamiento: data?.equipamiento || ejercicio.equipamiento || null,
            };
          })
        );
        return { ...dia, ejercicios: ejerciciosEnriquecidos };
      })
    );

    return { ...rutina, ejercicios: diasEnriquecidos };
  },

  // Devuelve estadísticas del caché (útil para el panel admin)
  async getCacheStats() {
    try {
      const total = await prisma.ejercicioCache.count();
      return { totalCacheados: total, enMemoria: memoryCache.size };
    } catch {
      return { totalCacheados: 0, enMemoria: memoryCache.size };
    }
  },
};

module.exports = exerciseDBService;
module.exports.fetchRaw = fetchExerciseDB;
module.exports.clearCache = () => memoryCache.clear();
