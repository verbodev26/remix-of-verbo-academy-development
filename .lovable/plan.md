# Plan — 5 piezas del Student Panel (un solo lote)

Todo se hace siguiendo el lenguaje visual ya establecido (Card / PrimaryButton / GhostButton / Pill, paleta `#01304a`, `#f38934`, semantic tokens). No se crea estilo nuevo.

---

## 1. Fix data — International levels en `materials-store.ts`

Alinear con `product-courses-store.ts` (fuente de verdad de Learning Path).

- `RESTRICT_PRODUCTS.international.levels`:
  - Antes: `["Survival Basics", "Travel Ready", "Social Fluency", "Full Command"]`
  - Después: `["Survival Basics", "Travel Ready", "Global Connector", "World Fluency"]`

Cambio de una sola línea; nada más se toca.

---

## 2. Insights standalone tab (`/student/insights`)

Reemplazar el placeholder `ComingSoon` por una cartelera de Insights basada en `CalendarView` (mismo componente que `student.sessions.tsx`).

- Reutilizar `studentCalendarEvents(...)` extendido: hoy solo devuelve sesiones 1:1; agregar clubes tipo `insight` a los que el alumno ya está inscrito **y** clubes `insight` upcoming con cupo disponible (para poder reservar).
  - Implementación mínima: en la propia route filtrar `loadClubs()` por `type === "insight"` y `status !== "cancelled"`, y convertir a `CalendarEvent` con `kind: "insight"` — sin tocar el adapter global (más seguro).
- `CalendarView` recibe `availableKinds={["insight"]}` para forzar la vista a un solo tipo (el chip filter ya soporta esto).
- Al click en un evento: modal de reserva (mismo patrón visual que `EventDetailsModal` de Live Sessions, adaptado a club).
  - Muestra: título, descripción, fecha, duración, spots X/Y, teacher.
  - Botón **Reserve seat** (o **Cancel reservation** si ya está inscrito).
  - Regla <24h: bloquea acción con mensaje `"Reservations close 24h before start."`.
  - Cupo mensual X/3 por alumno: computar contando `insight_bookings` del alumno del mes actual; bloquear si `>=3` con mensaje `"You've used your 3 Insight seats for this month."`.
- Persistencia: nuevo store ligero `insight-bookings-store.ts` (mismo patrón que otros stores) — `{student_id, club_id, booked_at}` en localStorage con evento y `useSyncExternalStore`. Actualiza `spots_taken` del club vía `updateClub`.

Nota: se aplica la misma lógica X/3 y <24h a Book Clubs en tarea 4; el store se reutiliza.

---

## 3. VIP unit Locked/Unlocked visual (alumno)

Actualmente `student.my-course.tsx` es `ComingSoon`. La lógica ya vive en `vip-courses-store.ts` (`vipUnitDoneMap`, `isVipUnitDone`).

- Construir `student.my-course.tsx` con la vista de unidades VIP del alumno:
  - `unitsForStudent(user.id)` ordenado por creación.
  - Mismo criterio del Teacher: `unlocked = done || previousDone`.
  - Cada card muestra:
    - Nº unidad + título.
    - Badge **Done** (`success`), **Unlocked** (`success`) o **Locked until previous unit completed** (`muted`) — mismos íconos (`CheckCircle2` / `Unlock` / `Lock`) y tonos que `teacher.vip.tsx` líneas 187-199.
    - Descarga de material si `unlocked`; oculto si locked.
  - Header con contador `done/total`.
  - Vacío: `"Your teacher hasn't added units yet."`.
- Reutilizar tokens de Learning Path (Pill tone success/muted) para consistencia entre My Course y Learning Path.

---

## 4. Modal de reserva de Book Club rediseñado

Actualmente NO existe un modal específico de reserva de Book Club en el alumno (los book clubs sólo aparecen en el calendario general). Construirlo desde cero al mismo nivel visual que los modales de Live Sessions.

- Punto de entrada: click en un evento `book_club` en el calendario de `student.sessions.tsx` (ya sucede vía `EventDetailsModal` — extenderlo o rutear a modal dedicado).
- Nuevo `BookClubReservationModal` en `src/components/verbo/`:
  - Header con badge tipo `Book Club` (color `#d97706`).
  - Título, descripción, fecha larga, duración, teacher (si asignado), material (link).
  - Contador de cupo `X / Y` con barra visual (`bg-secondary` + `bg-accent` de la ya existente).
  - Info card ámbar con las reglas: `"Reservations close 24h before start."` + `"You can book up to 3 clubs per month."` + contador `used/3`.
  - Estados: `idle`, `loading` (spinner en botón), `success` (toast + swap a "You're in"), `error` (banner rojo).
  - CTA único que cambia: **Reserve seat** / **Cancel reservation** / **Full** (disabled) / **Closed (<24h)** (disabled).
- Lógica de negocio (ya cerrada):
  - <24h: bloquear.
  - X/3 mensual por alumno — cupo INDIVIDUAL incluso si el alumno está en un Group (el store se llavea por `student_id`, no por `group_id`; para alumnos de Group, el `X` viene del `Group.addon_bookclubs_per_month` si existe, si no del alumno).
- Store: reutilizar `insight-bookings-store.ts` de tarea 2 pero generalizado como `club-bookings-store.ts` con `type: "insight" | "book"`.

---

## 5. Ocultar pago/facturación para alumnos de Group

Un alumno con `group_id` no debe ver ningún surface de pago/facturación (el pago vive a nivel Group).

Revisión sistemática:
- `groupsByStudentId()` ya existe → helper `isGroupMember(user)` de una línea.
- Dashboard `student.index.tsx`: revisar cualquier bloque que muestre precio/plan/monto/facturación. Envolver en `{!isGroupMember && ...}`.
- `student.access-levels.tsx`, `student.boost.tsx`: si muestran precios de add-ons/upgrades, ocultar los CTAs de pago para group members (dejar información de contenido, ocultar el "Buy"/"Upgrade"/precio).
- `student.performance.tsx`, `student.sessions.tsx`, `student.courses.tsx`, `student.my-course.tsx`, `student.resources.tsx`, `student.challenges.tsx`: sweep con `rg -n "price|MXN|payment|invoice|billing|Buy|Upgrade"` — auditar todos los matches; ocultar los que apliquen.
- Cupos, progreso, calendario, retos: **NO se tocan** — se ven idénticos a un alumno individual.

Cambio verificable: un alumno con `group_id` ve exactamente la misma UX excepto por la ausencia de bloques/CTAs de pago.

---

## Detalle técnico

- Archivos nuevos:
  - `src/lib/club-bookings-store.ts` — bookings por alumno para insight + book clubs.
  - `src/components/verbo/BookClubReservationModal.tsx`.
  - `src/components/verbo/InsightReservationModal.tsx` (o compartir uno solo `ClubReservationModal` parametrizado por `type`).
- Archivos editados:
  - `src/lib/materials-store.ts` (tarea 1).
  - `src/routes/student.insights.tsx` (tarea 2, full rewrite).
  - `src/routes/student.my-course.tsx` (tarea 3, full rewrite).
  - `src/routes/student.sessions.tsx` (integración modal Book Club + Insight en tap de eventos club).
  - `src/routes/student.index.tsx`, `student.access-levels.tsx`, `student.boost.tsx`, etc. según el sweep de tarea 5.
- No se toca `src/routeTree.gen.ts` ni el CalendarView (solo se consume su prop `availableKinds`).
- Textos 100% en inglés.

## Riesgos y validación

- Verificar con `rg` que ningún surface de pago se me escape en tarea 5.
- Probar en preview: login como alumno individual → como alumno con `group_id` → como alumno Insights-only. Confirmar navegación + modales + reglas <24h y X/3.

¿Procedo con la implementación completa?
