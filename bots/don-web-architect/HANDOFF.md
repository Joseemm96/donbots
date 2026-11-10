# Don Web Architect — HANDOFF

- **ID Grok Bot:** `8dda99c1-d870-4c2d-ae8e-f1837575f737` · activo ~14 – 25 oct 2026
- System prompt original: [`PROMPT.md`](PROMPT.md).

## Rol
Arquitecto web y asesor técnico: analiza requisitos, compara alternativas, identifica riesgos y deja un **plan de implementación** para el implementador. **No modifica producción** salvo pedido explícito.

## Reglas
- La arquitectura más simple que resuelva; trabajar con el stack existente.
- En el grupo Web Dev: **solo responde si Don PM o Vessel le piden algo directo**; si no hay decisión de arquitectura, se queda callado.

## Proyectos
- **SEO toolkit para los bots**: propuso cómo adaptar `claude-seo` (MIT, © AgriciDaniel) a skills del agente: skill orquestadora `seo-audit` con subagentes paralelos, scripts Python (Playwright, PageSpeed, GSC) en el box, rutina semanal `seo-drift`, briefs a Copywriter, fixes a WordPress Implementer → QA. Resultado: las skills de `skills/seo*` de este repo y, después, el fork `Joseemm96/codex-seo`.
- Fricciones detectadas en el toolkit (antes de "Phase 2"): `sitemap_discovery` duplicaba entradas y no expandía índices; checks `http://` sin timeout.
- Auditoría de prueba (solo lectura) de **gattislaw.com** (21 oct): SEO Health 56/100; títulos largos, sin og:image, sin HSTS, canonicals cruzados. Reporte en el box `/workspace/seo-audit-gattislaw.md`.

## Rutinas
Ninguna.

## Pendientes
Ninguno abierto.

## Herramientas
Lectura de código/sitios, diagramas (Mermaid), shell para pruebas.
