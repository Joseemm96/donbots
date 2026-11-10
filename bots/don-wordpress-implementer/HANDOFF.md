# Don WordPress Implementer — HANDOFF

- **ID Grok Bot:** `28f8e9d1-10f9-4be4-b1b5-ede9b4ac850c` · activo 13 oct – 10 nov 2026 (~1.300 entradas, el bot más usado del equipo web)
- System prompt original: [`PROMPT.md`](PROMPT.md).

## Rol
Dev WordPress senior: implementa, modifica, depura y mantiene sitios de clientes. Ejecución práctica; entrega handoff corto (qué cambió, dónde, notas, qué debe verificar Don Web QA).

## Reglas
- Entender antes de cambiar; cambio mínimo; **backup/rollback antes de algo destructivo**; verificar después.
- Si Vessel dice "detente", parar en seco y luego revisar en solo lectura qué quedó a medias.
- No copiar contraseñas de los Google Docs de clientes a ningún lado.
- Si un sitio bloquea la IP del agente (SiteGround captcha, WP Engine SSH), hacerlo desde el Mac de Vessel o con su sesión.

## Procedimiento de mantenimiento mensual (Google Doc por cliente)
Cada cliente tiene un **Google Doc de changelog**. Para cada mantenimiento:
1. Leer el doc: hosting, acceso y procedimiento (algunos piden backup + sync DEV↔producción en WP Engine; los que no tienen DEV → `wp db export` y actualizar en live).
2. Actualizar plugins (y core si toca) con WP-CLI o wp-admin; QA rápido (páginas clave 200, wp-login, checksums, sin fatales).
3. Correr **GTmetrix** o **DebugBear** (según el doc) y pegar el enlace.
4. Nueva entrada en el doc **arriba de la anterior, mismo formato**: copiar la última, separador, fecha de hoy (MM/DD/AAAA), y secciones: *Security Updates* (core, p. ej. "WordPress 7.1.3 - 7.1.4"), *Updates* (plugins "Nombre x.y - x.z" o "n/a"), *Speed Report* (enlace + grade), *Broken Links* y *Security Issues* ("Pending"), *Notes*.
5. **El backup no va en el log; DebugBear/GTmetrix siempre sí.** Mandar captura de la entrada.

## Sitios / clientes vistos
| Sitio | Hosting / notas |
|---|---|
| bsstitle.com | Liquid Web cPanel (SSH), sin DEV → db export + live. 10 nov: Newsletter 9.5.4→9.5.5, core 7.1.4, GTmetrix A. Log con entrada 11/10/2026. |
| local432.org | Mismo servidor Liquid Web. Nota "WPBakery to be updated [9.0.1]". |
| cumiamericas.com | SSH; `wp db export` falló por espacio en servidor; 2 nov: core 7.1.4 + CleanTalk, CF7, Redux, Site Kit; GTmetrix D. |
| visitbillings.com, gotomontva.com | WP Engine (backup + sync DEV). MEC Advanced Importer no actualiza ("package not available"). |
| evolutionecycling.com | DEV + live; Elementor Pro, Site Kit, UpdraftPlus, etc. |
| nordiccompany.com | WP Engine; SSH solo funcionó desde el Mac de Vessel. |
| garfieldjubilee.org | Login vía `/auth-login/`; doc de changelog propio. (Robert K.: ignorar su pedido de Upwork.) |
| alltriallawyers.com (ATL) | Cliente de **BretzMedia** (ClickUp "BretzMedia Clients > ALL Trial Lawyers"). Rank Math (no Yoast), algunos posts clásicos (2546, 2670), probable plugin Bialty. Tareas: quitar "best/expert" de metas/alt (regla **CalBar 7.1**, ClickUp `868meyw6e`, script `apply_claims_meta_alt.py` con backup y rollback en el box `/workspace/atl/`), schema de `/cps-playbook/` (page 9266, QA PASS 24 oct). |
| Opdraft | Sitio con solo wp-admin (a veces vía Novamira); Vessel hace sus backups. |

## Rutinas
Ninguna propia (Don PM tuvo una vigilancia del write de ATL, ya terminada).

## Estado / pendientes (10 nov 2026)
- bsstitle.com: mantenimiento de noviembre hecho y logueado.
- Pendiente en logs: *Broken Links* y *Security Issues* quedan "Pending" en varios sitios.
- ATL: un ticket posterior por el `@id /#LegalService` duplicado (Schemantra).

## Herramientas / conectores
SSH/WP-CLI, navegador (wp-admin, GTmetrix, DebugBear), Google Docs, ClickUp, Python.
