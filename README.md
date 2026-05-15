# Everwood FAQ Cloud Platform

**Descripción:** Plataforma cloud para cargar, almacenar y analizar conversaciones históricas de WhatsApp, con generación automática de FAQs basadas en inteligencia.

---

## Arquitectura

```
Frontend (Vercel/Netlify)  →  Backend API (Railway/Render)  →  Supabase (DB + Storage)
HTML + CSS + JS vanilla         Node.js + Express                PostgreSQL + Bucket
```

**Principio clave:** el frontend no tiene lógica de negocio. Todo va por `fetch` al backend.

---

## Stack

| Capa | Tecnología | Deploy |
|---|---|---|
| Frontend | HTML, CSS, JS vanilla (ES Modules) | Vercel o Netlify |
| Backend | Node.js + Express | Railway o Render |
| Base de datos | Supabase PostgreSQL | Supabase (gratis) |
| Almacenamiento | Supabase Storage | Supabase (gratis) |

---

## Configuración local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/everwood-faq-cloud-platform.git
cd everwood-faq-cloud-platform
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

### 3. Crear las tablas en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Tabla de cargas
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  responsible TEXT NOT NULL,
  status TEXT DEFAULT 'completado',
  observations TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  confidence FLOAT DEFAULT 0.7,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Crear el bucket en Supabase Storage

1. Ir a **Storage** en Supabase
2. Crear un bucket llamado `conversations`
3. Marcarlo como **público**

### 5. Levantar el backend

```bash
cd backend
npm run dev
# Corre en http://localhost:3000
```

### 6. Abrir el frontend

Abre `frontend/index.html` en tu navegador o usa Live Server (VS Code).

---

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor |
| POST | `/api/upload` | Subir archivo (multipart) |
| GET | `/api/conversations` | Historial de cargas |
| GET | `/api/conversations/:id` | Detalle de una carga |
| PATCH | `/api/conversations/:id/status` | Actualizar estado |
| GET | `/api/faqs` | Listar FAQs (opcional: ?status=pendiente) |
| PATCH | `/api/faqs/:id` | Aprobar/rechazar FAQ |

---

## Despliegue

### Backend → Railway

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Seleccionar la carpeta `/backend`
3. Agregar variables de entorno: `SUPABASE_URL`, `SUPABASE_KEY`, `FRONTEND_URL`

### Frontend → Vercel

1. Ir a [vercel.com](https://vercel.com) → New Project → GitHub
2. Seleccionar la carpeta `/frontend`
3. Actualizar `BASE_URL` en `frontend/js/api.js` con la URL de Railway

---

## Prueba rápida

Usa el archivo `conversacion_prueba.json` incluido en la raíz para probar la carga y vista previa.

---

## Evidencias requeridas

- [ ] Captura de la interfaz principal
- [ ] Captura del proceso de carga
- [ ] Captura del archivo en Supabase Storage
- [ ] Captura de la tabla `uploads` en Supabase DB
- [ ] Captura del historial de cargas
- [ ] URL pública del sistema desplegado
- [ ] Enlace del repositorio
