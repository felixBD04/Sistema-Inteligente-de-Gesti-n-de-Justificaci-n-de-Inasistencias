const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTx5wMHyzgKJIfdQhRB_hmCc_uxftRTKgl21hFc-vfwPxdTf_eoqv-tWQIuOBuzkAJ-3jTMggP3ShHl/pub?output=csv&gid=1198437236";

const DECISION_WEBHOOK_URL =
  "https://felix04.app.n8n.cloud/webhook/368f339f-fed8-4a70-94b0-a84f7870174f";

let allRows = [];

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('btn-refresh')?.addEventListener('click', loadData);
  document.getElementById('search-input')?.addEventListener('input', (e) => renderTable(filterRows(e.target.value)));
});

async function loadData() {
  setLoading(true);
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();
    allRows = parseCSV(text);
    renderStats(allRows);
    renderTable(allRows);
  } catch (err) {
    console.error(err);
    showTableError();
    showToast('Error al cargar los datos', 'error');
  } finally {
    setLoading(false);
  }
}

function parseCSV(text) {
  const lines = text.split('\n').slice(1).filter(l => l.trim());
  return lines.map((line, index) => {
    const cols = line.split(',');
    return {
      rowIndex: index + 2,
      fecha: (cols[0] || '').replace(/\r/g, ''),
      nombre: cols[2] || '—',
      correo: cols[4] || '—',
      motivo: cols[5] || 'Sin motivo',
      razonIA: cols[6] || 'No disponible',
      fileId: (cols[7] || '').trim().replace(/\r/g, ''),
      decision: null
    };
  });
}

function filterRows(query) {
  const q = query.toLowerCase();
  return allRows.filter(r =>
    r.nombre.toLowerCase().includes(q) ||
    r.correo.toLowerCase().includes(q) ||
    r.motivo.toLowerCase().includes(q)
  );
}

function renderStats(rows) {
  document.getElementById('stat-total').textContent = rows.length;
  document.getElementById('stat-files').textContent = rows.filter(r => r.fileId).length;
  document.getElementById('stat-pendientes').textContent = rows.filter(r => r.decision === null).length;
}

function renderTable(rows) {
  const tbody = document.getElementById('tabla-body');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty"><div class="empty-icon">📭</div><div>No hay solicitudes que mostrar</div></td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(row => {
    const globalIdx = allRows.indexOf(row);
    const link = row.fileId
      ? `<a class="file-link" href="https://drive.google.com/file/d/${row.fileId}/view" target="_blank"><span>📄</span> Ver archivo</a>`
      : `<span class="muted">Sin archivo</span>`;
    return `<tr data-idx="${globalIdx}" class="${row.decision ? 'row-decided' : ''}">
      <td><div class="td-user"><div class="avatar">${getInitials(row.nombre)}</div><div><div class="user-name">${row.nombre}</div><div class="user-id">Fila #${row.rowIndex}</div></div></div></td>
      <td>${row.correo}</td>
      <td><span class="motivo-pill">${row.motivo}</span></td>
      <td class="reason-col">${row.razonIA}</td>
      <td>${row.fecha || '—'}</td>
      <td>${link}</td>
      <td>${buildEstado(row.decision)}</td>
      <td>${buildAcciones(globalIdx, row.decision)}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-valida').forEach(btn => btn.addEventListener('click', () => enviarDecision(+btn.dataset.idx, 'valida')));
  tbody.querySelectorAll('.btn-invalida').forEach(btn => btn.addEventListener('click', () => enviarDecision(+btn.dataset.idx, 'invalida')));
}

function buildEstado(decision) {
  if (decision === 'valida') return `<span class="badge badge-valida">✓ Válida</span>`;
  if (decision === 'invalida') return `<span class="badge badge-invalida">✕ Inválida</span>`;
  return `<span class="badge badge-pendiente">● Pendiente</span>`;
}

function buildAcciones(idx, decision) {
  if (decision === 'valida') return `<span class="accion-label accion-aprobada">Aprobada ✓</span>`;
  if (decision === 'invalida') return `<span class="accion-label accion-rechazada">Rechazada ✕</span>`;
  return `<div class="acciones-group"><button class="btn-decision btn-valida" data-idx="${idx}">✓ Válida</button><button class="btn-decision btn-invalida" data-idx="${idx}">✕ Inválida</button></div>`;
}

async function enviarDecision(idx, decision) {
  const row = allRows[idx];
  if (!row) return;
  const tr = document.querySelector(`tr[data-idx="${idx}"]`);
  const btns = tr?.querySelectorAll('.btn-decision');
  btns?.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
  try {
    const payload = { rowIndex: row.rowIndex, nombre: row.nombre, motivo: row.motivo, razonIA: row.razonIA, decision };
    const res = await fetch(DECISION_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allRows[idx].decision = decision;
    renderStats(allRows);
    tr?.querySelector('td:nth-child(7)')?.replaceChildren();
    tr?.querySelector('td:nth-child(7)')?.insertAdjacentHTML('afterbegin', buildEstado(decision));
    tr?.querySelector('td:last-child')?.replaceChildren();
    tr?.querySelector('td:last-child')?.insertAdjacentHTML('afterbegin', buildAcciones(idx, decision));
    tr?.classList.add('row-decided');
    showToast(decision === 'valida' ? `✅ ${row.nombre} aprobada` : `❌ ${row.nombre} rechazada`, decision === 'valida' ? 'success' : 'error');
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err.message}`, 'error');
    btns?.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
  }
}

function getInitials(name) { return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase(); }
function setLoading(yes) { if (!yes) return; document.getElementById('tabla-body').innerHTML = `<tr><td colspan="8" class="table-loading"><div class="loader"></div>Cargando solicitudes...</td></tr>`; }
function showTableError() { document.getElementById('tabla-body').innerHTML = `<tr><td colspan="8" class="table-empty"><div class="empty-icon">⚠️</div><div>No se pudo cargar la hoja de datos</div></td></tr>`; }
