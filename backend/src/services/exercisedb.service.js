const https = require('https');

const RAPIDAPI_KEY = process.env.EXERCISEDB_API_KEY;
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';

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

const exerciseDBService = {
  // Busca un ejercicio por nombre y devuelve gifUrl + músculos
  async enrichExercise(exerciseName) {
    if (!RAPIDAPI_KEY) return null;

    try {
      const encoded = encodeURIComponent(exerciseName.toLowerCase());
      const results = await fetchExerciseDB(`/exercises/name/${encoded}?limit=1&offset=0`);

      if (!results || !results.length) return null;

      const ex = results[0];
      return {
        gifUrl: ex.gifUrl || null,
        target: ex.target || null,
        bodyPart: ex.bodyPart || null,
        musculos: ex.target ? [ex.target] : [],
        musculosSecundarios: ex.secondaryMuscles || [],
        equipamiento: ex.equipment || null,
      };
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
            const data = await exerciseDBService.enrichExercise(ejercicio.nombre);
            return {
              ...ejercicio,
              gifUrl: data?.gifUrl || null,
              musculos: data?.musculos || [],
              musculosSecundarios: data?.musculosSecundarios || [],
              equipamiento: data?.equipamiento || null,
            };
          })
        );
        return { ...dia, ejercicios: ejerciciosEnriquecidos };
      })
    );

    return { ...rutina, ejercicios: diasEnriquecidos };
  },
};

module.exports = exerciseDBService;
