const supabase = require('../config/supabase');

const TABLE = 'uploads';

/**
 * Guarda los metadatos de una carga en la base de datos.
 */
async function saveUploadRecord(data) {
  const record = {
    file_name: data.fileName,
    file_type: data.fileType,
    file_size: data.fileSize,
    storage_path: data.storagePath,
    public_url: data.publicUrl,
    responsible: data.responsible,
    status: data.status || 'completado',
    observations: data.observations || null,
    uploaded_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(record)
    .select()
    .single();

  if (error) {
    throw Object.assign(
      new Error(`Error al guardar metadatos: ${error.message}`),
      { status: 500 }
    );
  }

  return inserted;
}

/**
 * Devuelve todos los registros de cargas, del más reciente al más antiguo.
 */
async function getAllUploads() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) throw new Error(`Error al obtener historial: ${error.message}`);
  return data;
}

/**
 * Devuelve un registro por su ID.
 */
async function getUploadById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw Object.assign(new Error('Registro no encontrado'), { status: 404 });
  }
  return data;
}

/**
 * Actualiza el estado de una carga.
 */
async function updateUploadStatus(id, status) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar estado: ${error.message}`);
  return data;
}

module.exports = {
  saveUploadRecord,
  getAllUploads,
  getUploadById,
  updateUploadStatus,
};
