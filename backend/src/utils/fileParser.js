/**
 * Parsea el buffer del archivo según su extensión.
 * Devuelve un array de mensajes estandarizado o el texto crudo.
 */
function parseFile(buffer, extension) {
  const content = buffer.toString('utf-8');

  if (extension === 'json') {
    try {
      const parsed = JSON.parse(content);
      // Soporta el formato { mensajes: [...] } o un array directo
      if (parsed.mensajes && Array.isArray(parsed.mensajes)) {
        return { type: 'json', messages: parsed.mensajes, metadata: parsed.metadata || {} };
      }
      if (Array.isArray(parsed)) {
        return { type: 'json', messages: parsed, metadata: {} };
      }
      return { type: 'json', messages: [], raw: content, metadata: {} };
    } catch {
      throw Object.assign(new Error('El archivo JSON no tiene un formato válido.'), { status: 400 });
    }
  }

  if (extension === 'csv') {
    const lines = content.split('\n').filter(Boolean);
    return { type: 'csv', messages: lines, raw: content };
  }

  if (extension === 'txt') {
    const lines = content.split('\n').filter(Boolean);
    return { type: 'txt', messages: lines, raw: content };
  }

  throw Object.assign(new Error('Formato no soportado. Usa CSV, JSON o TXT.'), { status: 400 });
}

module.exports = { parseFile };
