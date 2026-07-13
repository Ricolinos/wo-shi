# wo-shi — contexto maestro para IA

> Documento de referencia único sobre qué es wo-shi, qué tiene construido, qué le falta y con qué reglas se trabaja en este repo. Pensado para pegarse como prompt de arranque a cualquier IA (Claude, GPT, etc.) que vaya a leer, mejorar o completar el proyecto.

---

## 1. Qué es wo-shi

**Tagline del propio repo:** *"A social network to find yourself through others."*

wo-shi es un diario personal con una capa social ligera, cuya idea central es que **las personas, emociones, ideas, creencias y lugares que mencionas en tus entradas de diario no son solo etiquetas — son "Vínculos" (Bonds) que maduran en el tiempo y cuya evolución puedes visualizar.** El producto combina tres cosas que normalmente están separadas:

1. Un diario privado (como Day One / Journal).
2. Un feed social selectivo (como Instagram Close Friends), con reglas de visibilidad granulares.
3. Un sistema de analítica personal sobre tus relaciones y estados internos (intensidad, cercanía, frecuencia), inspirado en CRM/analítica de datos pero aplicado a la vida emocional.

El usuario escribe una entrada de diario, la "etiqueta" con personas/emociones/ideas/creencias/lugares involucrados, califica cada vínculo con dos dimensiones (intensidad y cercanía, 1-10), y el sistema va acumulando snapshots en el tiempo. Cuando un vínculo se menciona 5+ veces deja de ser una simple etiqueta y "madura" a una entidad con perfil propio, gráfica de evolución y comparación contra otros vínculos.

---

## 2. Concepto central: Vínculos (Bonds)

Es la pieza de diseño más distintiva del producto — cualquier trabajo sobre el proyecto debe respetar este modelo:

- **`Bond`** = persona, emoción, idea, creencia, lugar o grupo que aparece en las entradas de un usuario. Empieza con `maturityLevel: 0` y sube +1 cada vez que se reutiliza en una nueva entrada.
- **Umbral de madurez = 5.** Por debajo es una "etiqueta" (tag); en o por encima es un "vínculo maduro" (entity) con más peso visual y su propia página `/bonds/[id]`.
- **`subtype`** es vocabulario controlado *en código* (`src/lib/bond-subtypes.ts`), no un enum de Prisma — así se puede extender sin migraciones. Ej: PERSON → familiar/amistad/pareja/laboral/mentor/conocido.
- **Cada aparición de un Bond en una entrada (`EntryBond`) registra dos dimensiones:**
  - `intensity` (1-10): qué tan fuerte es el vínculo en esa entrada puntual.
  - `proximity` (1-10): qué tan cerca (física/emocional/mental) se sintió, mapeada visualmente a una escala centrada en 0 (`proximityToVisual()`: 1→‑10, 5.5→0, 10→+10) para que las gráficas siempre tengan al usuario como referencia neutral en el centro.
- **`BondSnapshot`** guarda esa medición en el tiempo → es lo que alimenta las gráficas de evolución.
- Un `Bond` puede estar **`linkedUserId`** a otro usuario real de wo-shi (si etiquetas a alguien que también usa la app) — eso habilita notificarle y pedirle aprobación (`TagApproval`) antes de mostrarlo en su propio feed.
- Colores por tipo (paleta fija, ver §6): PERSON coral, BELIEF pink, IDEA amber, EMOTION teal, PLACE/GROUP azul.

---

## 3. Mapa de funcionalidades

### 3.1 Autenticación (`/auth`, Auth.js v5)
Tres métodos: Google OAuth, Magic Link por email (Resend), y Credentials (usuario/contraseña con bcrypt). Registro con username único (regex `[a-z0-9_]+`), auto-login tras registro. Sesión JWT (no DB sessions). El middleware protege todo excepto `/auth`, `/api/auth`, `/terms`, `/privacy`.

### 3.2 Feed (`/feed`) — home tras login
Feed cronológico inverso de entradas propias + de contactos, con:
- Filtro por tipo de vínculo (tabs en el topbar).
- Filtro por visibilidad (panel derecho: Todo / Solo yo / Amigos / Público).
- Cards con header (autor, tiempo relativo, lugar, badge de visibilidad), bloque de media (fotos en grid adaptativo 1/2/3/4+, video con overlay de play, o banner de audio con waveform decorativo), cuerpo (título + texto truncado) y chips de vínculos coloreados por tipo.
- Reglas de visibilidad: `PRIVATE` solo autor, `FRIENDS` solo si hay follow mutuo, `PUBLIC` cualquier autenticado.

### 3.3 Diario / nueva entrada (`/journal/new`)
Formulario de creación de entradas: título + cuerpo, fecha/hora, geolocalización, adjuntos (foto/video/nota de voz — sube a Vercel Blob), y tres modales para etiquetar vínculos:
- **PersonModal**: busca usuarios de wo-shi o vínculos-persona existentes vía `/api/bonds/search`, permite marcar intensidad/cercanía/nota privada, y decidir si se le notifica a la persona (si es un usuario real).
- **EmotionModal**: emociones/sentimientos/estado de ánimo con subtipo (emotion/feeling/mood) e intensidad.
- **IdeaModal**: ideas o creencias con relevancia.

Guarda con Server Action `saveEntry` → transacción que crea la Entry, sube media, hace upsert de cada Bond (incrementa maturityLevel o crea nuevo), crea EntryBond + BondSnapshot, y si corresponde crea TagApproval.

### 3.4 Vínculos (`/bonds` y `/bonds/[id]`) — la sección más elaborada
`/bonds`: lista todos los Bonds del usuario en 3 vistas intercambiables (estado vive en `searchParams`, no en navegación):
- **Lista**: tabla ordenable con mini-gráfica de tendencia de cercanía, barra de intensidad, tiempo desde última actividad.
- **Timeline**: eje Y de -10 a +10 centrado en 0, una línea por Bond, tooltip on hover.
- **Grafo**: el usuario al centro; distancia = presencia (nº de entradas), grosor de línea = intensidad promedio, tamaño de nodo = antigüedad.

Filtros compartidos: tipo, subtipo, madurez (todos/etiquetas/vínculos maduros), período (3m/6m/1a/todo).

`/bonds/[id]`: perfil de un vínculo — header con métricas rápidas, gráfica principal (línea/barras/dispersión) con el usuario como línea de referencia en 0, **modo comparar** (superpone otros vínculos, estado en `?compare=id1,id2` para que sea compartible por URL) y panel lateral de entradas relacionadas.

### 3.5 Grupos, permisos y aprobaciones (modelo de datos existe, UI no)
- `Group` / `GroupBond` / `GroupEntry`: colecciones de vínculos y entradas (ej. "viaje a Roma"), con visibilidad propia.
- `FeedPermission`: solicitud de permiso granular para ver una entrada privada específica.
- `TagApproval`: cuando etiquetas a un usuario real y le notificas, debe aprobar antes de aparecer vinculado en su lado.

### 3.6 Navegación global
Sidebar transparente con: Feed, Diario, Vínculos, Grupos (centro) + botón "+" nueva entrada y avatar de perfil (abajo).

---

## 4. Stack técnico

| Capa | Elección | Notas |
|---|---|---|
| Framework | Next.js 16.2.2, App Router, Turbopack | **Versión con breaking changes respecto al Next.js "clásico"** — antes de tocar routing/config, leer `node_modules/next/dist/docs/` (AGENTS.md lo exige) |
| UI | React 19.2.4 + Tailwind CSS v4 | Sin librería de componentes; todo hecho a mano con Tailwind + estilos inline puntuales |
| Auth | Auth.js v5 (`next-auth@5.0.0-beta.30`) | Beta — API puede tener comportamiento inestable. Config partida en `auth.config.ts` (Edge-safe, sin Prisma/bcrypt) + `auth.ts` (Node, providers reales) para que el middleware corra en Edge sin conflicto de `crypto` |
| DB | PostgreSQL (Neon, serverless) vía Prisma 7.6 + `@prisma/adapter-pg` | **El proyecto NO usa `prisma migrate` (no hay carpeta `prisma/migrations`)** — el flujo de schema es `npx prisma db push`. No correr `prisma migrate dev` aquí: al no haber historial intentará resetear la base |
| Storage | Vercel Blob | Media de las entradas (`access: "private"`) |
| Validación | Zod v4 | En server actions (`safeParse`, ojo: en Zod v4 es `error.issues`, no `error.errors`) |
| Passwords | bcryptjs | Hash en `User.passwordHash` (campo dedicado — ver §7 sobre el fix reciente) |

**Convenciones de arquitectura del propio código:**
- Server Components para fetch de datos (páginas en `src/app/**/page.tsx`), pasan props a Client Components para interactividad.
- Ningún componente hace queries de Prisma directas — siempre vía `src/lib/actions/*.actions.ts` (`"use server"`), y toda action que lee/escribe datos de usuario empieza verificando `await auth()`.
- Filtros y estado de vista viven en `searchParams` de la URL (no en estado de React puro), para que sea compartible/bookmarkeable.
- Sin framework de tests instalado — la validación es `npx tsc --noEmit` + revisión manual en navegador.

---

## 5. Modelo de datos (resumen)

```
User ──┬── Account (OAuth de Google; credentials ya NO vive aquí, ver §7)
       ├── Session, VerificationToken (Auth.js)
       ├── PrivacyConfig (1:1)  — visibilidad default, aprobación de tags, aparecer en búsqueda
       ├── FeedConfig (1:1)     — vista y métrica de gráfica preferida
       ├── Entry[] ──┬── Media[]
       │             ├── EntryBond[] ── Bond (pivot con intensity/proximity/nota)
       │             ├── FeedPermission[]
       │             ├── TagApproval[]
       │             └── GroupEntry[]
       ├── Bond[] ──┬── BondSnapshot[]  (historial temporal)
       │            ├── TagApproval[]
       │            └── GroupBond[]
       ├── Group[] ── GroupBond[], GroupEntry[]
       └── Follow (follower/following, para FRIENDS = mutual follow)
```

Enums clave: `Visibility` (PRIVATE/FRIENDS/PUBLIC), `EditAccess` (ONLY_ME/COLLABORATORS), `BondType` (PERSON/EMOTION/IDEA/BELIEF/PLACE/GROUP/OTHER), `MediaType`, `FeedView`, `ChartMetric`, `PermissionStatus`.

---

## 6. Sistema de diseño

No hay un design system documentado formalmente (los specs en `docs/superpowers/specs/` referencian un "CLAUDE.md" con estas reglas que **no existe** en el repo actual — están dispersas solo en esos documentos). Reglas observadas y a mantener:

- Bordes decorativos siempre `0.5px solid #e2e2ef` (nunca 1px).
- `border-radius`: `8px` en chips/botones pequeños, `12px` en cards.
- Solo dos pesos de fuente: `400` y `500` (nunca bold 700).
- Sentence case en todos los textos de UI (nunca Title Case ni MAYÚSCULAS salvo labels pequeños tipo overline).
- Sin gradientes ni sombras decorativas, salvo el banner de audio (`linear-gradient(135deg, #534AB7 → #7F77DD)`) que es la única excepción intencional.
- Color primario / CTA: `#534AB7` (hover `#3C3489`).
- Paleta por tipo de Bond: PERSON `#D85A30` (coral), BELIEF `#D4537E` (pink), IDEA `#BA7517` (amber), EMOTION `#1D9E75` (teal), PLACE/GROUP `#378ADD` (azul), OTHER `#9999aa` (gris).
- Touch targets mínimo `44×44px`.
- Avatares: círculo para `PERSON`, cuadrado `border-radius: 8px` para el resto.

---

## 7. Estado actual (verificado por auditoría de código, sin correr el servidor)

### Funciona / está implementado
- Auth completo (Google + Magic Link + Credentials) y middleware de protección de rutas.
- `/feed` con las 4 reglas de visibilidad y los 4 layouts de media.
- `/journal/new` con los 3 modales de tagging y guardado transaccional.
- `/bonds` (3 vistas) y `/bonds/[id]` (con modo comparar) completos.
- Búsqueda de vínculos/usuarios (`/api/bonds/search`, recién reubicada — ver abajo).

### Roto o incompleto (gaps confirmados, no hipótesis)
- **`/journal` (lista) y `/journal/[id]` (detalle) no existen** — solo `/journal/new`. `BondEntriesList` navega a `/journal/[id]` y no tiene destino.
- **`/dashboard` no existe** — `auth.config.ts` redirige ahí a usuarios autenticados que visitan `/auth`, así que ese flujo actualmente 404ea.
- **`/groups` no existe** — el modelo de datos (`Group`, `GroupBond`, `GroupEntry`) está en el schema y enlazado en el sidebar, pero no hay page ni actions.
- **`/settings` no existe** — enlazado desde el avatar de perfil en el sidebar.
- `src/app/layout.tsx` sigue con el `<title>`/`metadata` genérico de `create-next-app` ("Create Next App").
- `entry.actions.ts` tiene varios parámetros tipados como `any` (deuda técnica de tipos en `upsertBond`, `checkMaturity`, etc.).
- No hay tests automatizados de ningún tipo.

### Arreglado en esta sesión (por si el histórico de commits no lo refleja aún)
- **IDOR en `upsertBond`** (`entry.actions.ts`): permitía mutar/enlazar el `Bond` de otro usuario pasando un `bondId` ajeno en el payload — ahora se verifica ownership antes de mutar.
- **Hash de contraseña mal ubicado**: vivía en `Account.access_token` (columna pensada para tokens OAuth) — ahora en `User.passwordHash` dedicado. *Nota: usuarios que se registraron con credentials **antes** de este cambio no podrán loguearse con contraseña hasta re-registrarse o migrar su hash a mano.*
- **Ruta de búsqueda mal ubicada**: estaba en `/api/auth/bonds/search` (dentro del namespace público del middleware) en vez de `/api/bonds/search` — de hecho estaba rota (404) porque el cliente ya llamaba a la ruta correcta.
- **Bloat de `.worktrees/`**: había una copia duplicada de 1.1 GB (con su propio `node_modules`/`.next` obsoletos) dentro del repo, aumentando drásticamente la superficie que Turbopack observa en dev — eliminada.

---

## 8. Restricciones operativas para trabajar en este repo

- **El proyecto vive en un volumen USB externo** (no disco interno). Combinado con el file-watcher de Turbopack, esto ha causado cuelgues/reinicios completos de la máquina al correr `next dev`. **No asumir que `next dev` es seguro de correr sin confirmar con el usuario primero**; para verificar cambios usar `npx tsc --noEmit` y `npx eslint`.
- **No usar `prisma migrate`** — el flujo de este proyecto es `npx prisma db push` (aditivo, no destructivo). `migrate dev` intentará resetear toda la base al no encontrar historial de migraciones.
- La base de datos es una instancia real de Neon (no un contenedor local desechable) — cualquier cambio de schema toca datos reales; confirmar con el usuario antes de operaciones no aditivas.
- Next.js 16 tiene cambios de API respecto a versiones anteriores — revisar `node_modules/next/dist/docs/` antes de tocar routing, config o convenciones de archivos si algo no se comporta como se espera de Next "clásico".
- Todo mutation en una server action debe: (1) verificar `session.user.id` con `auth()`, (2) si recibe un ID de recurso ajeno (bondId, entryId, groupId) desde el cliente, **verificar ownership contra `userId` antes de escribir** — el bug del §7 es la plantilla del tipo de error a evitar.

---

## 9. Qué significa "100% funcional" para este proyecto ahora mismo

En orden de prioridad para que el producto sea usable end-to-end:

1. Cerrar los flujos de navegación rotos: crear `/journal` (lista de entradas propias) y `/journal/[id]` (detalle/edición), o si no es prioridad, quitar los enlaces que apuntan ahí para no dar la sensación de app rota.
2. Arreglar el redirect a `/dashboard` — apuntarlo a `/feed` (que es la home real) o crear un dashboard real.
3. Decidir si `/groups` y `/settings` se implementan ahora o se ocultan del sidebar hasta que existan.
4. Poner metadata real en `layout.tsx` (título, descripción, favicon del producto).
5. Reducir los `any` en `entry.actions.ts` a tipos reales (`Prisma.TransactionClient`, tipos de `EntryDraft` ya existen en `src/types/journal.ts`).
6. Considerar test coverage mínimo (al menos para las server actions con lógica de autorización/visibilidad, que es donde ya apareció un bug real).

---

## Cómo usar este documento

Pégalo completo como contexto inicial al pedirle a una IA que continúe el desarrollo de wo-shi. Combinado con lectura directa de `AGENTS.md`, `prisma/schema.prisma` y los specs en `docs/superpowers/specs/`, le da a la IA: qué es el producto, por qué existe cada pieza, qué falta, y qué no debe romper.
