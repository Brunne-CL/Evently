# Documentación Evently — Dispositivos Inteligentes

Carpeta de documentación técnica del proyecto **Evently** (plataforma de eventos en Querétaro, México) para las prácticas de **Dispositivos Inteligentes**, 9.º semestre.

## Contenido

| Documento | Práctica | Formatos | Descripción |
|-----------|----------|----------|-------------|
| Práctica 09 — Widget Smart TV y flujo Git | 9 | [`.md`](./practica-09-widget-smart-tv-git.md) · [`.docx`](./practica-09-widget-smart-tv-git.docx) | Integración del widget `EventlyTVWidget` en Git, despliegue del sitio y conexión con Smart TV |
| Práctica 10 — Base de datos estable | 10 | [`.md`](./practica-10-base-datos-estable.md) · [`.docx`](./practica-10-base-datos-estable.docx) | Esquema relacional, migraciones, enlace a BD, calendario de actualizaciones y manejo de errores |
| Prácticas 11 y 12 — Autenticación segura | 11–12 | [`.md`](./practica-11-12-autenticacion-segura.md) | Login, PIN smartwatch, bcrypt, JWT, pantalla protegida (React + Express + MySQL Laragon) |

## Estructura del repositorio documentado

```
Dispositivos inteligentes/
├── .docs/                          ← Esta carpeta
│   ├── README.md
│   ├── practica-09-widget-smart-tv-git.md
│   ├── practica-10-base-datos-estable.md
│   └── sql/
│       ├── schema-v1.0.0.sql
│       ├── schema-mysql-auth.sql
│       └── migrations/
│           └── 001_calendario_actualizaciones.sql
├── eventos-frontend/               ← React + Vite + Tailwind (Landing Page)
├── eventos-backend/                ← Express + MySQL Laragon (API REST + Auth)
└── md_a_docx.py                    ← Conversor Markdown → Word (opcional)
```

## Stack del proyecto

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | React + Vite + TailwindCSS + Framer Motion | 18.x / 5.x |
| Backend | Express + CORS + Helmet + JWT + bcrypt | 5.x |
| Base de datos | MySQL / MariaDB (Laragon) | 8.x / 10.x |
| Control de versiones | Git + GitHub | — |
| Despliegue | GitHub Pages / Vercel (frontend) + Render/Railway (backend) | — |

## Generar versión Word

Desde la carpeta `.docs/`:

```bash
python md_a_docx.py
```

Regenera ambos `.docx` a partir de los `.md`. Para un solo archivo:

```bash
python md_a_docx.py practica-09-widget-smart-tv-git.md
```

---

**Proyecto:** Evently · Querétaro, México  
**Asignatura:** Dispositivos Inteligentes — 9.º semestre  
**Última actualización:** Julio 2026
