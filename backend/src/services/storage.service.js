const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'progress-photos';

// Inicialización lazy — no falla al arrancar si la key aún no está configurada
let _supabase = null;
const getClient = () => {
  if (!_supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas para subir fotos');
    }
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _supabase;
};

const storageService = {
  // Sube una foto al bucket y devuelve la URL pública
  async uploadPhoto(fileBuffer, fileName, mimeType) {
    const supabase = getClient();
    const path = `${Date.now()}_${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, fileBuffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Error subiendo foto: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  // Elimina una foto del bucket
  async deletePhoto(url) {
    const supabase = getClient();
    const path = url.split(`${BUCKET}/`)[1];
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
  },
};

module.exports = storageService;
