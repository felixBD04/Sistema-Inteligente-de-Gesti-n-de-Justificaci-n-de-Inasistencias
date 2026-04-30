/* ============================================================
   UTILIDADES COMPARTIDAS
   ============================================================ */

/**
 * Muestra un toast de notificación
 * @param {string} msg   - Mensaje a mostrar
 * @param {'success'|'error'} type
 */
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = '';
  el.className = `toast ${type}`;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = type === 'success' ? '✓' : '✕';

  const text = document.createElement('span');
  text.textContent = msg;

  el.appendChild(icon);
  el.appendChild(text);
  el.classList.add('show');

  setTimeout(() => el.classList.remove('show'), 4000);
}