# Grok Bots — Handoff de Vessel

Respaldo privado de **todos los bots que Vessel (José Mavarez · GitHub `Joseemm96` · X `@trimavardito`) tenía en Grok Bot**, armado el 10 nov 2026 antes de dejar de renovar la suscripción. Sirve para recrear cada bot en **Hermes**, **Claude Code**, **Codex** o cualquier agente que lea Markdown.

> Nada de este repo contiene contraseñas, tokens, cookies, códigos ni datos de tarjetas. Lo que hace falta para autenticar está listado (solo por nombre) en [`SECRETS.md`](SECRETS.md).

## Empieza aquí
1. [`AGENTS.md`](AGENTS.md): instrucciones para cualquier agente que lea este repo.
2. [`USER.md`](USER.md): quién es Vessel, sus preferencias y las **reglas globales** (aplican a todos los bots).
3. `bots/<bot>/HANDOFF.md`: rol, reglas, memoria, rutinas, proyectos y pendientes de cada bot. Algunos traen `PROMPT.md` con su system prompt original.
4. [`routines/ROUTINES.md`](routines/ROUTINES.md): todas las rutinas programadas en un solo lugar, con su horario y su prompt resumido.
5. `skills/`: skills propias (formato `SKILL.md`, compatible con Claude Code / Codex / Hermes).
6. `tools/seo-crawler/`: el crawler SEO reutilizable (Python).

## Bots
| Bot | Carpeta | En una línea |
|---|---|---|
| Don Bot · CEO \| One Bot Army | [`bots/don-bot`](bots/don-bot/HANDOFF.md) | Asistente principal y generalista: correo/Upwork, WhatsApp (solo lectura), X, VPN, Tailscale, código en el Mac, coordina a los demás. |
| Don WordPress Implementer | [`bots/don-wordpress-implementer`](bots/don-wordpress-implementer/HANDOFF.md) | Dev WordPress senior: mantenimientos mensuales (updates + log en Google Doc + GTmetrix/DebugBear) y tareas de clientes. |
| Don Web Architect | [`bots/don-web-architect`](bots/don-web-architect/HANDOFF.md) | Arquitecto web: diseña soluciones y planes antes de implementar; no toca producción. |
| Don Web QA | [`bots/don-web-qa`](bots/don-web-qa/HANDOFF.md) | QA web con navegador/Playwright; reporta con severidad y PASS / PASS WITH ISSUES / FAIL. |
| Don SEO Specialist | [`bots/don-seo-specialist`](bots/don-seo-specialist/HANDOFF.md) | SEO técnico/on-page; auditorías priorizadas High/Medium/Low; dueño del crawler SEO. |
| Don Project Manager · Click Up Master | [`bots/don-project-manager`](bots/don-project-manager/HANDOFF.md) | PM sobre ClickUp: carga de trabajo, prioridades, y cambios solo con aprobación. |
| Don Researcher · Averiguador y brollero profesional | [`bots/don-researcher`](bots/don-researcher/HANDOFF.md) | Investigación, resúmenes de posts/videos, tasa BCV, digest diario de @theo sobre AI. |
| Don Finanzas · excel sheet specialist | [`bots/don-finanzas`](bots/don-finanzas/HANDOFF.md) | Hoja "Comisiones binance" (Zelle/Binance) y cálculos BCV vs. paralelo. |
| Don Maracucho · Que hay pa hoy | [`bots/don-maracucho`](bots/don-maracucho/HANDOFF.md) | Newsletter de eventos y promos en Maracaibo (Instagram themavops + ticketeras). |
| Don Viaje | [`bots/don-viaje`](bots/don-viaje/HANDOFF.md) | Viajes: cotiza hoteles en Margarita por WhatsApp (con aprobación) y arma reportes comparativos. |
| Don Video | [`bots/don-video`](bots/don-video/HANDOFF.md) | Edición: transcribe (Whisper), recorta con ffmpeg y quema subtítulos. |
| Don LCL3 | [`bots/don-lcl3`](bots/don-lcl3/HANDOFF.md) | Creado el 23 oct sin asignación; nunca se usó. |
| Grupo "Web Dev" | [`bots/_grupo-web-dev`](bots/_grupo-web-dev/HANDOFF.md) | Chat grupal: Vessel + PM + WordPress + Architect + SEO + QA (+ Copywriter). |

**No encontrados:** *Don T3 Codes* (manejaba Claude Code/Codex vía T3 Code) y *Don Copywriter* aparecen en la memoria y en el grupo, pero ya no existen como bots en la cuenta; no hay historial que exportar.

## Cómo usarlo
### Hermes
- Pon `USER.md` como memoria/perfil del usuario y el `HANDOFF.md` (o `PROMPT.md` + `HANDOFF.md`) del bot como su personalidad/instrucciones.
- Recrea las rutinas de [`routines/ROUTINES.md`](routines/ROUTINES.md) con el scheduler de Hermes (cron). Las horas están en **America/Caracas** (UTC-4).
- Copia `skills/*` a la carpeta de skills de Hermes.

### Claude Code
- Clona el repo, o copia el bot que quieras a tu proyecto. `CLAUDE.md` puede ser solo `@AGENTS.md` (o "Lee AGENTS.md").
- Skills: copia `skills/<skill>` a `~/.claude/skills/` (globales) o `.claude/skills/` (por proyecto).
- Para un bot concreto: `claude -p "Actúa según bots/don-web-qa/HANDOFF.md y PROMPT.md. Tarea: ..."`.

### Codex
- Codex lee `AGENTS.md` de la raíz automáticamente. Para un bot: `codex exec "Sigue bots/don-wordpress-implementer/HANDOFF.md ..."`.
- Skills: copia a `~/.codex/skills/` (o usa tu fork `Joseemm96/codex-seo` para las de SEO).
- Contexto compartido entre Claude Code y Codex: convención de Vessel → `docs/progreso.md` que ambos leen/escriben + `AGENTS.md` (con `CLAUDE.md` apuntando a él).
