/**
 * Script: Descarga masiva de GIFs de ExerciseDB → Supabase Storage
 *
 * Uso: node src/scripts/downloadExerciseGifs.js
 *
 * Qué hace:
 * 1. Obtiene todos los ejercicios de ExerciseDB (~1300)
 * 2. Para cada uno descarga el GIF (resolución 360)
 * 3. Sube el GIF al bucket "exercise-gifs" de Supabase Storage
 * 4. Guarda/actualiza la URL pública en la tabla ejercicios_cache
 *
 * Pausa 300ms entre descargas para no saturar la API.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const RAPIDAPI_KEY = process.env.EXERCISEDB_API_KEY;
const RAPIDAPI_HOST = 'exercisedb.p.rapidapi.com';
const BUCKET = 'exercise-assets';
const DELAY_MS = 300;
const PAGE_SIZE = 10; // El plan Basic de ExerciseDB devuelve máximo 10 por request

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJSON = (path) =>
  new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: RAPIDAPI_HOST,
      path,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse error: ' + data.substring(0, 100))); }
      });
    });
    req.on('error', reject);
    req.end();
  });

const downloadGif = (exerciseId) =>
  new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: RAPIDAPI_HOST,
      path: `/image?exerciseId=${exerciseId}&resolution=360`,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} para exerciseId=${exerciseId}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.end();
  });

// ─── Obtener todos los ejercicios paginando ─────────────────────────────────

async function getAllExercises() {
  let all = [];
  let offset = 0;

  console.log('📋 Obteniendo lista de ejercicios de ExerciseDB...');

  while (true) {
    const data = await fetchJSON(`/exercises?limit=${PAGE_SIZE}&offset=${offset}`);
    const lista = Array.isArray(data) ? data
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.exercises) ? data.exercises
      : null;

    if (!lista || lista.length === 0) break;

    all = all.concat(lista);
    console.log(`  → ${all.length} ejercicios obtenidos...`);

    if (lista.length === 0) break;
    offset += PAGE_SIZE;
    await sleep(200);
  }

  return all;
}

// ─── Subir GIF a Supabase Storage ───────────────────────────────────────────

async function uploadToSupabase(exerciseId, gifBuffer) {
  const fileName = `${exerciseId}.gif`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, gifBuffer, {
      contentType: 'image/gif',
      upsert: true,
    });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── Guardar en ejercicios_cache ─────────────────────────────────────────────

async function saveToCache(nombre, exerciseId, publicUrl, exercise) {
  const musculos = exercise.target ? [exercise.target] : [];
  const musculosSecundarios = exercise.secondaryMuscles || [];

  await prisma.ejercicioCache.upsert({
    where: { nombre },
    update: { gifUrl: publicUrl },
    create: {
      nombre,
      gifUrl: publicUrl,
      musculos,
      musculosSecundarios,
      equipamiento: exercise.equipment || null,
      bodyPart: exercise.bodyPart || null,
    },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error('❌ EXERCISEDB_API_KEY no configurada en .env');
    process.exit(1);
  }

  console.log('🚀 Iniciando descarga masiva de GIFs de ExerciseDB\n');

  // Verificar que el bucket existe
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    console.log(`📦 Creando bucket "${BUCKET}"...`);
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) {
      console.error('❌ Error creando bucket:', error.message);
      process.exit(1);
    }
    console.log(`✅ Bucket "${BUCKET}" creado\n`);
  } else {
    console.log(`✅ Bucket "${BUCKET}" ya existe\n`);
  }

  // Obtener ejercicios ya procesados para poder resumir
  const yaEnCache = await prisma.ejercicioCache.findMany({
    where: { gifUrl: { startsWith: 'https://aywvdpziblrjbhvfosal.supabase.co' } },
    select: { nombre: true },
  });
  const nombresProcesados = new Set(yaEnCache.map((e) => e.nombre));
  console.log(`📁 Ya en Supabase: ${nombresProcesados.size} ejercicios\n`);

  // Obtener lista completa
  const exercises = await getAllExercises();
  console.log(`\n✅ Total ejercicios a procesar: ${exercises.length}\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const nombre = ex.name?.toLowerCase().trim();
    if (!nombre || !ex.id) { skip++; continue; }

    // Saltar si ya está en Supabase
    if (nombresProcesados.has(nombre)) {
      skip++;
      if (skip % 50 === 0) console.log(`⏭  Saltados: ${skip}`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${exercises.length}] ${nombre} (${ex.id})... `);

    try {
      const gifBuffer = await downloadGif(ex.id);
      const publicUrl = await uploadToSupabase(ex.id, gifBuffer);
      await saveToCache(nombre, ex.id, publicUrl, ex);
      ok++;
      console.log(`✅ (${(gifBuffer.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      fail++;
      console.log(`❌ ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Descargados:  ${ok}`);
  console.log(`⏭  Saltados:     ${skip}`);
  console.log(`❌ Fallidos:     ${fail}`);
  console.log(`Total:           ${exercises.length}`);
  console.log('─'.repeat(50));
  console.log('\n🎉 Descarga completada. Los GIFs están en Supabase Storage.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
