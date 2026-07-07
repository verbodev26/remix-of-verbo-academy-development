## Problema

El menú desplegable sí se abre, pero no se ve. La causa es el `overflow-x-auto` en el `<nav>` de `src/routes/admin.tsx` (línea ~192): ese contenedor recorta cualquier elemento posicionado absolutamente que se salga de sus límites, incluyendo el panel del dropdown que cuelga debajo del botón.

## Cambios propuestos (solo `src/routes/admin.tsx`)

1. **Quitar el clipping del `<nav>`**
   - Reemplazar `overflow-x-auto` en el `<nav>` por `flex-wrap` (o simplemente sin overflow) para que el menú pueda desbordar verticalmente sin ser recortado.
   - Si se quiere conservar scroll horizontal en móviles muy angostos, envolver el nav en un wrapper distinto y mantener `overflow-visible` en el que contiene los dropdowns. Propuesta por defecto: `flex flex-wrap` — más simple y suficiente para 6 grupos.

2. **Asegurar visibilidad del menú al hacer hover/clic**
   - El panel ya usa `absolute top-full left-0 z-40`; con el clipping resuelto aparecerá correctamente.
   - Añadir un pequeño "puente" invisible entre botón y menú (`pt-1` en el panel + `-mt-1`) para que mover el ratón del botón al menú no dispare el cierre por `mouseleave`.
   - Mantener el `setTimeout` de 120 ms ya existente como red de seguridad.

3. **Sin cambios de comportamiento ni de accesibilidad**
   - Se conservan `role="menu"`, `aria-haspopup`, `aria-controls`, `aria-expanded`, navegación por teclado (Arrow, Home/End, Escape, Tab) y cierre por click afuera.
   - No se toca el modelo `NAV_GROUPS`, ni rutas, ni otros archivos.

## Archivos afectados

- `src/routes/admin.tsx` — 2 ediciones puntuales (clase del `<nav>` y clase del panel del menú).
