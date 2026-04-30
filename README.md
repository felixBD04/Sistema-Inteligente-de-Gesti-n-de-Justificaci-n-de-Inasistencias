# 🎓 Sistema Inteligente de Gestión de Justificación de Inasistencias

Sistema web full-stack que automatiza el proceso de justificación de inasistencias estudiantiles usando inteligencia artificial, n8n como motor de automatización y Google Workspace como infraestructura de datos.

---

## 🧠 ¿Cómo funciona?

El flujo completo tiene dos actores: el **estudiante** y el **administrador**, conectados a través de un pipeline de automatización en n8n.

```
Estudiante llena el formulario
        ↓
n8n recibe el webhook
        ↓
 ┌──────────────────────────────────┐
 │  En paralelo:                    │
 │  • Sube el archivo a Google Drive│
 │  • Valida el correo (AbstractAPI)│
 │  • Analiza el doc con Gemini AI  │
 └──────────────────────────────────┘
        ↓
   IA decide: VÁLIDA / INVÁLIDA / REQUIERE_REVISIÓN
        ↓
 ┌─────────────────────────────────────────────────┐
 │ VÁLIDA          → Sheet "aprobadas" + Gmail ✅   │
 │ INVÁLIDA        → Sheet "rechazadas" + Gmail ❌  │
 │ REQUIERE_REV.   → Sheet "pendientes" + Telegram  │
 └─────────────────────────────────────────────────┘
        ↓ (si REQUIERE_REVISIÓN)
Administrador revisa en el Panel Web
        ↓
Hace clic en ✓ Válida o ✕ Inválida
        ↓
Segundo webhook de n8n recibe la decisión final
```

---

## 🖥️ Páginas del frontend

### `index.html` — Formulario del estudiante
Página principal donde el estudiante registra su justificación de inasistencia.

**Campos del formulario:**
- Nombre completo
- ID de estudiante
- Correo electrónico
- Motivo de inasistencia (Enfermedad / Problema familiar / Cita médica / Otro)
- Documento de soporte (PDF, imagen o documento, máx. 10 MB) con drag & drop

Al enviar, los datos se mandan vía `multipart/form-data` al webhook de n8n que dispara todo el flujo de automatización.

---

### `prueba_pagina_pendientes.html` — Panel de revisión (Admin)
Panel exclusivo para el administrador, donde puede ver las solicitudes que la IA marcó como `REQUIERE_REVISIÓN` y tomar una decisión manual.

**Funcionalidades:**
- Tabla con todas las solicitudes pendientes leídas desde Google Sheets (CSV público)
- Buscador en tiempo real por nombre o correo
- Botón de actualizar datos
- Estadísticas en vivo (total, pendientes, con documento)
- Botones **✓ Válida** e **✕ Inválida** por cada fila
- Al decidir, se envía un `POST` al webhook de n8n con `{ rowIndex, nombre, decision }`
- Badge de estado que cambia en tiempo real sin recargar la página

---

## 🤖 Flujo de n8n

El archivo `flujo_n8n.json` contiene el flujo completo importable en n8n. Estos son los nodos principales:

| Nodo | Función |
|------|----------|
| **Webhook** | Recibe el formulario del estudiante |
| **Upload file** | Sube el documento a Google Drive (`n8n_BaseDeDatos/`) |
| **HTTP Request** | Valida el correo con AbstractAPI Email Reputation |
| **AI Agent + Gemini** | Analiza el documento con Google Gemini y clasifica la solicitud |
| **Structured Output Parser** | Fuerza la respuesta de la IA a JSON `{ decision, razon, confianza }` |
| **Merge** | Une los resultados paralelos (archivo + email + IA) |
| **If1** | Filtra si el correo es deliverable o no |
| **Switch** | Enruta según la decisión de la IA (VÁLIDA / INVÁLIDA / REQUIERE_REVISIÓN) |
| **Google Sheets (×3)** | Guarda en la hoja correspondiente: aprobadas, rechazadas o pendientes |
| **Gmail (×2)** | Notifica al estudiante con el resultado de su solicitud |
| **Telegram (×3)** | Alerta al admin en casos de revisión, correo inválido o error de IA |

---

## 📁 Estructura del proyecto

```
├── index.html                      # Formulario del estudiante
├── prueba_pagina_pendientes.html   # Panel de revisión del administrador
├── css/
│   ├── main.css                    # Estilos globales (navbar, cards, botones, toast)
│   ├── formulario.css              # Estilos del formulario y file upload
│   └── pendientes.css              # Estilos del panel (tabla, badges, botones de decisión)
├── js/
│   ├── utils.js                    # Utilidades compartidas (showToast)
│   ├── formulario.js               # Lógica del formulario (submit, drag & drop, steps)
│   └── pendientes.js               # Lógica del panel (fetch CSV, render tabla, decisión)
├── flujo_n8n.json                  # Flujo de automatización importable en n8n
└── README.md
```

---

## 🛠️ Tecnologías utilizadas

**Frontend**
- HTML5, CSS3, JavaScript vanilla
- Google Fonts: [Sora](https://fonts.google.com/specimen/Sora) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- Diseño: tema oscuro, sistema de variables CSS, totalmente responsivo

**Automatización**
- [n8n](https://n8n.io/) — motor de flujos de trabajo
- [Google Gemini](https://deepmind.google/technologies/gemini/) (gemini-3.1-flash-lite) — análisis de documentos con IA
- [AbstractAPI Email Validation](https://www.abstractapi.com/api/email-validation-verification-api) — verificación de correos

**Infraestructura de datos**
- Google Drive — almacenamiento de documentos de soporte
- Google Sheets — base de datos de solicitudes (aprobadas / rechazadas / pendientes)
- Gmail — notificaciones automáticas a estudiantes
- Telegram — alertas en tiempo real al administrador

---

## ⚙️ Configuración y despliegue

### 1. Importar el flujo en n8n
1. Abre tu instancia de n8n
2. Ve a **Workflows → Import**
3. Sube el archivo `flujo_n8n.json`
4. Configura las credenciales: Google Drive, Google Sheets, Gmail, Telegram y Google Gemini (PaLM API)

### 2. Activar el flujo
- En n8n, activa el flujo con el toggle **Activate** (arriba a la derecha)
- Usa la URL de **producción** (`/webhook/...`), no la de test (`/webhook-test/...`)

### 3. Configurar las URLs en el frontend
En `js/formulario.js`, asegúrate que `WEBHOOK_URL` apunte a tu webhook de n8n:
```js
const WEBHOOK_URL = "https://TU_INSTANCIA.app.n8n.cloud/webhook/TU_PATH";
```

En `js/pendientes.js`, configura `DECISION_WEBHOOK_URL` con el webhook para las decisiones del admin:
```js
const DECISION_WEBHOOK_URL = "https://TU_INSTANCIA.app.n8n.cloud/webhook/TU_UUID";
```

### 4. Publicar el Google Sheet
El panel de revisión lee los datos vía CSV público. Asegúrate de que tu Google Sheet esté publicado en **Archivo → Publicar en la web → CSV**.

---

## 👨‍💻 Autor

**Juan Félix Díaz**  
Campus Lands — Proyecto de automatización con IA  
