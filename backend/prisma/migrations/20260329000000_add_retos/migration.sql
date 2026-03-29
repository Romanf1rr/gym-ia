CREATE TABLE "retos" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "titulo"       TEXT NOT NULL,
  "descripcion"  TEXT NOT NULL,
  "tipo"         TEXT NOT NULL,
  "meta"         DOUBLE PRECISION NOT NULL,
  "unidad"       TEXT NOT NULL,
  "premio"       TEXT NOT NULL,
  "imagen"       TEXT,
  "fecha_inicio" TIMESTAMP(3) NOT NULL,
  "fecha_fin"    TIMESTAMP(3) NOT NULL,
  "activo"       BOOLEAN NOT NULL DEFAULT true,
  "creado_por"   TEXT NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "retos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "retos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "participaciones_reto" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "reto_id"          TEXT NOT NULL,
  "user_id"          TEXT NOT NULL,
  "progreso"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completado"       BOOLEAN NOT NULL DEFAULT false,
  "fecha_completado" TIMESTAMP(3),
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "participaciones_reto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "participaciones_reto_reto_id_fkey" FOREIGN KEY ("reto_id") REFERENCES "retos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "participaciones_reto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "participaciones_reto_reto_id_user_id_key" UNIQUE ("reto_id", "user_id")
);
