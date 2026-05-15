const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const BUCKET = 'conversations';

/**
 * Sube un archivo al bucket de Supabase Storage.
 * Devuelve la ruta pública del archivo.
 */
async function uploadFile(buffer, originalName, mimeType) {
  const ext = originalName.split('.').pop().toLowerCase();
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    const isRlsError = /row-level security/i.test(error.message);
    const message = isRlsError
      ? 'Supabase Storage bloqueó la carga por RLS. Agrega SUPABASE_SERVICE_ROLE_KEY en backend/.env o ejecuta backend/supabase-policies.sql en Supabase SQL Editor.'
      : `Error al subir el archivo a la nube: ${error.message}`;

    throw Object.assign(
      new Error(message),
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: data.publicUrl,
    fileName,
  };
}

/**
 * Elimina un archivo del bucket por su path
 */
async function deleteFile(filePath) {
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw new Error(`Error al eliminar archivo: ${error.message}`);
}

module.exports = { uploadFile, deleteFile };
