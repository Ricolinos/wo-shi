<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# wo-shi — reglas de proyecto

**Contexto completo del producto:** leer `docs/project-context.md` antes de trabajar en features.

## Stack (post-migración braincode)
- Identidad: **Clerk** (`@clerk/nextjs`) — proxy protected-first en `src/proxy.ts` (convención Next 16, NO middleware.ts). El puente Clerk↔DB es `requireDbUser()` en `src/lib/user.ts` (lazy-upsert); toda server action que toque datos de usuario debe empezar por ahí.
- Datos: **Supabase Postgres** vía Prisma 7 + `@prisma/adapter-pg`. Runtime usa `DATABASE_URL` (pooler 6543); comandos CLI usan `DIRECT_URL` (5432) vía `prisma.config.ts`.
- pgvector ya habilitado (fase IA). Pendientes de integrar: Vercel AI SDK, Inngest, Sentry, PostHog, Once UI. Stripe reservado para fase futura.

## Reglas duras
- **Secretos**: viven SOLO en `.env.local` (gitignored). Nunca leerlos, imprimirlos en salida, commitearlos ni pegarlos en chat. Al verificar llaves, comprobar solo nombres/presencia (`grep -oE '^[A-Z_]+'`) o hacer requests sin echo de valores.
- **Prisma**: usar `npx prisma db push` — este proyecto NO usa `prisma migrate` (no hay carpeta de migraciones; `migrate dev` intentaría resetear la base). La base es real (Supabase), no un contenedor desechable.
- **Dev server**: NO correr `next dev` sin confirmar con el usuario. El proyecto vive en un volumen USB externo y la máquina se ha colgado/reiniciado por presión de memoria. Antes de levantar: revisar `vm.swapusage` y procesos `next-server` existentes. El puerto 3000 suele estar ocupado por otro proyecto (usar 3001).
- **Autorización en actions**: todo ID de recurso que venga del cliente (bondId, entryId, groupId) se verifica contra el `userId` de la sesión antes de escribir (hubo un IDOR real en `upsertBond` — no repetirlo).
- **Verificación estándar**: `npx tsc --noEmit` + `npx eslint` (no hay framework de tests).

## Diseño
- Sistema propio en Tailwind: bordes `0.5px solid #e2e2ef`, radius 8px chips / 12px cards, solo font-weight 400/500, sentence case, sin gradientes/sombras (única excepción: banner de audio). Primario `#534AB7`. Paleta por tipo de Bond en `src/lib/bond-subtypes.ts`.
