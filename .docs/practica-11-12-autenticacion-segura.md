# Prácticas 11 y 12 — Autenticación segura Evently

**Proyecto:** Evently · Dispositivos Inteligentes · 9.º semestre  
**Stack:** React (frontend) · Express (backend) · MySQL en Laragon (BD)

---

## 1. Objetivo

Implementar un sistema de autenticación que:

1. Impida el acceso a áreas internas **sin autenticación previa**
2. **No almacene credenciales en texto plano**
3. Gestione la sesión de forma correcta (JWT con expiración)

Aplicado a Evently: login web, PIN para smartwatch, sección **Mis eventos** protegida.

---

## 2. Arquitectura

```
[ React AuthModal ] ──HTTPS/JSON──▶ [ Express /api/auth/* ]
                                           │
                                    bcrypt + JWT
                                           │
                                           ▼
                                   [ MySQL Laragon ]
                                   usuarios.password_hash
                                   usuarios.pin_hash
```

| Capa | Ubicación |
|------|-----------|
| Frontend | `eventos-frontend/` |
| Backend | `eventos-backend/` |
| SQL | `eventos-backend/sql/schema-mysql-auth.sql` |

---

## 3. Funcionalidades implementadas

| Requisito | Implementación |
|-----------|----------------|
| Pantalla de login | `AuthModal.jsx` (Sesión / Registro / PIN) |
| PIN 4–6 dígitos | `POST /api/auth/pin-login` + campo opcional en registro |
| Pantalla protegida | `#mis-eventos` + `GET /api/auth/mis-eventos` (401 sin token) |
| Logout | Navbar + `apiLogout()` limpia JWT del cliente |
| Hash de credenciales | `bcryptjs` coste 12 → `password_hash` / `pin_hash` |
| Sesión | JWT (`Authorization: Bearer`) · expira en 8h |

---

## 4. Cómo probar (evidencia)

### 4.1 Preparar Laragon

1. Inicia Laragon (Apache/MySQL)
2. Abre HeidiSQL o phpMyAdmin
3. Ejecuta `eventos-backend/sql/schema-mysql-auth.sql`
4. Verifica: `USE evently_db; SHOW TABLES;`

### 4.2 Arrancar servicios

```bash
# Terminal 1 — API
cd eventos-backend
npm install
npm run dev

# Terminal 2 — Frontend
cd eventos-frontend
npm install
npm run dev
```

### 4.3 Pruebas de seguridad sugeridas

| Prueba | Cómo | Resultado esperado |
|--------|------|--------------------|
| Acceso sin token | `GET http://localhost:4000/api/auth/mis-eventos` | **401** Unauthorized |
| Registro | UI Registrarse o `POST /api/auth/register` | Usuario en BD; `password_hash` empieza con `$2` |
| Texto plano | `SELECT password_hash FROM usuarios` | **No** se ve la contraseña original |
| Login correcto | UI o `POST /api/auth/login` | JWT + datos de usuario |
| Login incorrecto | Password mala | 401 · mensaje genérico |
| PIN | Registro con PIN → pestaña PIN | Acceso con 4–6 dígitos |
| Sesión expirada | Token inválido en header | 401 `TOKEN_INVALID` |
| Logout | Cerrar sesión en navbar | Token borrado; Mis eventos bloqueado |
| Fuerza bruta | Muchos login fallidos | Rate limit 429 |

### 4.4 Capturas recomendadas

1. Modal de login / registro / PIN  
2. HeidiSQL: fila de usuario con `password_hash` bcrypt  
3. Postman/Insomnia: 401 en `/mis-eventos` sin Bearer  
4. Postman: 200 en `/mis-eventos` con Bearer  
5. Sección Mis eventos bloqueada vs. desbloqueada  

---

## 5. Análisis de vulnerabilidades (plantilla)

| # | Vulnerabilidad | Riesgo | Estado / mitigación |
|---|----------------|--------|---------------------|
| 1 | Credenciales en texto plano | Crítico | Mitigado: bcrypt |
| 2 | Acceso sin auth a datos privados | Alto | Mitigado: `requireAuth` |
| 3 | Fuerza bruta en login | Alto | Mitigado: rate-limit |
| 4 | JWT en localStorage (XSS) | Medio | Documentado; mejorar con httpOnly cookies en prod |
| 5 | Secret JWT débil en `.env` de ejemplo | Medio | Cambiar `JWT_SECRET` en producción |
| 6 | Sin HTTPS en local | Bajo (dev) | Usar HTTPS en despliegue |
| 7 | Biometría nativa | N/A en web | Emulado vía PIN; Wear OS usaría BiometricPrompt |

---

## 6. Endpoints

Ver `eventos-backend/README.md`.

---

## 7. Entregables de la práctica

- [x] Código fuente (React + Express + SQL)
- [ ] Capturas de pruebas (alumno)
- [x] Este informe de resultados
- [x] Lista categorizada de vulnerabilidades (sección 5)

---

**Última actualización:** Julio 2026
