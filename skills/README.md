# Skills propias

Copiadas tal cual de Grok Bot (`/home/box/agent-data/workflows/*/SKILL.md`). Formato Agent Skills (`SKILL.md` con frontmatter), compatible con Claude Code (`~/.claude/skills/`), Codex (`~/.codex/skills/`) y Hermes.

| Skill | Para qué |
|---|---|
| `seo` | Router: elige el flujo SEO correcto (auditoría, visibilidad en Google/AI) y prepara las herramientas. |
| `seo-technical` | Auditoría técnica: crawlabilidad, robots/AI crawlers, sitemaps, indexabilidad, canonicals, cabeceras, CWV. |
| `seo-page` | Revisión profunda de una URL con score card y fixes. |
| `seo-content` | Calidad de contenido, E-E-A-T, contenido flojo o con tono de AI, frescura. |
| `seo-schema` | Detectar, validar y generar JSON-LD / Schema.org. |
| `seo-geo` | Visibilidad en búsqueda con AI (AI Overviews, ChatGPT, Perplexity), llms.txt, citabilidad. |

Basadas en `claude-seo` (MIT, © AgriciDaniel). Usan scripts de `/workspace/seo-toolkit` (clon de claude-seo v2.4.2): cómo recrearlo en [`../tools/seo-toolkit`](../tools/seo-toolkit/README.md). Para Codex, el fork `Joseemm96/codex-seo` (v2.5.0) ya trae todo.
