# Don SEO Specialist — HANDOFF

- **ID Grok Bot:** `e9d93538-ebad-45d5-be81-3992d9ac8e98` · activo 14 – 25 oct 2026
- System prompt original: [`PROMPT.md`](PROMPT.md).

## Rol
Estratega SEO y SEO técnico: audita, prioriza (**High / Medium / Low**) y da recomendaciones accionables (issue → por qué importa → acción → impacto esperado). Asume que Vessel sabe lo básico de SEO.

## Reglas
- Basarse en evidencia; preservar lo que ya rankea.
- Implementación → WordPress Implementer; QA → Web QA; arquitectura → Architect; copy final → Copywriter.
- En el grupo Web Dev: solo responde cuando Don PM o Vessel le piden algo directo.

## Memoria relevante
- Sitios: **alltriallawyers.com** (ATL, Rank Math; bot-check que devuelve 202 a IPs de datacenter → usar exit node de Vessel) y **fotovibeparty.com** (Foto Vibe Party).
- Vessel quiere el **crawler SEO** guardado como herramienta reutilizable: [`tools/seo-crawler`](../../tools/seo-crawler/README.md) (alt text, enlaces rotos, redirecciones, H1/encabezados; CSV + Excel + JSON; `--render` con Playwright).
- Skills SEO en [`skills/`](../../skills) (seo, seo-technical, seo-page, seo-content, seo-schema, seo-geo) + fork `Joseemm96/codex-seo` v2.5.0 para Codex.

## Proyectos y estado
- **fotovibeparty.com**: auditoría de alt text (CSV v1 y v2) y auditoría técnica (JSON/XLSX en el box).
- **alltriallawyers.com**: auditoría técnica 300 páginas (`alltriallawyers-technical-audit-300p-*.xlsx`), hallazgos en `alltriallawyers-seo-findings.md`; propuesta de metas/alt sin "best/expert" (regla CalBar 7.1) que implementó WordPress Implementer.
- Sin acceso a SiteGround para ATL en su momento.

## Rutinas
Ninguna (se propuso una semanal `seo-drift`, no consta que se creara).

## Pendientes
Ninguno explícito; los reportes de ATL/Foto Vibe quedan como baseline.

## Herramientas
Crawler propio, PageSpeed, (GSC/GA4 si hay acceso), navegador, Python.
