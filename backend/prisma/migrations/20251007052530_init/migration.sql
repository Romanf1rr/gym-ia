-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "telefono" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "genero" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'cliente',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles_fisicos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "altura" DOUBLE PRECISION NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "imc" DOUBLE PRECISION,
    "porcentaje_grasa" DOUBLE PRECISION,
    "masa_muscular" DOUBLE PRECISION,
    "circunferencia_brazo" DOUBLE PRECISION,
    "circunferencia_pecho" DOUBLE PRECISION,
    "circunferencia_cintura" DOUBLE PRECISION,
    "circunferencia_cadera" DOUBLE PRECISION,
    "circunferencia_muslo" DOUBLE PRECISION,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfiles_fisicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_progreso" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "foto_frente_url" TEXT NOT NULL,
    "foto_lateral_url" TEXT NOT NULL,
    "foto_espalda_url" TEXT NOT NULL,
    "mediciones" JSONB,
    "analisis_ia" JSONB,
    "peso" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_progreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "objetivo_principal" TEXT NOT NULL,
    "peso_objetivo" DOUBLE PRECISION,
    "fecha_objetivo" TIMESTAMP(3),
    "nivel_actividad" TEXT NOT NULL,
    "dias_semana" INTEGER NOT NULL,
    "nivel_experiencia" TEXT NOT NULL,
    "limitaciones" TEXT,
    "preferencias" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "dias_semana" INTEGER NOT NULL,
    "duracion_semanas" INTEGER NOT NULL,
    "nivel_dificultad" TEXT NOT NULL,
    "ejercicios" JSONB NOT NULL,
    "generada_por_ia" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrenamientos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rutina_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "duracion" INTEGER,
    "ejercicios" JSONB NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrenamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_nutricionales" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "calorias_diarias" INTEGER NOT NULL,
    "proteinas" DOUBLE PRECISION NOT NULL,
    "carbohidratos" DOUBLE PRECISION NOT NULL,
    "grasas" DOUBLE PRECISION NOT NULL,
    "comidas" JSONB NOT NULL,
    "restricciones" TEXT,
    "preferencias" TEXT,
    "generado_por_ia" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_nutricionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_comida" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_nutricional_id" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_comida" TEXT NOT NULL,
    "alimentos" JSONB NOT NULL,
    "calorias_total" INTEGER NOT NULL,
    "proteinas_total" DOUBLE PRECISION NOT NULL,
    "carbohidratos_total" DOUBLE PRECISION NOT NULL,
    "grasas_total" DOUBLE PRECISION NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_comida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_chat" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "perfiles_fisicos" ADD CONSTRAINT "perfiles_fisicos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_progreso" ADD CONSTRAINT "fotos_progreso_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrenamientos" ADD CONSTRAINT "entrenamientos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrenamientos" ADD CONSTRAINT "entrenamientos_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "rutinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_nutricionales" ADD CONSTRAINT "planes_nutricionales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_comida" ADD CONSTRAINT "registros_comida_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_comida" ADD CONSTRAINT "registros_comida_plan_nutricional_id_fkey" FOREIGN KEY ("plan_nutricional_id") REFERENCES "planes_nutricionales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
