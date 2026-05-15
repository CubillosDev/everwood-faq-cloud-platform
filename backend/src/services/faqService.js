const supabase = require('../config/supabase');

const TABLE = 'faqs';

// Categorías y palabras clave para clasificación básica
const CATEGORIES = {
  envio: ['envío', 'envio', 'entrega', 'demora', 'tiempo', 'despacho', 'llega', 'días', 'rastreo', 'guía', 'domicilio'],
  pago: ['pago', 'precio', 'costo', 'tarjeta', 'transferencia', 'contra entrega', 'efectivo', 'descuento', 'cobro'],
  devolucion: ['devolucion', 'devolución', 'cambio', 'garantía', 'garantia', 'defecto', 'dañado', 'reembolso'],
  producto: ['madera', 'producto', 'tipo', 'material', 'medida', 'corte', 'calidad', 'stock', 'disponible'],
  soporte: ['problema', 'ayuda', 'soporte', 'error', 'falla', 'queja', 'inconveniente', 'contacto', 'agente'],
};

/**
 * Clasifica un texto según palabras clave.
 */
function classifyText(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'general';
}

/**
 * Genera sugerencias de FAQs a partir de los mensajes de una conversación.
 * Versión sin IA real: agrupa por categoría y propone preguntas frecuentes.
 */
function generateFaqSuggestions(messages) {
  const byCategory = {};

  for (const msg of messages) {
    const text = typeof msg === 'string' ? msg : msg.texto || msg.text || JSON.stringify(msg);
    const cat = classifyText(text);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(text);
  }

  const suggestions = [];

  const templates = {
    envio: { q: '¿Cuánto tiempo tarda el envío?', a: 'Los envíos demoran entre 3 y 5 días hábiles según la zona.' },
    pago: { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjeta, transferencia y pago contra entrega.' },
    devolucion: { q: '¿Cómo hago una devolución?', a: 'Tienes 15 días para reportar cualquier inconveniente con tu pedido.' },
    producto: { q: '¿Qué tipos de productos tienen disponibles?', a: 'Contamos con amplio catálogo. Consulta en nuestra tienda.' },
    soporte: { q: '¿Cómo contacto al equipo de soporte?', a: 'Puedes escribirnos por WhatsApp o al correo de soporte.' },
    general: { q: '¿Cómo puedo obtener más información?', a: 'Contáctanos directamente y con gusto te ayudamos.' },
  };

  for (const cat of Object.keys(byCategory)) {
    if (templates[cat]) {
      suggestions.push({
        question: templates[cat].q,
        answer: templates[cat].a,
        category: cat,
        confidence: +(0.7 + Math.random() * 0.25).toFixed(2),
        status: 'pendiente',
      });
    }
  }

  return suggestions;
}

/**
 * Guarda las sugerencias de FAQs en la base de datos.
 */
async function saveFaqs(faqs, uploadId) {
  const records = faqs.map((faq) => ({
    ...faq,
    upload_id: uploadId,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase.from(TABLE).insert(records).select();
  if (error) throw new Error(`Error al guardar FAQs: ${error.message}`);
  return data;
}

/**
 * Devuelve todas las FAQs, con filtro opcional por estado.
 */
async function getAllFaqs(status = null) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener FAQs: ${error.message}`);
  return data;
}

/**
 * Actualiza el estado de una FAQ (pendiente / aprobada / rechazada / editada).
 */
async function updateFaqStatus(id, status, editedAnswer = null) {
  const update = { status };
  if (editedAnswer) update.answer = editedAnswer;

  const { data, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar FAQ: ${error.message}`);
  return data;
}

module.exports = {
  generateFaqSuggestions,
  saveFaqs,
  getAllFaqs,
  updateFaqStatus,
};
