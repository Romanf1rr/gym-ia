# Backend - Gym IA

## Instalacion

npm install

## Configuracion

1. Copia .env.example a .env
2. Configura las variables de entorno
3. Ejecuta las migraciones: npm run db:migrate

## Scripts

- npm run dev - Desarrollo con nodemon
- npm start - Produccion
- npm test - Tests
- npm run db:migrate - Migraciones
- npm run db:seed - Seeds
- npm run db:studio - Prisma Studio

## Estructura

- src/index.js - Servidor principal
- src/routes/ - Rutas de API
- src/controllers/ - Logica de negocio
- src/services/ - Servicios externos (IA, S3, etc)
- src/middleware/ - Middleware custom
- src/utils/ - Utilidades

## Endpoints Principales

### Autenticacion
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

### Usuario
GET /api/v1/users/me
PUT /api/v1/users/me

### Fotos (TODO)
POST /api/v1/photos/upload
GET /api/v1/photos/:userId

### Rutinas (TODO)
GET /api/v1/routines/current
POST /api/v1/routines/generate

### Nutricion (TODO)
GET /api/v1/nutrition/plan
POST /api/v1/nutrition/generate

### Chat IA (TODO)
POST /api/v1/chat/message
GET /api/v1/chat/history
