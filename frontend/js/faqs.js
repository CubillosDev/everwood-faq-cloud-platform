import { getFaqs, updateFaq } from './api.js';

let allFaqs = [];
let activeFilter = '';

const faqList = document.getElementById('faq-list');
const countApproved = document.getElementById('count-approved');
const countRejected = document.getElementById('count-rejected');
const countPending = document.getElementById('count-pending');

async function loadFaqs() {
  faqList.innerHTML = '<p style="color:var(--text2);text-align:center;padding:32px">Cargando FAQs...</p>';
  try {
    allFaqs = await getFaqs();
    renderFaqs();
    updateCounts();
  } catch (err) {
    faqList.innerHTML = `<p style="color:var(--red);text-align:center;padding:20px">Error: ${err.message}</p>`;
  }
}

function renderFaqs() {
  const data = activeFilter ? allFaqs.filter(f => f.category === activeFilter) : allFaqs;
  const pending = data.filter(f => f.status === 'pendiente');

  if (!pending.length) {
    faqList.innerHTML = `<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">Sin FAQs pendientes</div><p>Todas las sugerencias han sido revisadas.</p></div>`;
    return;
  }

  faqList.innerHTML = pending.map(f => `
    <div class="faq-card" id="faq-${f.id}">
      <div class="faq-q">❓ ${f.question}</div>
      <div class="faq-a">${f.answer}</div>
      <div class="conf-bar">
        <span class="conf-label">Confianza ${Math.round(f.confidence * 100)}%</span>
        <div class="conf-track">
          <div class="conf-fill ${f.confidence > 0.85 ? 'conf-high' : f.confidence > 0.7 ? 'conf-mid' : 'conf-low'}" style="width:${Math.round(f.confidence * 100)}%"></div>
        </div>
      </div>
      <div class="faq-footer">
        <span class="badge badge-info">${f.category || 'general'}</span>
        <div class="faq-actions">
          <button class="btn-approve" onclick="handleFaq('${f.id}', 'aprobada')">✓ Aprobar</button>
          <button class="btn-reject" onclick="handleFaq('${f.id}', 'rechazada')">✕ Rechazar</button>
        </div>
      </div>
    </div>`).join('');
}

window.handleFaq = async function (id, status) {
  try {
    await updateFaq(id, status);
    const faq = allFaqs.find(f => f.id === id);
    if (faq) faq.status = status;
    document.getElementById(`faq-${id}`).remove();
    updateCounts();
    showToast(status === 'aprobada' ? '✓ FAQ aprobada' : '✕ FAQ rechazada');
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

window.filterCategory = function (el, cat) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeFilter = cat;
  renderFaqs();
};

function updateCounts() {
  const approved = allFaqs.filter(f => f.status === 'aprobada').length;
  const rejected = allFaqs.filter(f => f.status === 'rechazada').length;
  const pending = allFaqs.filter(f => f.status === 'pendiente').length;
  if (countApproved) countApproved.textContent = approved;
  if (countRejected) countRejected.textContent = rejected;
  if (countPending) countPending.textContent = pending;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

loadFaqs();
