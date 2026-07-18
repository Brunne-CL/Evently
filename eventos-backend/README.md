# Evently Backend — API REST

Stack: **Express + MySQL (Laragon)** · Auth con **bcrypt** + **JWT**

## Requisitos

1. Laragon con MySQL/MariaDB encendido
2. Node.js 18+

## Setup

```bash
# 1. Crear BD (HeidiSQL / phpMyAdmin) — ejecuta:
#    sql/schema-mysql-auth.sql

# 2. Variables de entorno
cp .env.example .env

# 3. Instalar y arrancar
npm install
npm run dev
```

API en `http://localhost:4000`

## Endpoints de autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registro (password + PIN opcional hasheados) |
| POST | `/api/auth/login` | No | Login email + password |
| POST | `/api/auth/pin-login` | No | Login smartwatch (PIN 4–6 dígitos) |
| POST | `/api/auth/logout` | No* | Cierre de sesión (cliente borra JWT) |
| GET | `/api/auth/me` | Bearer | Perfil (protegido) |
| POST | `/api/auth/set-pin` | Bearer | Configurar PIN |
| GET | `/api/auth/mis-eventos` | Bearer | Pantalla protegida |
| GET | `/api/categories` | No | Categorías almacenadas en MySQL |
| GET | `/api/events` | No | Eventos almacenados en MySQL |
| POST/DELETE | `/api/events/:id/reservation` | Bearer | Confirmar/cancelar reserva |
| POST/DELETE | `/api/events/:id/favorite` | Bearer | Guardar/quitar favorito |
| GET | `/api/health` | No | Estado API + BD |

\* El logout invalida la sesión en el cliente; el JWT expira según `JWT_EXPIRES_IN`.

## Seguridad (Prácticas 11–12)

- Contraseñas y PIN **nunca** en texto plano → `bcrypt` (coste 12)
- Sesión con JWT firmado (`JWT_SECRET`) y expiración
- Rutas protegidas con middleware `requireAuth` → **401** sin token
- Rate limit en login/register/PIN (anti fuerza bruta)
- Helmet + CORS restringido

## Fuente de datos

React no contiene arreglos locales de eventos o categorías. El catálogo, los
usuarios, las reservas y los favoritos se consultan y modifican mediante la API,
con persistencia en las tablas MySQL de `evently_db`.
