/* ================================================================
   UTILIDADES COMPARTIDAS — QUANTUM UI
   Sistema de toasts premium + canvas cósmico de partículas
================================================================= */

/* ── Toast system ───────────────────────────────────────────── */

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ'
};
const TITLES = {
  success: 'Operación exitosa',
  error:   'Ocurrió un error',
  info:    'Información'
};

/**
 * showToast(msg, type, title)
 * Muestra una notificación premium tipo toast
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 * @param {string} [title] - Opcional
 */
function showToast(msg, type = 'success', title) {
  const container = document.getElementById('toast');
  if (!container) return;

  const item = document.createElement('div');
  item.className = `toast-item ${type}`;

  const iconEl = document.createElement('div');
  iconEl.className = 'toast-icon';
  iconEl.textContent = ICONS[type] || '✓';

  const contentEl = document.createElement('div');
  contentEl.className = 'toast-content';

  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = title || TITLES[type];

  const msgEl = document.createElement('div');
  msgEl.className = 'toast-msg';
  msgEl.textContent = msg;

  contentEl.appendChild(titleEl);
  contentEl.appendChild(msgEl);
  item.appendChild(iconEl);
  item.appendChild(contentEl);
  container.appendChild(item);

  // Auto-remove
  setTimeout(() => {
    item.classList.add('out');
    item.addEventListener('animationend', () => item.remove(), { once: true });
  }, 4500);
}

/* ── Modal de confirmación ───────────────────────────────────── */
/**
 * showConfirm(opts) — devuelve Promise<boolean>
 * @param {{ title, msg, confirmLabel, cancelLabel }} opts
 */
function showConfirm({ title = '¿Estás seguro?', msg = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-icon">🗑️</div>
        <h3>${title}</h3>
        <p>${msg}</p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="modal-cancel">${cancelLabel}</button>
          <button class="btn btn-danger" id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#modal-confirm').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
    overlay.querySelector('#modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

/* ── Canvas cósmico de partículas ───────────────────────────── */
(function initCosmos() {
  const canvas = document.getElementById('cosmos-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = Math.min(Math.floor(window.innerWidth * 0.06), 90);
  const particles = [];

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.5 + 0.3,
      vx:   (Math.random() - 0.5) * 0.22,
      vy:   (Math.random() - 0.5) * 0.22,
      a:    Math.random() * 0.5 + 0.15,
      blue: Math.random() > 0.5
    });
  }

  const CONNECT_DIST = 130;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update + draw points
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.blue
        ? `rgba(0, 200, 255, ${p.a})`
        : `rgba(80, 130, 255, ${p.a})`;
      ctx.fill();
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
