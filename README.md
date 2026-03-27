# Gym IA - Entrenador Personal con Inteligencia Artificial

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

## Descripcion

Gym IA es una aplicacion integral de gimnasio que combina analisis corporal con IA, generacion automatica de rutinas de entrenamiento y planes nutricionales personalizados.

## Caracteristicas Principales

- Analisis Corporal con IA: Captura y analisis de fotos para mediciones precisas
- Rutinas Personalizadas: Planes de entrenamiento adaptados a objetivos individuales
- Planes Nutricionales: Recomendaciones alimenticias basadas en metas
- Seguimiento de Progreso: Comparativas visuales y metricas detalladas
- Asistente IA 24/7: Chat inteligente para consultas y motivacion
- Apps Multiplataforma: Tablet para gimnasio y movil para clientes

## Inicio Rapido

### Prerequisitos
- Node.js 18.x o superior
- Expo CLI (`npm install -g expo-cli`)
- Cuenta en Supabase (supabase.com)
- Cuenta en Upstash (upstash.com)
- API Key de OpenAI
- API Key de ExerciseDB (RapidAPI)

### Instalacion
1. Clonar el repositorio
2. Instalar dependencias: `npm run install:all`
3. Configurar `backend/.env` con las variables requeridas (ver PROGRESS.md)
4. Crear `mobile-app/.env` con la URL del backend
5. Correr migraciones: `cd backend && npx prisma migrate deploy`
6. Iniciar backend: `cd backend && npm run dev`
7. Iniciar mobile: `cd mobile-app && npx expo start`


## Seguimiento del Proyecto

- [PROGRESS.md](./PROGRESS.md) - Estado actual del desarrollo
- [WORKFLOW.md](./WORKFLOW.md) - Recordatorio de workflow
- [docs/ROADMAP.md](./docs/ROADMAP.md) - Plan completo de desarrollo

## Documentacion

- [Roadmap Completo](./docs/ROADMAP.md)
- [Arquitectura](./docs/architecture/SYSTEM_ARCHITECTURE.md)
- [API Documentation](./docs/api/API_DOCUMENTATION.md)

## Stack Tecnologico

**Frontend:** Expo (React Native), Zustand, NativeWind, react-native-body-highlighter, expo-av
**Backend:** Node.js, Express, Prisma
**Base de datos:** Supabase (PostgreSQL + Storage)
**Caché:** Upstash Redis
**IA:** OpenAI GPT-4o (texto + visión)
**Ejercicios:** ExerciseDB API (GIFs + músculos)
**DevOps:** EAS Build, GitHub Actions

## Progreso del Proyecto

- [x] Estructura inicial (10%)
- [ ] Backend API (35%)
- [ ] App Tablet (55%)
- [ ] App Movil (80%)
- [ ] IA Avanzada (90%)
- [ ] Launch (100%)

## Licencia

MIT License - ver [LICENSE](LICENSE)

---

Hecho con amor por el equipo de Gym IA

