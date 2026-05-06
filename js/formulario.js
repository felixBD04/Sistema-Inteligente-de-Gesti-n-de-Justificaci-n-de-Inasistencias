/* ============================================================
   FORMULARIO DE INASISTENCIA — LÓGICA
   ============================================================ */

const WEBHOOK_URL =
  "https://juan3491.app.n8n.cloud/webhook-test/Sistema_Inteligente_de_Gestión_de_Justificación_de_Inasistencias";

document.addEventListener('DOMContentLoaded', () => {
  const form     = document.getElementById('formulario');
  const btnSend  = document.getElementById('btn-enviar');
  const spinner  = btnSend.querySelector('.spinner');
  const btnText  = btnSend.querySelector('.btn-text');
  const fileInput = document.getElementById('archivo');
  const fileName  = document.getElementById('file-name');
  const uploadArea = document.querySelector('.file-upload-area');

  /* ── File upload UX ───────────────────────────────────── */
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      fileName.textContent = `📎 ${file.name}`;
      fileName.style.display = 'block';
      uploadArea.style.borderColor = 'var(--success)';
    }
  });

  // Drag & drop
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileName.textContent = `📎 ${file.name}`;
      fileName.style.display = 'block';
      uploadArea.style.borderColor = 'var(--success)';
    }
  });

  /* ── Submit ───────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Loading state
    btnSend.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = 'Enviando...';

    const formData = new FormData(form);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showToast('Justificación enviada correctamente 🚀', 'success');
        document.querySelectorAll('.step').forEach((s, i) => {
          s.classList.remove('active');
          if (i < 2) s.classList.add('done');
          if (i === 2) s.classList.add('active');
        });
      } else {
        throw new Error('Respuesta no OK');
      }

    } catch (err) {
      console.error(err);
      showToast('Error al enviar. Intenta de nuevo.', 'error');
    } finally {
      btnSend.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = 'Enviar justificación';
    }
  });

  /* ── Step indicators on focus ─────────────────────────── */
  const steps = document.querySelectorAll('.step');
  const groups = document.querySelectorAll('.form-group');

  const stepMap = {
    'nombre': 0, 'id': 0, 'correo': 0,
    'motivo': 1,
    'archivo': 1
  };

  groups.forEach(group => {
    const input = group.querySelector('input, select');
    if (!input) return;
    input.addEventListener('focus', () => {
      const stepIdx = stepMap[input.name] ?? 0;
      steps.forEach((s, i) => {
        s.classList.remove('active');
        if (i < stepIdx) s.classList.add('done');
        else s.classList.remove('done');
      });
      steps[stepIdx]?.classList.add('active');
    });
  });
});