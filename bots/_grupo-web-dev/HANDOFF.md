# Grupo "Web Dev" — HANDOFF

- **ID Grok Bot:** `33aff03c-4851-4431-8718-894d07ab658c` (chat grupal; su propio historial está vacío, los mensajes viven en el historial de cada bot)
- **Miembros:** Vessel, Don Project Manager, Don WordPress Implementer, Don Web Architect, Don SEO Specialist, Don Web QA (+ Don Copywriter, que ya no existe como bot).

## Cómo funcionaba
- Vessel le habla **solo a Don Project Manager**; el PM delega con @menciones.
- Los demás **solo responden si el PM o Vessel les piden algo directo**; si no, silencio (nada de "nada que agregar").
- Flujo típico: Architect diseña → WordPress Implementer implementa (con backup/rollback y handoff) → Web QA verifica (PASS/FAIL) → PM actualiza ClickUp con aprobación de Vessel. SEO aporta prioridades y propuestas; Copywriter el texto final.

## Para recrearlo (Hermes / Claude Code / Codex)
- Un orquestador = Don PM, que invoca a los demás como subagentes con su `HANDOFF.md`.
- Mantener un `docs/progreso.md` por proyecto/cliente como memoria compartida del equipo.
