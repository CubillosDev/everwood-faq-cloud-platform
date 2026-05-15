/**
 * Formatea bytes a una cadena legible (KB, MB)
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Extrae la extensión limpia de un nombre de archivo
 */
function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

module.exports = { formatSize, getExtension };
