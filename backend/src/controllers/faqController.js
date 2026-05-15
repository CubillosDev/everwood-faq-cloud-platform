const { getAllFaqs, updateFaqStatus } = require('../services/faqService');

/**
 * GET /api/faqs
 * Devuelve todas las FAQs. Filtro opcional: ?status=pendiente
 */
async function listFaqs(req, res, next) {
  try {
    const { status } = req.query;
    const faqs = await getAllFaqs(status || null);
    res.json({ ok: true, data: faqs });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/faqs/:id
 * Actualiza el estado y/o respuesta de una FAQ.
 * Body: { status: 'aprobada' | 'rechazada' | 'editada', answer?: string }
 */
async function patchFaq(req, res, next) {
  try {
    const { status, answer } = req.body;
    const VALID = ['aprobada', 'rechazada', 'editada', 'pendiente'];
    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ ok: false, error: `Estado inválido. Usa: ${VALID.join(', ')}` });
    }
    const updated = await updateFaqStatus(req.params.id, status, answer || null);
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { listFaqs, patchFaq };
