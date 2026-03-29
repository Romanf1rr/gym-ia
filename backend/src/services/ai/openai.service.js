const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const aiService = {
  async analyzePhoto(photoUrl, userContext) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza esta foto de progreso fisico. Proporciona estimaciones de: composicion corporal, areas de desarrollo, postura, y recomendaciones generales. Responde en formato JSON.'
              },
              {
                type: 'image_url',
                image_url: { url: photoUrl }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error en analyzePhoto:', error);
      throw new Error('Error al analizar foto con IA');
    }
  },

  async generateRoutine(userProfile, goals, extras = {}) {
    try {
      const prompt = `Eres un entrenador personal experto. Genera una rutina de entrenamiento personalizada en formato JSON.

PERFIL DEL USUARIO:
- Objetivo principal: ${goals.objetivoPrincipal}
- Nivel de experiencia: ${goals.nivelExperiencia}
- Días por semana: ${goals.diasSemana}
- Limitaciones médicas: ${goals.limitaciones || 'ninguna'}
- Peso: ${userProfile.peso || 'no especificado'} kg
- Altura: ${userProfile.altura || 'no especificada'} cm

PREFERENCIAS ADICIONALES:
- Lugar de entrenamiento: ${extras.lugar || 'gym completo'}
- Zonas a priorizar: ${extras.zonasPrioritarias || 'todo el cuerpo'}
- Lesiones o restricciones: ${extras.lesiones || 'ninguna'}
- Duración por sesión: ${extras.duracionSesion || '60 minutos'}

EJERCICIOS DISPONIBLES — USA EXACTAMENTE ESTOS NOMBRES EN "nombreEn":
${extras.listaEjercicios || 'bench press, squat, deadlift, pull-up, push-up, plank'}

INSTRUCCIONES CRÍTICAS:
- Cada día debe tener EXACTAMENTE entre 5 y 7 ejercicios (nunca menos de 5)
- El campo "nombreEn" DEBE ser uno de los nombres de la lista de arriba, copiado exactamente
- NO inventes nombres en inglés — solo usa los de la lista
- Distribuye los grupos musculares de forma equilibrada durante la semana
- Adapta el volumen y la intensidad al nivel del usuario
- Incluye ejercicios compuestos (multi-articulares) y de aislamiento

MÚSCULOS VÁLIDOS (usar EXACTAMENTE estos nombres en los arrays):
pectorals, biceps, triceps, abs, quadriceps, hamstrings, glutes, lats, traps, shoulders, calves, forearms, adductors, obliques

El JSON debe tener EXACTAMENTE esta estructura:
{
  "nombre": "string",
  "descripcion": "string",
  "diasSemana": number,
  "duracionSemanas": number,
  "ejercicios": [
    {
      "dia": number,
      "nombreDia": "string (ej: Lunes - Pecho y Tríceps)",
      "ejercicios": [
        {
          "nombre": "string (nombre del ejercicio en español)",
          "nombreEn": "string (nombre estándar en inglés, ej: bench press)",
          "series": number,
          "repeticiones": "string (ej: 8-12)",
          "descanso": "string (ej: 60 segundos)",
          "equipamiento": "string (ej: barra, mancuernas, máquina, peso corporal)",
          "instrucciones": "string (cómo ejecutar el ejercicio en 1 oración corta)",
          "notas": "string (1 tip breve)",
          "musculos": ["array con músculos principales de la lista válida"],
          "musculosSecundarios": ["array con músculos secundarios de la lista válida"]
        }
      ]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 6000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error en generateRoutine:', error);
      throw new Error('Error al generar rutina');
    }
  },

  async generateNutritionPlan(userProfile, goals, extras = {}) {
    try {
      const { restricciones, horaEntrenamiento, horaPrimerAlimento, tipoRutina } = extras;

      // Calcular horarios de comidas en base al primer alimento y entrenamiento
      const primerAlimento = horaPrimerAlimento || '7:00am';
      const entrena = horaEntrenamiento || null;

      // Estrategia de macros según objetivo
      const estrategiaObjetivo = {
        'ganar_musculo': 'VOLUMEN: superávit calórico +300-500 kcal. Proteínas altas (2-2.5g/kg). Carbos altos para energía y recuperación. Comida pre y post entrenamiento con carbos + proteína.',
        'perder_grasa': 'DÉFICIT: déficit calórico -400-600 kcal. Proteínas altas (2-2.2g/kg) para preservar músculo. Carbos moderados, grasas saludables. Comida pre-entreno con carbos, post-entreno solo proteína.',
        'mantener': 'MANTENIMIENTO: calorías de mantenimiento exactas. Balance equilibrado de macros. Proteínas moderadas-altas (1.6-2g/kg).',
        'definicion': 'DEFINICIÓN: déficit moderado -300 kcal. Proteínas muy altas (2.2-2.5g/kg). Carbos cíclicos (más en días de entrenamiento, menos en descanso). Grasas saludables.',
        'resistencia': 'RESISTENCIA: calorías mantenimiento o ligero superávit. Carbos muy altos (55-65% de calorías). Proteínas moderadas. Hidratación enfatizada.',
      }[goals.objetivoPrincipal] || 'Balance equilibrado adaptado al objetivo.';

      const prompt = `Eres un nutricionista deportivo experto. Genera un plan nutricional diario personalizado en formato JSON estricto.

PERFIL DEL USUARIO:
- Objetivo principal: ${goals.objetivoPrincipal}
- Nivel de experiencia: ${goals.nivelExperiencia || 'intermedio'}
- Nivel de actividad: ${goals.nivelActividad || 'moderado'}
- Peso actual: ${userProfile.peso || 70} kg
- Altura: ${userProfile.altura || 170} cm
- Edad: ${userProfile.edad || 'no especificada'}
- Sexo: ${userProfile.sexo || 'no especificado'}
- Porcentaje de grasa: ${userProfile.porcentajeGrasa || 'no especificado'}%
- Tipo de rutina activa: ${tipoRutina || 'entrenamiento de fuerza'}
- Hora primer alimento: ${primerAlimento}
- Hora de entrenamiento: ${entrena || 'no especificada'}
- Restricciones/alergias/preferencias: ${restricciones || 'ninguna'}

ESTRATEGIA NUTRICIONAL OBLIGATORIA:
${estrategiaObjetivo}

INSTRUCCIONES CRÍTICAS:
- SIEMPRE incluir exactamente 5 comidas: desayuno, media_manana, almuerzo, merienda, cena
- Los horarios deben basarse en la hora del primer alimento (${primerAlimento}) y distribuirse cada 2.5-3 horas
${entrena ? `- Si entrena a las ${entrena}: poner comida pre-entreno 1.5h antes (carbos+proteína) y post-entreno 30-45min después (proteína+carbos rápidos)` : ''}
- Cada alimento debe incluir cantidad exacta en gramos o ml
- Los macros de cada comida deben sumar exactamente los macros totales del día
- La dieta debe ser coherente con el tipo de rutina activa
- Nombres de comidas atractivos y descriptivos (no solo "Almuerzo")
- Mínimo 4 alimentos por comida, con cantidades precisas

El JSON debe tener EXACTAMENTE esta estructura (sin campos extra):
{
  "nombre": "string (nombre descriptivo del plan, ej: Plan Volumen - Ganancia Muscular)",
  "objetivo": "string (ganar_musculo|perder_grasa|mantener|definicion|resistencia)",
  "caloriasDiarias": number (entero),
  "proteinas": number (gramos, entero),
  "carbohidratos": number (gramos, entero),
  "grasas": number (gramos, entero),
  "hidratacion": "string (ej: 3 litros de agua al día)",
  "comidas": [
    {
      "tipo": "desayuno",
      "nombre": "string (nombre atractivo)",
      "hora": "string (ej: 7:00am)",
      "calorias": number (entero),
      "proteinas": number (entero),
      "carbohidratos": number (entero),
      "grasas": number (entero),
      "alimentos": ["string (alimento + cantidad exacta)", "string", "string", "string"],
      "notas": "string (tip breve de preparación o sustitución)"
    },
    { "tipo": "media_manana", ... },
    { "tipo": "almuerzo", ... },
    { "tipo": "merienda", ... },
    { "tipo": "cena", ... }
  ],
  "consejos": ["string", "string", "string"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2500,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error en generateNutritionPlan:', error);
      throw new Error('Error al generar plan nutricional');
    }
  },

  async chatWithAI(messages) {
    try {
      const systemPrompt = `Sos Chris, el coach de IA personal de Gym IA. Tu personalidad es la de un entrenador experto, motivador y directo — como un coach de élite que realmente se preocupa por los resultados del usuario.

SOBRE VOS:
- Tu nombre es Chris
- Sos el asistente de IA de Gym IA, especializado en fitness y nutrición
- Hablás con confianza, energía y cercanía — como un coach personal, no como un robot
- Usás frases motivadoras cuando el contexto lo pide, pero sin exagerar

TEMAS QUE PODÉS RESPONDER:
- Ejercicios, técnica y rutinas de entrenamiento
- Nutrición deportiva, dietas, macros y calorías
- Pérdida de grasa, ganancia muscular y composición corporal
- Suplementación deportiva
- Descanso, recuperación y lesiones deportivas
- Motivación y hábitos saludables
- Salud general relacionada al deporte y bienestar físico

TEMAS QUE NO PODÉS RESPONDER:
- Política, religión, entretenimiento, tecnología u otros temas no relacionados al fitness
- Preguntas médicas de diagnóstico o tratamiento (derivar a un médico)

Si preguntan sobre algo fuera de estos temas, respondé:
"Soy Chris, tu coach de Gym IA. Solo puedo ayudarte con fitness, entrenamiento y nutrición. ¿En qué te puedo ayudar hoy?"

Proporciona consejos prácticos basados en evidencia científica. Respondé siempre en el idioma del usuario.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error en chatWithAI:', error);
      throw new Error('Error al comunicarse con IA');
    }
  }
};

module.exports = aiService;
