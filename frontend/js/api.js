// =============================================
// EVERWOOD — API Client
// Todas las llamadas al backend en un solo lugar.
// Cambia BASE_URL al desplegar.
// =============================================

const BASE_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.error || 'Error en la petición');
  return json.data;
}

// UPLOAD
export async function uploadFile(formData) {
  const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.error || 'Error al subir el archivo');
  return json.data;
}

// CONVERSATIONS
export async function getConversations() {
  return request('/conversations');
}

export async function getConversationById(id) {
  return request(`/conversations/${id}`);
}

export async function updateStatus(id, status) {
  return request(`/conversations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// FAQS
export async function getFaqs(status = null) {
  const qs = status ? `?status=${status}` : '';
  return request(`/faqs${qs}`);
}

export async function updateFaq(id, status, answer = null) {
  return request(`/faqs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, answer }),
  });
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
