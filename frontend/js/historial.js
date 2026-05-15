import { getConversations, getConversationById } from './api.js';

const tbody = document.getElementById('table-body');
const emptyState = document.getElementById('empty-state');
const filterStatus = document.getElementById('filter-status');
const filterType = document.getElementById('filter-type');
const searchInput = document.getElementById('search-input');

let allUploads = [];

async function loadData() {
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text2)">Cargando...</td></tr>`;
  try {
    allUploads = await getConversations();
    renderTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--red)">Error: ${err.message}</td></tr>`;
  }
}

function renderTable() {
  const q = (searchInput.value || '').toLowerCase();
  const fs = filterStatus.value;
  const ft = filterType.value;

  const filtered = allUploads.filter(u =>
    (!fs || u.status === fs) &&
    (!ft || u.file_type === ft) &&
    (!q || u.file_name.toLowerCase().includes(q) || u.responsible.toLowerCase().includes(q))
  );

  if (!filtered.length) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="file-cell">
          <div class="file-badge ft-${safeFileType(u.file_type)}">${safeFileType(u.file_type).toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:600">${escapeHTML(u.file_name)}</div>
            <div style="font-size:11px;color:var(--text2)">${formatSize(u.file_size)}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text2)">${safeFileType(u.file_type).toUpperCase()}</td>
      <td style="color:var(--text2)">${formatSize(u.file_size)}</td>
      <td style="color:var(--text2)">${formatDate(u.uploaded_at)}</td>
      <td>${escapeHTML(u.responsible)}</td>
      <td>${statusBadge(u.status)}</td>
      <td>
        <button class="btn-secondary btn-sm" onclick="openDetail('${u.id}')">Ver</button>
      </td>
    </tr>`).join('');
}

window.openDetail = async function (id) {
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-content');
  modal.style.display = 'flex';
  content.innerHTML = '<p style="color:var(--text2);text-align:center;padding:20px">Cargando...</p>';
  try {
    const u = await getConversationById(id);
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px">
        <div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">Archivo</div><div style="font-weight:600">${escapeHTML(u.file_name)}</div></div>
        <div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">Tipo</div><div>${safeFileType(u.file_type).toUpperCase()}</div></div>
        <div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">Tamaño</div><div>${formatSize(u.file_size)}</div></div>
        <div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">Fecha</div><div>${formatDate(u.uploaded_at)}</div></div>
        <div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">Responsable</div><div>${escapeHTML(u.responsible)}</div></div>
        <div><div style="font-size:11px;color:var(--text2);margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">Estado</div><div>${statusBadge(u.status)}</div></div>
      </div>
      ${u.observations ? `<div style="margin-top:14px;padding:12px;background:var(--bg3);border-radius:var(--radius-sm)"><div style="font-size:11px;color:var(--text2);margin-bottom:4px">OBSERVACIONES</div><div style="font-size:13px">${escapeHTML(u.observations)}</div></div>` : ''}
      ${safeUrl(u.public_url) ? `<div style="margin-top:14px"><a href="${safeUrl(u.public_url)}" target="_blank" rel="noopener noreferrer" style="color:var(--yellow);font-size:13px">↗ Ver archivo en la nube</a></div>` : ''}`;
  } catch (err) {
    content.innerHTML = `<p style="color:var(--red)">Error: ${err.message}</p>`;
  }
};

window.closeDetail = function () {
  document.getElementById('detail-modal').style.display = 'none';
};

// Filters
filterStatus.addEventListener('change', renderTable);
filterType.addEventListener('change', renderTable);
searchInput.addEventListener('input', renderTable);

// Helpers
function formatSize(b) {
  if (!b) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return Math.round(b / 1024) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(s) {
  const map = {
    completado: 'badge-ok',
    pendiente: 'badge-pend',
    procesando: 'badge-pend',
    error: 'badge-err',
  };
  return `<span class="badge ${map[s] || 'badge-info'}">${escapeHTML(s || 'desconocido')}</span>`;
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeFileType(type) {
  return ['csv', 'json', 'txt'].includes(type) ? type : 'txt';
}

function safeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? escapeHTML(parsed.href) : '';
  } catch {
    return '';
  }
}

loadData();
