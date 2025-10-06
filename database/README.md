# Base de Datos - Gym IA

## Schema Prisma

El archivo principal de schema está en: schemas/schema.prisma

## Modelos Principales

### Users
Tabla principal de usuarios (clientes, staff, admins)

### PerfilFisico
Mediciones corporales de los usuarios

### FotoProgreso
Fotos de seguimiento con análisis de IA

### Objetivo
Metas y objetivos del usuario

### Rutina
Planes de entrenamiento generados

### Entrenamiento
Registro de entrenamientos realizados

### PlanNutricional
Planes de alimentación personalizados

### RegistroComida
Tracking de comidas diarias

### MensajeChat
Historial de conversaciones con IA

## Migraciones

Para crear las migraciones:
npm run db:migrate

Para aplicar migraciones:
npx prisma migrate deploy

Para ver la base de datos:
npm run db:studio
