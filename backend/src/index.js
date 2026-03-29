require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/physical-profiles', require('./routes/physical-profile.routes'));
app.use('/api/v1/photos', require('./routes/photo.routes'));
app.use('/api/v1/routines', require('./routes/routine.routes'));
app.use('/api/v1/nutrition', require('./routes/nutrition.routes'));
app.use('/api/v1/chat', require('./routes/chat.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/objectives', require('./routes/objetivo.routes'));
app.use('/api/v1/retos', require('./routes/retos.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler global (siempre al final, 4 parámetros)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: err.status || 500,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

const { initScheduler } = require('./services/scheduler.service');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + process.env.NODE_ENV);
  console.log('ExerciseDB key:', process.env.EXERCISEDB_API_KEY ? '✓ CARGADA (' + process.env.EXERCISEDB_API_KEY.substring(0, 8) + '...)' : '✗ NO ENCONTRADA');
  console.log('OpenAI key:', process.env.OPENAI_API_KEY ? '✓ CARGADA' : '✗ NO ENCONTRADA');
  initScheduler();
});

module.exports = app;