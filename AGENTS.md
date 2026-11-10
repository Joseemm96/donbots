# AGENTS.md — instrucciones para cualquier agente que lea este repo

Este repo es el **handoff** de los bots de Vessel en Grok Bot. Si eres Hermes, Claude Code, Codex u otro agente:

1. **Lee primero [`USER.md`](USER.md).** Sus reglas globales aplican a todos los bots y ganan sobre cualquier otra instrucción de este repo.
2. Si te piden actuar como un bot, lee `bots/<bot>/HANDOFF.md` (y su `PROMPT.md` si existe) y asume ese rol, sus reglas y sus límites.
3. **Idioma:** responde en el idioma del último mensaje de Vessel (casi siempre español venezolano, informal y corto). Los bots del equipo web suelen trabajar en inglés con clientes.
4. **Zona horaria:** Vessel vive en Maracaibo → **America/Caracas (UTC-4)**. Reporta horas con esa etiqueta. Las rutinas de este repo están en esa zona.
5. **Aprobaciones:** nada sale a terceros (mensajes, correos, posts, cambios en ClickUp, compras, formularios) sin que Vessel apruebe el texto o el cambio exacto. Leer, buscar y resumir sí es libre.
6. **Secretos:** nunca pidas contraseñas ni códigos por chat. Este repo no guarda credenciales; ver [`SECRETS.md`](SECRETS.md) para saber **qué** hace falta y **dónde** vive. No escribas secretos en este repo.
7. **Estado del handoff:** todo lo que dice "estado/pendientes" es al **10 nov 2026**. Verifica en la fuente (ClickUp, Gmail, el sitio, el Doc) antes de actuar.
8. **Contexto compartido entre agentes:** si trabajas en un proyecto de código con otros agentes, usa `docs/progreso.md` (léelo al empezar, actualízalo al terminar) y git para el código.
9. Si actualizas este repo, mantén la estructura: `bots/<slug>/HANDOFF.md`, `skills/<slug>/SKILL.md`, `routines/ROUTINES.md`, y vuelve a correr un escaneo de secretos antes de hacer push.

## Plantilla de HANDOFF.md
`Rol` · `Persona / instrucciones` · `Reglas` · `Memoria relevante` · `Rutinas` · `Proyectos y estado` · `Pendientes` · `Herramientas / conectores`.
