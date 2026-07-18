# Evently

Plataforma de eventos con autenticación segura y simulador de smartwatch.

## Estructura

```
eventos-frontend/   # React + Vite + Tailwind
eventos-backend/    # Express + JWT + bcrypt
.docs/              # Documentación de prácticas
```

## Requisitos

- Node.js 18+
- MySQL/MariaDB (Laragon)
- npm

## Configuración rápida

### 1. Base de datos

En HeidiSQL / phpMyAdmin ejecuta:

`eventos-backend/sql/schema-mysql-auth.sql`

### 2. Backend

```bash
cd eventos-backend
cp .env.example .env   # ajusta usuario/contraseña MySQL y JWT_SECRET
npm install
npm run dev
```

API: `http://localhost:4000`

### 3. Frontend

```bash
cd eventos-frontend
npm install
npm run dev
```

Web: `http://localhost:5173`  
Smartwatch: `http://localhost:5173/watch`

## Usuario demo

- Correo: `bruno@evently.test`
- Contraseña: `secreto123`
- PIN: `1234`

## Seguridad (prácticas 11-12)

- Credenciales hasheadas con bcrypt
- Sesión JWT con expiración
- Rutas protegidas con `requireAuth`
- Logout con revocación de token
- Rate limit en login / PIN

## Repositorio

https://github.com/Brunne-CL/Evently
