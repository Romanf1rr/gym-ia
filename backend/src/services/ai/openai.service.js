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

INSTRUCCIONES CRÍTICAS:
- Cada día debe tener EXACTAMENTE entre 5 y 7 ejercicios (nunca menos de 5)
- Distribuye los grupos musculares de forma equilibrada durante la semana
- Adapta el volumen y la intensidad al nivel del usuario
- Incluye ejercicios compuestos (multi-articulares) y de aislamiento
- Para cada ejercicio incluye "nombreEn" con el nombre exacto en inglés tal como aparece en ExerciseDB. Usa nombres simples y comunes: "barbell squat", "deadlift", "bench press", "pull-up", "push-up", "military press", "bent over row", "lat pulldown", "leg press", "dumbbell curl", "tricep pushdown", "plank", "crunch", "leg extension", "leg curl", "calf raise", "dumbbell lateral raise", "dumbbell fly", "romanian deadlift", "hip thrust", "cable row"

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

  async generateNutritionPlan(userProfile, goals, restricciones) {
    try {
      const prompt = `Eres un nutricionista deportivo experto. Genera un plan nutricional semanal completo y personalizado en formato JSON.

PERFIL DEL USUARIO:
- Objetivo: ${goals.objetivoPrincipal}
- Nivel de actividad: ${goals.nivelActividad || 'moderado'}
- Peso actual: ${userProfile.peso || 'no especificado'} kg
- Altura: ${userProfile.altura || 'no especificada'} cm
- Porcentaje de grasa: ${userProfile.porcentajeGrasa || 'no especificado'}%
- Restricciones/alergias/preferencias: ${restricciones || 'ninguna'}

INSTRUCCIONES:
- Calcula las calorías diarias exactas según el objetivo y perfil
- Distribuye en 5 comidas: desayuno, media mañana, almuerzo, merienda, cena
- Especifica cantidades/porciones en gramos para cada alimento
- El plan debe ser variado, práctico y delicioso
- Incluye opciones de sustitución cuando sea posible

El JSON debe tener EXACTAMENTE esta estructura:
{
  "nombre": "string (nombre descriptivo del plan)",
  "caloriasDiarias": number (entero, ej: 2200),
  "proteinas": number (gramos, ej: 165),
  "carbohidratos": number (gramos, ej: 275),
  "grasas": number (gramos, ej: 73),
  "comidas": [
    {
      "tipo": "string (desayuno|media_manana|almuerzo|merienda|cena)",
      "nombre": "string (nombre atractivo de la comida)",
      "hora": "string (ej: 7:30am)",
      "calorias": number,
      "proteinas": number,
      "carbohidratos": number,
      "grasas": number,
      "alimentos": [
        "string (alimento + cantidad, ej: Avena 80g con leche descremada 200ml)",
        "string",
        "string"
      ],
      "notas": "string (tips de preparación o sustituciones, opcional)"
    }
  ],
  "consejos": ["string array con 3 consejos nutricionales personalizados"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 3000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error en generateNutritionPlan:', error);
      throw new Error('Error al generar plan nutricional');
    }
  },

  async chatWithAI(messages) {
    try {
      const systemPrompt = `Eres un asistente personal de fitness y nutricion.
Proporciona consejos practicos, motivacion y respuestas basadas en ciencia.
Se empatico, profesional y claro.`;

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
