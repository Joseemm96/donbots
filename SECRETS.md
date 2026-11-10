# SECRETS.md — qué credenciales hacen falta y dónde viven (SIN valores)

> Este archivo **no** contiene ningún secreto. Solo dice qué cuenta/conector necesita cada bot y dónde está la credencial. Nunca pegues valores aquí.

| Qué | Para qué bot(s) | Dónde vive |
|---|---|---|
| Gmail personal (OAuth) | Don Bot (Upwork por correo), Don Maracucho (newsletter), Don Researcher | Cuenta Google de Vessel; reconectar el conector en el nuevo agente |
| Google Drive / Docs / Sheets (OAuth) | WordPress Implementer (logs de mantenimiento), Finanzas ("Comisiones binance"), PM (sheet de clientes) | Misma cuenta Google |
| ClickUp (OAuth/API token) | Don Project Manager, WordPress Implementer, Web QA | Cuenta ClickUp de Vessel (workspace de BretzMedia y otros) |
| Notion (OAuth) | Don Bot / Researcher (ocasional) | Cuenta Notion de Vessel |
| X / Twitter API (OAuth) | Don Bot (bloqueos, listas), Researcher (digest @theo) | Cuenta @trimavardito |
| GitHub | Código (codex-seo, este repo) | Cuenta `Joseemm96` (`gh auth login` en el nuevo entorno) |
| WhatsApp Web (sesión vinculada por QR) | Don Bot (keepalive), Don Viaje | Se vuelve a vincular escaneando el QR desde el teléfono de Vessel |
| Instagram **themavops** | Don Maracucho, Don Viaje | Login por enlace de correo (cuenta de correo Proton de Vessel). Nunca @mavarezmz |
| Tailscale | Box/VPS para salir por Maracaibo | Tailnet de Vessel; exit node `joses-mac-mini` |
| SSH / SFTP de clientes (Liquid Web cPanel, WP Engine, etc.) | WordPress Implementer | Llaves SSH en el Mac de Vessel / en el agente; algunas contraseñas aparecen en los Google Docs de cada cliente (no copiarlas). En el box de Grok Bot había un archivo en `~/.secrets/` (no exportado) |
| wp-admin de clientes | WordPress Implementer, Web QA | Vessel inicia sesión él mismo en el navegador del agente |
| Upwork | — | **Nunca** usar login; solo correos de notificación |
| Binance / Zelle | Finanzas (solo cálculos) | No se necesita acceso; Vessel manda capturas |
| GTmetrix / DebugBear | WordPress Implementer | Cuenta de Vessel o enlaces de DebugBear en cada Doc de cliente |
| Google Search Console / GA4 / PageSpeed API / DataForSEO (opcional) | SEO Specialist, skills de SEO | Cuentas de clientes / claves propias (no incluidas) |
| Correo propio del bot (`thedonbot@mail.grokbot.com`) | Don Maracucho | Era de Grok Bot; desaparece al cancelar. Reemplazar por un remitente propio (p. ej. Gmail API o Resend) |
