# Don Bot · CEO | One Bot Army — HANDOFF

- **ID Grok Bot:** `5d10bcbb-24a2-4e78-b59b-87e47a7b279c` · creado ~13 oct 2026
- **Estado:** activo hasta el fin de la suscripción. Fuente: memoria del bot + resumen de su chat (el historial completo del chat principal no es exportable).

## Rol
Asistente principal y generalista de Vessel ("Don Bot"). Recibe cualquier pedido, lo resuelve o lo delega a los bots especialistas. Tenía computadora propia (box Linux) con navegador, shell y conectores: Gmail, Drive, Docs, Sheets, Notion, ClickUp, X, GitHub.

## Persona / instrucciones
- Español venezolano, corto y cálido; inglés si él escribe en inglés.
- Ejecuta sin preguntar de más cuando es reversible; pide aprobación para todo lo externo (ver `USER.md`).
- Entrega el resultado en el mismo turno (no cerrar con "ya te aviso" sin dar el resultado).
- Verifica precios, fechas y datos en la fuente oficial abierta en el momento y enlaza la fuente.

## Reglas (además de las globales de `USER.md`)
- Upwork: nunca iniciar sesión; responder por los correos de notificación con borrador aprobado.
- WhatsApp Web: solo lectura; en el keepalive no abrir chats, avisar solo si aparece el QR.
- Instagram solo themavops (solo lectura). Tailscale exit node apagado salvo pedido.
- No descargar videos salvo pedido. No tocar material filtrado (TSJ / Maikel Moreno).
- En el Mac de Vessel puede correr `claude -p` / `codex exec` en una carpeta de proyecto, **cada comando con aprobación** y con el Mac encendido.

## Memoria relevante
- Vessel usa Claude Code y Codex; contexto compartido vía `docs/progreso.md` + `AGENTS.md`.
- Fork **`Joseemm96/codex-seo`** (port a Codex de AgriciDaniel/claude-seo), actualizado a **v2.5.0**. Se hizo una revisión completa y fixes vía cloud agent (PRs, incluido el arreglo del rewrite TOML en Windows). Retest: 1,084 tests OK, 37 skills portables.
- Quiere probar **Hermes** en un VPS + LLMs locales en el Mac mini (24 GB) por Tailscale.
- Tailscale: el box era `don-bot-box-1` en su tailnet; exit node `joses-mac-mini` (Airtek, Maracaibo). Se usó para Instagram y para el bot-check de alltriallawyers.com; se apagó el 25 oct porque cortaba internet.
- X: bloqueo masivo de los 776 miembros de una lista de X (lista `2116659176894071283`) **terminado** el 7 nov (lento por límites 429 de la API; Vessel opinó que manual era más rápido → avisar de límites de X antes de tareas masivas).
- Conocimiento útil reciente: GTA VI sale el 19 nov 2026 en Xbox Series X|S (~212 GB, precarga solo con compra); LiFePO4 > gel para respaldo con inversor; Windscribe Pro = dispositivos ilimitados, Proton VPN Plus = 10.
- Contactos de bots: delegaba a Don Maracucho (eventos), Don Video (clips), Don Viaje (hoteles), Don Researcher, equipo web.

## Rutinas (America/Caracas)
| Rutina | Horario | Qué hace |
|---|---|---|
| `revisar-sesi-n-de-whatsapp-web` (keepalive WhatsApp) | ~8:00, 14:00 y 20:00 diario | Abre solo `web.whatsapp.com` en la pestaña existente, sin entrar a ningún chat. Si aparece el **QR**, avisa a Vessel para re-vincular; si no, silencio. |
| `vigilar-ofertas-vpn-black-friday` | ~9:00 diario hasta el **28 nov 2026** | Revisa precios oficiales de Proton, PIA, Windscribe, Surfshark, Mullvad (y ExpressVPN/NordVPN). Avisa **solo** si hay una bajada nueva vs. lo ya alertado. Después del 28 nov: manda resumen final y borra la rutina. |

Ver detalle en [`../../routines/ROUTINES.md`](../../routines/ROUTINES.md).

## Proyectos y estado (10 nov 2026)
- **VPN Black Friday** (estado en el box `/workspace/vpn-deals-status.txt`, última revisión 10 nov 9:06 AM):
  - Windscribe Pro **$29/año** con código `BEEPBOOP` (normal $69), renueva a $29, hasta 30 nov — ya alertado (8 nov).
  - Proton VPN Plus 1 año **$35.88**, luego $83.88/año; 2 años $83.76 — ya alertado (7 nov).
  - PIA 3 años + 4 meses **$81.20**; Surfshark Starter 24+3 meses $67.23; Mullvad €5/mes fijo.
  - ExpressVPN Basic $84 / 28 meses (renueva $99.95/año), **tiene split tunneling por app en macOS** (versión de su web, no App Store). NordVPN Basic $94.23 / 27 meses (renueva $139.08/año), sin split tunneling por app en macOS. Recomendado Express si necesita split tunneling en el Mac. Privacidad Express: no-logs de navegación/DNS/IP, servidores RAM (TrustedServer), auditoría KPMG puntual; dueña Kape (ex-Crossrider) = punto de confianza corporativa.
- **codex-seo**: revisión + 9 fixes + fix Windows TOML hechos. Artefactos en el box: `codex-seo-review.md`, `codex-seo-retest.md`.
- **X list block**: completo (776/776).
- **Handoff** (este repo): creado el 10 nov 2026.

## Pendientes / ojo
- Posibles pendientes ya recordados una vez (no insistir salvo que pregunte): responder a **Jeff H. (Go Contracting)** en Upwork; baseline de rankings de **DRM**; blog de **NorthStar**.
- Recrear el keepalive de WhatsApp solo si el nuevo agente mantiene una sesión de WhatsApp Web propia.

## Herramientas / conectores
Gmail, Google Drive/Docs/Sheets, Notion, ClickUp, X API, GitHub, navegador con WhatsApp Web e Instagram (themavops), Tailscale, shell Linux, acceso por aprobación al Mac mini (Claude Code / Codex).
