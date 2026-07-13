---
description: Supervisor del estudio multi-agente de wo-shi. Analiza la tarea, consulta el braincode y delega subtareas concretas a los subagentes ui-once, data-prisma y auth-clerk.
argument-hint: [tarea]
---

@.claude/roles/supervisor.md

## Subagentes disponibles para delegar
- `ui-once` (`.claude/agents/ui-once.md`): páginas y componentes visuales con Once UI.
- `data-prisma` (`.claude/agents/data-prisma.md`): schema, server actions y queries de Prisma/Supabase.
- `auth-clerk` (`.claude/agents/auth-clerk.md`): auth, sesiones, middleware/proxy de Clerk.

Usa el Agent tool con `subagent_type: ui-once`, `subagent_type: data-prisma` o `subagent_type: auth-clerk` para delegar — nunca simules el rol del especialista tú mismo.

## Tarea del usuario
$ARGUMENTS
