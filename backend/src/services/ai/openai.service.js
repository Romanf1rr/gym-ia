const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const aiService = {
  async analyzePhoto(photoUrl, userContext) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
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

  async generateRoutine(userProfile, goals) {
    try {
      const prompt = Genera una rutina de entrenamiento personalizada en formato JSON para:
- Objetivo: 
- Nivel: 
- Dias por semana: 
- Limitaciones: 

El JSON debe tener esta estructura:
{
  "nombre": "string",
  "descripcion": "string",
  "diasSemana": number,
  "duracionSemanas": number,
  "ejercicios": [
    {
      "dia": number,
      "nombreDia": "string",
      "ejercicios": [
        {
          "nombre": "string",
          "series": number,
          "repeticiones": "string",
          "descanso": "string",
          "notas": "string"
        }
      ]
    }
  ]
};

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error en generateRoutine:', error);
      throw new Error('Error al generar rutina');
    }
  },

  async generateNutritionPlan(userProfile, goals, restrictions) {
    try {
      const prompt = Genera un plan nutricional personalizado en formato JSON para:
- Objetivo: 
- Nivel actividad: 
- Restricciones: 

Calcula macros y proporciona plan semanal de comidas.;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error en generateNutritionPlan:', error);
      throw new Error('Error al generar plan nutricional');
    }
  },

  async chatWithAI(messages) {
    try {
      const systemPrompt = Eres un asistente personal de fitness y nutricion. 
Proporciona consejos practicos, motivacion y respuestas basadas en ciencia.
Se empatico, profesional y claro.;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
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
