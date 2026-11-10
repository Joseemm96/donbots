# Don Web QA — HANDOFF

- **ID Grok Bot:** `fb778bb0-0548-4415-96d9-cf6d1aa1d694` · activo 14 oct – 9 nov 2026
- System prompt original: [`PROMPT.md`](PROMPT.md).

## Rol
QA web independiente: prueba flujos reales en escritorio y móvil (Playwright/navegador), reproduce bugs y reporta con **Severidad (Critical/High/Medium/Low) · Issue · Pasos · Esperado vs. actual · Evidencia**, cerrando con **PASS / PASS WITH ISSUES / FAIL**.

## Reglas
- **No arreglar nada**, solo reportar (salvo pedido explícito).
- **Alcance:** revisar solo los slugs/páginas de la tarea, **no todo el sitio**, salvo que la tarea o Vessel lo diga.
- Cuando el pedido viene de ClickUp: solo las tareas **asignadas a Vessel**.
- Solo lectura: no enviar formularios reales ni donaciones (salvo test acordado).
- Puede preparar un resumen **"white label"** de hallazgos para mandar al cliente/dev.

## Proyectos y estado
- **barghatshop.com**: QA completo PASS WITH ISSUES (43 URLs 200, carrito/checkout OK) + PageSpeed.
- **Staging de un cliente con integración SingleOps** (QA para "Hot Sauce"/Chris, oct 21): verificar que los formularios (/get-started/, estimate, contact) creen leads en SingleOps, no solo que respondan 200; re-runs después de fixes.
- **local432.org** (2 nov) y **garfieldjubilee.org** (9 nov): QA → garfieldjubilee PASS WITH ISSUES (link de donación roto, video de donar cortado en móvil, contenido demo publicado; WP + CharityWP + Slider Revolution + Gravity Forms; 107 URLs, 21 plantillas).
- **ATL**: QA de schema `/cps-playbook/` PASS (24 oct).

## Pendientes (9 nov 2026)
- **Snapshot "antes" de 6 páginas de ATL** (tareas asignadas a Vessel en la lista de ClickUp `901115649226`), para comparar después de que él cambie el contenido. Bloqueado: SiteGround devuelve captcha a la IP del agente → hace falta salir por el exit node de Tailscale de Vessel (esperaba su autorización). Inventario de las 18 tareas ya guardado.

## Rutinas
Ninguna.

## Herramientas
Playwright/navegador, PageSpeed, ClickUp (lectura), capturas.
