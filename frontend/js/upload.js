import { uploadFile } from './api.js';

const ALLOWED_EXTENSIONS = ['csv', 'json', 'txt'];

let selectedFile = null;
let parsedContent = null;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileRowWrap = document.getElementById('file-row-wrap');
const alertWrap = document.getElementById('alert-wrap');
const progressWrap = document.getElementById('progress-wrap');
const metaSection = document.getElementById('meta-section');
const btnUpload = document.getElementById('btn-upload');
const previewPanel = document.getElementById('preview-panel');

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  if (event.dataTransfer.files[0]) handleFile(event.dataTransfer.files[0]);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  const ext = getExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    selectedFile = null;
    parsedContent = null;
    showAlert('alert-wrap', 'error', 'Formato no permitido. Selecciona un archivo CSV, JSON o TXT.');
    return;
  }

  selectedFile = file;
  parsedContent = null;
  showFileRow(file, ext);
  showAlert('alert-wrap', 'success', 'Archivo listo para cargar. Completa los metadatos y envíalo a la nube.');
  metaSection.style.display = 'block';
  previewPanel.style.display = 'none';
  previewPanel.innerHTML = '';
  btnUpload.disabled = false;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      parsedContent = parsePreview(event.target.result, ext);
    } catch {
      parsedContent = {
        type: ext,
        messages: [],
        metadata: {},
        parseWarning: 'No fue posible generar una vista previa detallada, pero el archivo puede cargarse.',
      };
    }
  };
  reader.readAsText(file);
}

function showFileRow(file, ext) {
  fileRowWrap.innerHTML = `
    <div class="file-row">
      <div class="file-badge ft-${ext}">${ext.toUpperCase()}</div>
      <div class="file-info">
        <div class="file-name">${escapeHTML(file.name)}</div>
        <div class="file-meta">${formatSize(file.size)} · listo para cargar</div>
      </div>
      <span class="status-ok">✓ Archivo válido</span>
      <button class="icon-clear" onclick="resetForm()" aria-label="Quitar archivo">×</button>
    </div>`;
}

btnUpload.addEventListener('click', async () => {
  if (!selectedFile) {
    showAlert('alert-wrap', 'error', 'Selecciona un archivo antes de iniciar la carga.');
    return;
  }

  const responsible = document.getElementById('meta-resp').value.trim();
  if (!responsible) {
    showAlert('alert-wrap', 'error', 'Ingresa el responsable o equipo encargado de esta carga.');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('responsible', responsible);
  formData.append('status', document.getElementById('meta-status').value);
  formData.append('observations', document.getElementById('meta-obs').value);

  btnUpload.innerHTML = '<div class="spinner"></div> Cargando archivo...';
  btnUpload.disabled = true;
  btnUpload.classList.remove('success');

  progressWrap.style.display = 'block';
  progressWrap.innerHTML = `
    <div class="progress-wrap">
      <div class="progress-label"><span>Enviando a Supabase Storage</span><span id="pct">0%</span></div>
      <div class="progress-track"><div class="progress-fill" id="pfill" style="width:0%"></div></div>
    </div>`;

  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 16, 90);
    document.getElementById('pfill').style.width = Math.round(progress) + '%';
    document.getElementById('pct').textContent = Math.round(progress) + '%';
  }, 150);

  try {
    await uploadFile(formData);
    clearInterval(interval);
    document.getElementById('pfill').style.width = '100%';
    document.getElementById('pct').textContent = '100%';

    setTimeout(() => {
      progressWrap.style.display = 'none';
      btnUpload.classList.add('success');
      btnUpload.innerHTML = '✓ Carga completada';
      showAlert('alert-wrap', 'success', 'Archivo guardado correctamente en la nube y registrado en el historial.');
      showToast('Carga completada correctamente.');
      showPreview();
    }, 300);
  } catch (err) {
    clearInterval(interval);
    progressWrap.style.display = 'none';
    showAlert('alert-wrap', 'error', err.message || 'No se pudo completar la carga. Intenta nuevamente.');
    btnUpload.innerHTML = '↑ Subir a la nube';
    btnUpload.disabled = false;
  }
});

function showPreview() {
  const preview = parsedContent || { type: getExtension(selectedFile?.name || ''), messages: [], metadata: {} };
  const messages = preview.messages || [];
  const metadata = preview.metadata || {};
  const previewTitle = messages.length ? 'Vista previa de la conversación' : 'Archivo cargado correctamente';
  const previewSub = [
    labelForType(preview.type),
    metadata.cliente,
    metadata.fecha_inicio,
  ].filter(Boolean).join(' · ');

  previewPanel.style.display = 'block';
  previewPanel.innerHTML = `
    <div class="card upload-card preview-card">
      <div class="card-title">${previewTitle}</div>
      <div class="card-sub">${escapeHTML(previewSub || 'Resumen del archivo procesado')}</div>
      ${preview.parseWarning ? `<div class="alert alert-info">${escapeHTML(preview.parseWarning)}</div>` : ''}
      ${messages.length ? renderChat(messages) : renderPreviewEmpty()}
      <div class="preview-stats">
        <div><strong>${messages.length}</strong><span>Mensajes detectados</span></div>
        <div><strong>${messages.filter((msg) => msg.rol === 'cliente').length}</strong><span>Del cliente</span></div>
        <div><strong>${messages.filter((msg) => msg.rol === 'agente').length}</strong><span>Del equipo</span></div>
      </div>
    </div>`;
  previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderChat(messages) {
  return `
    <div class="chat-window">
      ${messages.slice(0, 80).map((msg) => `
        <div class="msg ${safeRole(msg.rol)}">
          <div class="msg-name">${escapeHTML(msg.nombre || roleLabel(msg.rol))}</div>
          <div class="bubble">${escapeHTML(msg.texto || '')}</div>
          <div class="msg-time">${escapeHTML(msg.hora || msg.fecha || '')}</div>
        </div>`).join('')}
    </div>`;
}

function renderPreviewEmpty() {
  return `
    <div class="preview-empty">
      El archivo se cargó correctamente. No se detectaron mensajes estructurados para mostrar en la vista previa.
    </div>`;
}

window.resetForm = function () {
  selectedFile = null;
  parsedContent = null;
  fileInput.value = '';
  fileRowWrap.innerHTML = '';
  alertWrap.innerHTML = '';
  progressWrap.innerHTML = '';
  progressWrap.style.display = 'none';
  metaSection.style.display = 'none';
  previewPanel.style.display = 'none';
  previewPanel.innerHTML = '';
  btnUpload.innerHTML = '↑ Subir a la nube';
  btnUpload.classList.remove('success');
  btnUpload.disabled = true;
  document.getElementById('meta-resp').value = '';
  document.getElementById('meta-obs').value = '';
};

function parsePreview(content, ext) {
  if (ext === 'json') return parseJsonPreview(content);
  if (ext === 'csv') return parseCsvPreview(content);
  if (ext === 'txt') return parseTxtPreview(content);
  return { type: ext, messages: [], metadata: {} };
}

function parseJsonPreview(content) {
  const parsed = JSON.parse(content);
  const rawMessages = Array.isArray(parsed) ? parsed : parsed.mensajes || [];
  return {
    type: 'json',
    metadata: parsed.metadata || {},
    messages: rawMessages.map((msg) => normalizeMessage(msg)).filter((msg) => msg.texto),
  };
}

function parseCsvPreview(content) {
  const rows = parseCsvRows(content).filter((row) => row.some(Boolean));
  if (rows.length < 2) return { type: 'csv', metadata: {}, messages: [] };

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const messages = rows.slice(1).map((row) => {
    const item = Object.fromEntries(headers.map((header, index) => [header, row[index] || '']));
    return normalizeMessage({
      fecha: item.fecha,
      hora: item.hora,
      rol: item.rol,
      nombre: item.nombre,
      texto: item.texto || item.mensaje || item.message,
    });
  }).filter((msg) => msg.texto);

  return { type: 'csv', metadata: {}, messages };
}

function parseTxtPreview(content) {
  const messages = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseTxtLine)
    .filter((msg) => msg.texto);

  return { type: 'txt', metadata: {}, messages };
}

function parseTxtLine(line) {
  const match = line.match(/^\[(?<date>[^\]]+)\]\s*(?<role>Cliente|Agente|cliente|agente)\s*-\s*(?<name>[^:]+):\s*(?<text>.+)$/);
  if (match?.groups) {
    return normalizeMessage({
      fecha: match.groups.date,
      rol: match.groups.role,
      nombre: match.groups.name,
      texto: match.groups.text,
    });
  }

  return normalizeMessage({ rol: 'cliente', nombre: 'Mensaje', texto: line });
}

function normalizeMessage(msg) {
  if (typeof msg === 'string') return { rol: 'cliente', nombre: 'Mensaje', texto: msg, hora: '' };
  const rol = safeRole(String(msg.rol || msg.role || '').toLowerCase());
  return {
    rol,
    nombre: msg.nombre || msg.name || roleLabel(rol),
    texto: msg.texto || msg.text || msg.message || '',
    hora: msg.hora || msg.time || '',
    fecha: msg.fecha || msg.date || '',
  };
}

function parseCsvRows(content) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function getExtension(fileName) {
  return fileName.split('.').pop().toLowerCase();
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function showAlert(wrapperId, type, msg) {
  const icons = { success: '✓', error: '!', info: 'i' };
  document.getElementById(wrapperId).innerHTML = `
    <div class="alert alert-${type}">
      <span class="alert-icon">${icons[type] || 'i'}</span>
      <span>${escapeHTML(msg)}</span>
    </div>`;
}

window.showToast = function (msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
};

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeRole(role) {
  return role === 'agente' ? 'agente' : 'cliente';
}

function roleLabel(role) {
  return role === 'agente' ? 'Equipo' : 'Cliente';
}

function labelForType(type) {
  const labels = { json: 'Archivo JSON', csv: 'Archivo CSV', txt: 'Archivo TXT' };
  return labels[type] || 'Archivo';
}
