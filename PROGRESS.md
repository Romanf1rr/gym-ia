# Progreso del Proyecto - Gym IA

**Última actualización:** 2026-03-26

## Estado Actual: 45% Completado

---

## Stack Tecnológico Definitivo

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Mobile | Expo (React Native) | ✅ Activo |
| Backend | Express.js + Prisma | ✅ Activo |
| Base de datos | Supabase (PostgreSQL) | 🔄 Migrar desde Docker |
| Storage (fotos) | Supabase Storage | 🔄 Reemplaza AWS S3 |
| Caché / Token Blacklist | Upstash Redis | 🔄 Reemplaza Docker Redis |
| IA texto/rutinas/nutrición | OpenAI GPT-4o | 🐛 Fix bugs primero |
| IA análisis de fotos | OpenAI GPT-4o (Vision) | 🔄 Pendiente integrar |
| Videos / GIFs ejercicios | ExerciseDB API | 🆕 Por integrar |
| Visualización músculos | react-native-body-highlighter | 🆕 Por integrar |
| Animación cuerpo humano | react-native-body-highlighter + ExerciseDB | 🆕 Por integrar |

---

## Dependencias Clave

### Backend
```
express, prisma, @prisma/client
jsonwebtoken, bcryptjs
openai (GPT-4o)
multer (upload fotos)
@supabase/supabase-js (reemplaza aws-sdk + docker pg)
ioredis (para Upstash)
joi (validación - INSTALAR Y USAR)
helmet, express-rate-limit, cors
```

### Mobile App
```
expo (~54.0.12)
react-navigation (v7)
zustand
axios
nativewind
expo-av (videos de ejercicios)
expo-camera (fotos de progreso)
react-native-body-highlighter (cuerpo humano con músculos)
react-native-chart-kit (gráficas de progreso)
@react-native-async-storage/async-storage
```

### APIs Externas
```
OpenAI API (GPT-4o) → rutinas, nutrición, análisis fotos, chat
ExerciseDB API (RapidAPI) → GIFs ejercicios + músculos mapeados
Supabase → PostgreSQL + Storage
Upstash → Redis cloud
```

---

## Variables de Entorno Requeridas

### backend/.env (COMPLETAR)
```env
DATABASE_URL="postgresql://..."          # ← Supabase connection string
REDIS_URL="rediss://..."                 # ← Upstash Redis URL
JWT_SECRET="secreto_largo_y_seguro"      # ← Cambiar el placeholder
REFRESH_TOKEN_SECRET="otro_secreto"      # ← FALTA
REFRESH_TOKEN_EXPIRES_IN=30d             # ← FALTA
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-...                    # ← FALTA (bloquea toda la IA)
SUPABASE_URL=https://xxx.supabase.co     # ← NUEVO
SUPABASE_SERVICE_KEY=eyJ...              # ← NUEVO
EXERCISEDB_API_KEY=...                   # ← NUEVO (RapidAPI)
CORS_ORIGIN=http://localhost:19006
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### mobile-app/.env (CREAR)
```env
EXPO_PUBLIC_API_URL=http://192.168.1.65:3000/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Bugs Críticos a Resolver ANTES de Continuar

- [ ] **[CRÍTICO]** `openai.service.js` líneas 39, 84, 107: template literals sin backticks → SyntaxError
- [ ] **[CRÍTICO]** Cambiar modelos deprecados: `gpt-4-vision-preview` y `gpt-4-turbo-preview` → `gpt-4o`
- [ ] **[CRÍTICO]** Agregar `OPENAI_API_KEY` al backend `.env`
- [ ] **[ALTO]** `api.service.js` línea 4: IP hardcodeada → usar `EXPO_PUBLIC_API_URL`
- [ ] **[ALTO]** Logout no invalida tokens en Redis
- [ ] **[MEDIO]** Joi instalado pero no usado → agregar validación a todos los controllers
- [ ] **[MEDIO]** Sin middleware global de errores en Express

---

## Fase 1: Setup y Backend Básico ✅ (45%)

### Completado
- [x] Estructura completa del proyecto
- [x] Repositorio Git configurado y en GitHub
- [x] Archivos de configuración (.env.example)
- [x] Schema de base de datos con Prisma (9 modelos)
- [x] Backend Express configurado
- [x] Sistema de autenticación JWT (register, login, refresh)
- [x] Middleware de autenticación
- [x] Endpoints de usuario (GET/PUT /api/v1/users/me)
- [x] Servicio de IA con OpenAI integrado (tiene bugs, ver arriba)
- [x] Proyecto React Native inicializado con Expo
- [x] Dependencias instaladas (React Navigation, Zustand, NativeWind, Axios)
- [x] App base corriendo en Expo Go
- [x] React Navigation configurado (Stack + Tabs)
- [x] Pantalla de Login con validaciones
- [x] Pantalla de Registro con validaciones
- [x] API Service con Axios e interceptors
- [x] Auth Store con Zustand
- [x] Tokens JWT con AsyncStorage
- [x] Docker configurado (PostgreSQL + Redis) → migrar a Supabase + Upstash
- [x] Migraciones de Prisma ejecutadas
- [x] Base de datos con todas las tablas
- [x] Controlador de autenticación implementado
- [x] Servidor backend corriendo (puerto 3000)
- [x] Registro y Login end-to-end funcionando
- [x] Sesión persistente funcionando
- [x] Navegación con Bottom Tabs (Inicio, Rutinas, Progreso, Perfil)
- [x] Dashboard con estadísticas y acciones rápidas
- [x] Pantalla de Progreso con gráficas y datos reales
- [x] Pantalla de Perfil de usuario
- [x] Endpoints de perfil físico (GET, POST, latest)
- [x] Cálculo automático de IMC en backend
- [x] Historial de perfiles físicos con gráficas interactivas
- [x] Gráficas (Peso, IMC, % Grasa, Músculo) con react-native-chart-kit
- [x] Diseño responsive (iOS + Android) con SafeAreaView

### Pendiente Fase 1
- [ ] Diseño UI/UX en Figma
- [ ] Sistema de diseño (colores, tipografía)

---

## Fase 2: Migración Infraestructura 🔄 (Siguiente)

**Objetivo:** Migrar de Docker a Supabase + Upstash para simplificar stack

### Tareas
- [ ] Crear proyecto en Supabase
- [ ] Correr migraciones de Prisma en Supabase (`prisma migrate deploy`)
- [ ] Actualizar `DATABASE_URL` en `.env`
- [ ] Configurar Supabase Storage (bucket para fotos de progreso)
- [ ] Crear cuenta Upstash y obtener Redis URL
- [ ] Actualizar `REDIS_URL` en `.env`
- [ ] Eliminar `docker-compose.yml` o marcarlo como legacy
- [ ] Implementar logout con blacklist de tokens en Redis
- [ ] Probar que todo sigue funcionando

---

## Fase 3: Fix de Bugs + Fundación Sólida (50%)

**Objetivo:** Dejar el backend sin deuda técnica antes de construir features

### Tareas Backend
- [ ] Arreglar backticks en `openai.service.js` (3 líneas)
- [ ] Cambiar modelos a `gpt-4o`
- [ ] Agregar `OPENAI_API_KEY` al `.env`
- [ ] Agregar middleware global de errores
- [ ] Implementar validación con Joi en todos los controllers
- [ ] Paginación en endpoint de perfiles físicos
- [ ] Agregar índices en Prisma schema (userId en todas las tablas)

### Tareas Mobile
- [ ] Pasar API URL a variable de entorno
- [ ] Pantalla de editar perfil usuario
- [ ] Crear `.env` con variables correctas

---

## Fase 4: Backend Avanzado - Rutinas (55%)

**Objetivo:** Generación de rutinas personalizadas con IA + ExerciseDB

### Stack para esta fase
- OpenAI GPT-4o → genera estructura de rutina
- ExerciseDB API → GIFs + músculos de cada ejercicio
- react-native-body-highlighter → visualización en el cuerpo

### Tareas Backend
- [ ] Registrarse en RapidAPI y obtener ExerciseDB API key
- [ ] Endpoint `POST /api/v1/routines/generate` → genera rutina con GPT-4o
- [ ] Endpoint `GET /api/v1/routines` → lista rutinas del usuario
- [ ] Endpoint `GET /api/v1/routines/:id` → detalle de rutina
- [ ] Endpoint `PUT /api/v1/routines/:id` → actualizar rutina
- [ ] Integrar ExerciseDB: enriquecer ejercicios con gifUrl + musculos
- [ ] Enriquecer JSON de ejercicios con campos: `videoUrl`, `musculos`, `musculosSecundarios`
- [ ] Implementar `routine.routes.js` (actualmente vacío)

### Tareas Mobile
- [ ] Pantalla de Rutinas completa (reemplazar placeholder)
- [ ] Visualización de músculos del día con react-native-body-highlighter
- [ ] Lista de ejercicios del día con GIF de cada uno (expo-av)
- [ ] Modal de detalle de ejercicio (GIF + series + repeticiones + notas)
- [ ] Marcar ejercicios como completados
- [ ] Resumen al terminar entrenamiento

---

## Fase 5: Nutrición con IA (65%)

**Objetivo:** Planes nutricionales personalizados

### Tareas Backend
- [ ] Endpoint `POST /api/v1/nutrition/generate` → genera plan con GPT-4o
- [ ] Endpoint `GET /api/v1/nutrition` → plan activo
- [ ] Endpoint `POST /api/v1/nutrition/log` → registrar comida del día
- [ ] Implementar `nutrition.routes.js` (actualmente vacío)

### Tareas Mobile
- [ ] Pantalla de Nutrición con plan del día
- [ ] Registro de comidas
- [ ] Macros diarios con progreso visual

---

## Fase 6: Fotos de Progreso + IA Vision (72%)

**Objetivo:** Captura y análisis corporal con GPT-4o Vision

### Tareas Backend
- [ ] Endpoint `POST /api/v1/photos/upload` → subir a Supabase Storage
- [ ] Endpoint `POST /api/v1/photos/analyze` → análisis con GPT-4o Vision
- [ ] Endpoint `GET /api/v1/photos` → historial de fotos
- [ ] Implementar `photo.routes.js` (actualmente vacío)

### Tareas Mobile
- [ ] Integrar expo-camera
- [ ] Flujo de captura (frente, lateral, espalda)
- [ ] Galería de fotos de progreso
- [ ] Comparación antes/después
- [ ] Mostrar análisis IA de composición corporal

---

## Fase 7: Chat con IA (80%)

**Objetivo:** Asistente personal de fitness disponible 24/7

### Tareas Backend
- [ ] Endpoint `POST /api/v1/chat` → chat con GPT-4o
- [ ] Endpoint `GET /api/v1/chat/history` → historial de mensajes
- [ ] Contexto del usuario en el system prompt (perfil, rutina, objetivos)
- [ ] Implementar `chat.routes.js` (actualmente vacío)

### Tareas Mobile
- [ ] Pantalla de Chat con IA
- [ ] Historial de conversación
- [ ] Respuestas en streaming (typewriter effect)

---

## Fase 8: App Tablet - Interfaz Admin Gym (90%)

**Objetivo:** Interfaz para el gym (no el cliente)

### Tareas
- [ ] Configurar navegación específica para tablet
- [ ] Pantalla de captura de fotos del cliente (3 ángulos)
- [ ] Diseño UI para tablet (landscape/portrait)
- [ ] Panel de clientes
- [ ] Asignación manual de rutinas

---

## Fase 9: Testing y Launch (100%)

- [ ] Tests unitarios (Jest)
- [ ] Tests de integración
- [ ] EAS Build para iOS (sin necesitar Mac)
- [ ] EAS Build para Android (.apk / .aab)
- [ ] Configurar dominio y backend en producción
- [ ] Variables de entorno de producción

---

## Problemas Resueltos Históricamente

1. BOM en archivos de configuración → [System.IO.File]::WriteAllText
2. Variables de entorno no cargando → require('dotenv').config() al inicio
3. Desajuste en estructura de tokens → authStore usa 'token' en lugar de 'accessToken'
4. Política de ejecución PowerShell → ExecutionPolicy configurado
5. Middleware de autenticación → req.user.userId en controllers
6. Navegación anidada → Stack Navigator dentro de Tab Navigator
7. Nombres de columnas en BD → circunferenciaBrazo, etc. (no solo brazo)
8. SafeAreaView deprecado → react-native-safe-area-context
9. useAuth undefined → export nombrado en authStore
10. Datos no actualizando → useFocusEffect para recarga automática
11. Gráfica desbordada → ScrollView horizontal con ancho dinámico
12. Module not found perfil físico → require Prisma corregido

---

## Comandos Importantes

### Mobile App
```bash
cd mobile-app
npm start                    # iniciar Expo
npx expo start -c            # limpiar caché
npm run android
npm run ios                  # requiere Mac o EAS Build
```

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev       # desarrollo local
npx prisma migrate deploy    # producción (Supabase)
npx prisma studio            # ver BD en http://localhost:5555
npm run dev
```

### Git
```bash
git status
git add .
git commit -m "mensaje"
git push origin main
```

---

## Credenciales de Prueba

**Usuario:** rrroman16@hotmail.com / Checof1@/

**Backend:** http://localhost:3000/api/v1
**Health:** http://localhost:3000/health

---

## Notas de Arquitectura

- Supabase = PostgreSQL + Storage (reemplaza Docker PG + AWS S3)
- Upstash Redis = Redis cloud (reemplaza Docker Redis)
- ExerciseDB API = fuente de GIFs y datos de músculos (1300+ ejercicios)
- react-native-body-highlighter = visualización SVG del cuerpo con músculos iluminados
- ExerciseDB + body-highlighter trabajan JUNTOS: ExerciseDB da los datos, body-highlighter los visualiza
- GPT-4o maneja texto E imágenes (reemplaza gpt-4-vision-preview y gpt-4-turbo-preview)
- Expo GO para desarrollo, EAS Build para distribución (funciona desde Windows)
- IP local desarrollo: 192.168.1.65
