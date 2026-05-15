import { uploadFile } from './api.js';

let selectedFile = null;
let parsedContent = null;

// DOM refs
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileRowWrap = document.getElementById('file-row-wrap');
const alertWrap = document.getElementById('alert-wrap');
const progressWrap = document.getElementById('progress-wrap');
const metaSection = document.getElementById('meta-section');
const btnUpload = document.getElementById('btn-upload');
const previewPanel = document.getElementById('preview-panel');

// Drag & Drop
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'json', 'txt'].includes(ext)) {
    showAlert('alertWrap', 'error', 'Formato no válido. Solo se aceptan archivos CSV, JSON o TXT.');
    return;
  }
  selectedFile = file;
  showFileRow(file, ext);
  showAlert('alertWrap', 'success', 'Archivo válido. Completa los metadatos y sube a la nube.');
  metaSection.style.display = 'block';
  btnUpload.disabled = false;

  if (ext === 'json') {
    const reader = new FileReader();
    reader.onload = e => {
      try { parsedContent = JSON.parse(e.target.result); } catch { parsedContent = null; }
    };
    reader.readAsText(file);
  } else {
    parsedContent = null;
  }
}

function showFileRow(file, ext) {
  fileRowWrap.innerHTML = `
    <div class="file-row">
      <div class="file-badge ft-${ext}">${ext.toUpperCase()}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-meta">${formatSize(file.size)}</div>
      </div>
      <span class="status-ok">✓ Válido</span>
      <button onclick="resetForm()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px;line-height:1">×</button>
    </div>`;
}

// Upload
btnUpload.addEventListener('click', async () => {
  if (!selectedFile) return;
  const responsible = document.getElementById('meta-resp').value.trim();
  if (!responsible) { showAlert('alertWrap', 'error', 'El campo Responsable es requerido.'); return; }

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('responsible', responsible);
  formData.append('status', document.getElementById('meta-status').value);
  formData.append('observations', document.getElementById('meta-obs').value);

  btnUpload.innerHTML = '<div class="spinner"></div> Subiendo...';
  btnUpload.disabled = true;

  progressWrap.style.display = 'block';
  progressWrap.innerHTML = `
    <div class="progress-wrap">
      <div class="progress-label"><span>Subiendo archivo...</span><span id="pct">0%</span></div>
      <div class="progress-track"><div class="progress-fill" id="pfill" style="width:0%"></div></div>
    </div>`;

  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(p + Math.random() * 18, 90);
    document.getElementById('pfill').style.width = Math.round(p) + '%';
    document.getElementById('pct').textContent = Math.round(p) + '%';
  }, 150);

  try {
    const data = await uploadFile(formData);
    clearInterval(iv);
    document.getElementById('pfill').style.width = '100%';
    document.getElementById('pct').textContent = '100%';

    setTimeout(() => {
      progressWrap.style.display = 'none';
      btnUpload.innerHTML = '✓ ¡Subido exitosamente!';
      btnUpload.style.background = 'var(--green-bg)';
      btnUpload.style.color = '#4ADE80';
      btnUpload.style.border = '1px solid var(--green-border)';
      showToast('Archivo subido y guardado en la nube ☁️');
      showPreview();
    }, 300);
  } catch (err) {
    clearInterval(iv);
    progressWrap.style.display = 'none';
    showAlert('alertWrap', 'error', err.message);
    btnUpload.innerHTML = '↑ Subir a la nube';
    btnUpload.disabled = false;
  }
});

function showPreview() {
  previewPanel.style.display = 'block';
  if (parsedContent && parsedContent.mensajes) {
    const m = parsedContent.metadata || {};
    const msgs = parsedContent.mensajes;
    previewPanel.innerHTML = `
      <div class="card" style="margin-top:24px">
        <div class="card-title">Vista previa de la conversación</div>
        <div class="card-sub">${m.canal || 'WhatsApp'} · ${m.cliente || ''} · ${m.fecha_inicio || ''}</div>
        <div class="chat-window">
          ${msgs.map(msg => `
            <div class="msg ${msg.rol}">
              <div class="msg-name">${msg.nombre || msg.rol}</div>
              <div class="bubble">${msg.texto}</div>
              <div class="msg-time">${msg.hora || ''}</div>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:24px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
          <div><div style="font-size:22px;font-weight:800;color:var(--yellow)">${msgs.length}</div><div style="font-size:11px;color:var(--text2)">Mensajes</div></div>
          <div><div style="font-size:22px;font-weight:800;color:var(--yellow)">${msgs.filter(x=>x.rol==='cliente').length}</div><div style="font-size:11px;color:var(--text2)">Del cliente</div></div>
          <div><div style="font-size:22px;font-weight:800;color:${m.resuelto?'#4ADE80':'var(--red)'}">${m.resuelto?'✓':'✗'}</div><div style="font-size:11px;color:var(--text2)">Resuelto</div></div>
        </div>
      </div>`;
    previewPanel.scrollIntoView({ behavior: 'smooth' });
  } else {
    previewPanel.innerHTML = `
      <div class="card" style="margin-top:24px">
        <div class="card-title">Archivo cargado correctamente</div>
        <div class="card-sub">La vista previa completa está disponible solo para archivos JSON en formato Everwod.</div>
      </div>`;
  }
}

window.resetForm = function () {
  selectedFile = null; parsedContent = null;
  fileInput.value = '';
  fileRowWrap.innerHTML = '';
  alertWrap.innerHTML = '';
  progressWrap.innerHTML = '';
  progressWrap.style.display = 'none';
  metaSection.style.display = 'none';
  previewPanel.style.display = 'none';
  previewPanel.innerHTML = '';
  btnUpload.innerHTML = '↑ Subir a la nube';
  btnUpload.disabled = true;
  btnUpload.style.background = '';
  btnUpload.style.color = '';
  btnUpload.style.border = '';
  document.getElementById('meta-resp').value = '';
  document.getElementById('meta-obs').value = '';
};

// Helpers
function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return Math.round(b / 1024) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function showAlert(wrapperId, type, msg) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  document.getElementById(wrapperId).innerHTML = `
    <div class="alert alert-${type}">${icons[type]} ${msg}</div>`;
}

window.showToast = function (msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
};
