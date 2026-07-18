# Evently — Landing Page

Landing page **moderna, oscura y con animaciones fluidas** para **Evently**, una app de eventos en **Querétaro, México** con confirmación de asistencia desde reloj inteligente.

> Stack: **React 18 + Vite + TailwindCSS + Framer Motion + Lucide React**
>
> 🇲🇽 Producto enfocado en el estado de Querétaro: Centro Histórico, Tequisquiapan, Acueducto, Estadio Corregidora, Centro de Congresos, etc.

---

## Características

- Navbar transparente → sólida con glassmorphism al hacer scroll
- Hero con orbes animados, gradientes neón y parallax sutil
- Carrusel horizontal de categorías
- Grid asimétrico de eventos destacados con tarjetas interactivas
- Sección "Cómo funciona" en 4 pasos con línea conectora
- Contadores animados al entrar en viewport
- CTA promocional con ilustración de smartwatch flotante
- Footer con newsletter, columnas de links y redes sociales
- 100% responsive (mobile first)
- Paleta: negro profundo + morado/violeta neón + cyan + rosa

---

## Requisitos

- **Node.js ≥ 18**
- npm / pnpm / yarn

---

## Instalación

```bash
# 1) Instalar dependencias
npm install

# 2) Arrancar el servidor de desarrollo
npm run dev

# La app se abrirá en http://localhost:5173
```

Otros comandos:

```bash
npm run build      # Compilar para producción
npm run preview    # Previsualizar el build
```

---

## Estructura del proyecto

```
eventos-frontend/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js          # Paleta + animaciones personalizadas
├─ postcss.config.js
└─ src/
   ├─ main.jsx                 # Punto de entrada de React
   ├─ App.jsx                  # Monta <LandingPage />
   ├─ index.css                # Tailwind + estilos globales + glassmorphism
   └─ LandingPage.jsx          # ⭐ TODA la landing en un solo archivo
```

---

## Dónde están las cosas

Todo el código de la landing vive en **`src/LandingPage.jsx`** y está dividido en sub-componentes claramente comentados:

| Componente         | Descripción                                            |
| ------------------ | ------------------------------------------------------ |
| `Navbar`           | Header transparente → sólido al hacer scroll          |
| `Hero`             | Sección impactante con orbes y CTAs                   |
| `Categories`       | Scroll horizontal de categorías                       |
| `FeaturedEvents`   | Grid asimétrico de eventos destacados                 |
| `EventCard`        | Tarjeta individual de evento con hover y "Me interesa"|
| `HowItWorks`       | 4 pasos con iconos y línea de gradiente               |
| `Stats`            | Contadores animados                                    |
| `SmartwatchCTA`    | CTA sobre integración con reloj inteligente           |
| `Footer`           | Footer con newsletter y redes sociales                |

---

## Personalización

### Paleta de colores

Edita `tailwind.config.js` → `theme.extend.colors.evently`:

```js
evently: {
  black:  '#070710',
  purple: '#8b5cf6',
  cyan:   '#22d3ee',
  pink:   '#ec4899',
  // ...
}
```

### Tipografía

Las fuentes **Inter** y **Space Grotesk** se cargan desde Google Fonts en `index.html`.

### Eventos / categorías

Los datos se definen como arrays al inicio de cada sección dentro de `LandingPage.jsx` (`CATEGORIES`, `EVENTS`, `STEPS`). Solo edita esos arrays para cambiar el contenido.

---

## Tecnologías

| Librería         | Versión   | Uso                                  |
| ---------------- | --------- | ------------------------------------ |
| `react`          | ^18.3.1   | UI                                   |
| `react-dom`      | ^18.3.1   | Render DOM                           |
| `vite`           | ^5.4.3    | Bundler + dev server                 |
| `tailwindcss`    | ^3.4.10   | Estilos utility-first                |
| `framer-motion`  | ^11.5.4   | Animaciones (fade, slide, parallax)  |
| `lucide-react`   | ^0.439.0  | Iconografía moderna                  |

---

¡Listo! Solo `npm install && npm run dev` y disfruta de la landing.
