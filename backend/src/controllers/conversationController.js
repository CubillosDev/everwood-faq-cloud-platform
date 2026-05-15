const {
  getAllUploads,
  getUploadById,
  updateUploadStatus,
} = require('../services/conversationService');

/**
 * GET /api/conversations
 * Devuelve el historial de todas las cargas.
 */
async function listConversations(req, res, next) {
  try {
    const uploads = await getAllUploads();
    res.json({ ok: true, data: uploads });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversations/:id
 * Devuelve el detalle de una carga específica.
 */
async function getConversation(req, res, next) {
  try {
    const upload = await getUploadById(req.params.id);
    res.json({ ok: true, data: upload });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/conversations/:id/status
 * Actualiza el estado de una carga.
 */
async function patchStatus(req, res, next) {
  try {
    const { status } = req.body;
    const VALID = ['pendiente', 'procesando', 'completado', 'error'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ ok: false, error: `Estado inválido. Usa: ${VALID.join(', ')}` });
    }
    const updated = await updateUploadStatus(req.params.id, status);
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { listConversations, getConversation, patchStatus };
