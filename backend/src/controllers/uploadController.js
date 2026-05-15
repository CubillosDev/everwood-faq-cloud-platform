const { uploadFile } = require('../services/storageService');
const { saveUploadRecord } = require('../services/conversationService');
const { generateFaqSuggestions, saveFaqs } = require('../services/faqService');
const { parseFile } = require('../utils/fileParser');
const { getExtension } = require('../utils/helpers');

/**
 * POST /api/upload
 * Recibe el archivo, lo sube a Supabase Storage,
 * guarda metadatos en la DB y genera FAQs automáticamente.
 */
async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Selecciona un archivo antes de iniciar la carga.' });
    }

    const { responsible, status, observations } = req.body;

    if (!responsible || responsible.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Ingresa el responsable o equipo encargado de esta carga.' });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const ext = getExtension(originalname);

    // 1. Subir archivo a Supabase Storage
    const { path: storagePath, publicUrl } = await uploadFile(buffer, originalname, mimetype);

    // 2. Guardar metadatos en la tabla uploads
    const uploadRecord = await saveUploadRecord({
      fileName: originalname,
      fileType: ext,
      fileSize: size,
      storagePath,
      publicUrl,
      responsible: responsible.trim(),
      status: status || 'completado',
      observations: observations || null,
    });

    // 3. Parsear el archivo y generar FAQs en segundo plano
    try {
      const parsed = parseFile(buffer, ext);
      const suggestions = generateFaqSuggestions(parsed.messages);
      if (suggestions.length > 0) {
        await saveFaqs(suggestions, uploadRecord.id);
      }
    } catch (faqError) {
      // Las FAQs son opcionales — no rompen la respuesta principal
      console.warn('⚠️ FAQs no generadas:', faqError.message);
    }

    res.status(201).json({
      ok: true,
      message: 'Archivo guardado correctamente.',
      data: uploadRecord,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleUpload };
