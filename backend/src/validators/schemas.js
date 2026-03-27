const Joi = require('joi');

const schemas = {
  // Auth
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'any.required': 'El email es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
    nombre: Joi.string().min(2).max(50).required().messages({
      'any.required': 'El nombre es requerido'
    }),
    apellido: Joi.string().min(2).max(50).optional().allow(''),
    telefono: Joi.string().max(20).optional().allow('')
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'any.required': 'El email es requerido'
    }),
    password: Joi.string().required().messages({
      'any.required': 'La contraseña es requerida'
    })
  }),

  refreshToken: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'El token es requerido'
    })
  }),

  // User
  updateProfile: Joi.object({
    nombre: Joi.string().min(2).max(50).optional(),
    apellido: Joi.string().min(2).max(50).optional().allow(''),
    telefono: Joi.string().max(20).optional().allow(''),
    fechaNac: Joi.string().isoDate().optional().allow(null, ''),
    genero: Joi.string().valid('masculino', 'femenino', 'otro').optional().allow(null, '')
  }),

  // Physical Profile
  createPhysicalProfile: Joi.object({
    altura: Joi.number().min(50).max(300).required().messages({
      'number.min': 'La altura debe ser mayor a 50 cm',
      'number.max': 'La altura debe ser menor a 300 cm',
      'any.required': 'La altura es requerida'
    }),
    peso: Joi.number().min(20).max(500).required().messages({
      'number.min': 'El peso debe ser mayor a 20 kg',
      'number.max': 'El peso debe ser menor a 500 kg',
      'any.required': 'El peso es requerido'
    }),
    porcentajeGrasa: Joi.number().min(1).max(70).optional().allow(null),
    masaMuscular: Joi.number().min(1).max(200).optional().allow(null),
    brazo: Joi.number().min(1).max(100).optional().allow(null),
    pecho: Joi.number().min(1).max(250).optional().allow(null),
    cintura: Joi.number().min(1).max(250).optional().allow(null),
    cadera: Joi.number().min(1).max(250).optional().allow(null),
    muslo: Joi.number().min(1).max(150).optional().allow(null),
    notas: Joi.string().max(500).optional().allow(null, '')
  }),

  // Rutinas
  logWorkout: Joi.object({
    rutinaId: Joi.string().uuid().required().messages({
      'any.required': 'El ID de rutina es requerido'
    }),
    ejercicios: Joi.array().min(1).required().messages({
      'any.required': 'Los ejercicios son requeridos'
    }),
    duracion: Joi.number().min(1).max(600).optional().allow(null),
    notas: Joi.string().max(500).optional().allow(null, '')
  }),

  // Nutrición
  generateNutrition: Joi.object({
    restricciones: Joi.string().max(300).optional().allow(null, '')
  }),

  logMeal: Joi.object({
    planNutricionalId: Joi.string().uuid().optional().allow(null),
    tipoComida: Joi.string().valid('desayuno', 'almuerzo', 'cena', 'snack').required().messages({
      'any.required': 'El tipo de comida es requerido',
      'any.only': 'Tipo de comida inválido'
    }),
    alimentos: Joi.array().min(1).required().messages({
      'any.required': 'Los alimentos son requeridos'
    }),
    caloriasTotal: Joi.number().min(0).required(),
    proteinasTotal: Joi.number().min(0).required(),
    carbohidratosTotal: Joi.number().min(0).required(),
    grasasTotal: Joi.number().min(0).required(),
    notas: Joi.string().max(500).optional().allow(null, '')
  }),

  // Chat
  chat: Joi.object({
    mensaje: Joi.string().min(1).max(1000).required().messages({
      'any.required': 'El mensaje es requerido',
      'string.max': 'El mensaje no puede superar 1000 caracteres'
    })
  })
};

module.exports = schemas;
