# Rutinas (todas en America/Caracas, UTC-4)

Estado al 10 nov 2026. En Grok Bot cada ejecución podía correrse ±15 min. Formato cron: `min hora día mes día_semana`.

| Bot | Rutina | Cron (Caracas) | Activa | Prompt resumido |
|---|---|---|---|---|
| Don Bot | WhatsApp Web keepalive (`revisar-sesi-n-de-whatsapp-web`) | `0 8,14,20 * * *` | Sí | Abrir solo `web.whatsapp.com` en la pestaña existente, **sin abrir ningún chat**. Si aparece el QR → avisar a Vessel para re-vincular; si la sesión está bien → silencio. |
| Don Bot | VPN Black Friday watch (`vigilar-ofertas-vpn-black-friday`) | `0 9 * * *` hasta 28 nov 2026 | Sí | Revisar páginas oficiales de Proton, PIA, Windscribe, Surfshark, Mullvad, ExpressVPN, NordVPN; comparar con `vpn-deals-status.txt`; avisar solo por una bajada nueva (con enlace oficial y precio de renovación). Tras el 28 nov: resumen final y borrar la rutina. |
| Don Researcher | Digest diario de @theo sobre AI | `0 21 * * *` | Sí | Leer los posts de @theo en X de las últimas 24 h; mandar en español las novedades de AI en viñetas, cada una con enlace al post. Si no hay nada relevante, una línea. |
| Don Maracucho | Recolector diario de eventos en Instagram | `0 20 * * *` | Sí | Con themavops (solo lectura) revisar posts ~24 h y stories de las cuentas seguidas; anotar eventos/promos nuevos sin duplicados en `instagram-eventos-pendientes.md`. Silencio salvo bloqueo/login de Instagram. |
| Don Maracucho | Eventos de Maracaibo en Instagram (newsletter) | `0 8 * * 1,5` y `0 11 * * 3` | Sí | Juntar lo recolectado + revisión fresca + Ticketplate y MDTicket; armar el newsletter (Eventos / Entradas / Promos / Dato extra, solo lo nuevo, 🔄 para actualizaciones); enviarlo a `joseemm96@gmail.com` y dejarlo en el chat; registrar lo enviado. |
| Don Maracucho | Vigilancia kit "Saca el Pecho" (Licores El Ventarrón) | `*/30 10-19 * * *` | No (cumplida 30 oct) | Revisar posts/stories de @licoreselventarron; avisar apenas publiquen el kit con precio/condiciones/sucursal; si no, silencio; luego quitarse. |
| Don Project Manager | ATL meta/alt write watch | `*/20 * * * *` | No (terminada) | Vigilar log/proceso de un write largo de WordPress Implementer; avisar solo al terminar (conteos, backup, rollback, limpiar caché) o si se atasca >30 min; nunca escribir en el sitio. |
| Don Viaje | Enviar LD Palm Beach y Ecoland | `0 7 23 10 *` | No (única, 23 oct) | Reintento de 2 mensajes de WhatsApp ya aprobados, verificando antes que no se hayan enviado. |

Don Finanzas, Don Video, Don Web Architect, Don SEO Specialist, Don Web QA, Don WordPress Implementer y Don LCL3 no tenían rutinas.

## Ejemplo para Hermes / cron
```cron
CRON_TZ=America/Caracas
0 21 * * *   hermes run --agent don-researcher "Digest diario de @theo sobre AI (ver bots/don-researcher/HANDOFF.md)"
0 20 * * *   hermes run --agent don-maracucho  "Recolector diario de eventos en Instagram"
0 8 * * 1,5  hermes run --agent don-maracucho  "Newsletter de eventos de Maracaibo"
0 11 * * 3   hermes run --agent don-maracucho  "Newsletter de eventos de Maracaibo"
```
(Ajusta el comando a la CLI real de Hermes.)
