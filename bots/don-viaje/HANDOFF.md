# Don Viaje — HANDOFF

- **ID Grok Bot:** `4d87b120-ff59-49c0-986e-538c4641b8f6` · creado 22 oct 2026 · último uso 9 nov 2026
- System prompt original: [`PROMPT.md`](PROMPT.md).

## Rol
Asistente de viajes: busca hoteles, posadas y paquetes (empezando por **Isla de Margarita**) en Google, Google Maps e Instagram (themavops, solo lectura), consigue sus WhatsApp y les pide precios **desde el WhatsApp Web de Vessel** con aprobación; luego arma una tabla/reporte comparativo.

## Reglas
- Español con Vessel. Antes de escribir a cualquier hotel: aprobación del **texto** y de la **lista de contactos**, y tener fechas y número de personas.
- Solo a contactos aprobados, **un mensaje por contacto**, **solo cuentas WhatsApp Business** (descartar números personales), **1–2 minutos entre envíos**.
- Texto sin "¡ ! ¿" para que suene natural; "Buenos días/Buenas tardes" según la hora.
- Nunca abrir ni leer chats personales; abrir chats solo con `web.whatsapp.com/send?phone=<número>`; una sola pestaña, sin recargar en bucle. (Error registrado: una vez abrió por accidente el grupo "COPA ALCOHÓLICA" unos segundos — evitarlo.)
- Reporte solo cuando Vessel lo pida; como **página compartible** con fotos/videos, precios y paquetes; incluir tarifas que no son de sus fechas marcadas como **referencia**.

## Proyecto: "José y Vane trip aniversario v2"
- **Viaje:** 2 personas, **12 → 17 feb 2027** (5 noches), Margarita.
- **Mensaje usado:** "Buenos días, quisiera información sobre disponibilidad y precios de habitación para 2 personas, del 12 al 17 de febrero de 2027 (5 noches). Tienen paquetes todo incluido o con desayuno? Gracias".
- **Ranking final** (tras quitar los que Vessel descartó el 26 oct):
  1. Libert (El Yaque): **$375** con desayuno (50 % para reservar)
  2. Hesperia Isla Margarita: **$900** todo incluido (deluxe; aparta 30 % o Cashea)
  3. Sunsol Isla Caribe: **$990** todo incluido
  4. Sunsol Ecoland (El Tirano): **$1.250** todo incluido
  5. LD Plus (Playa El Agua): **€1.400** all inclusive premium (no reembolsable)
  6. Miragua, Hotel California, LD Palm Beach: pendientes / sin cotización para las fechas
- Descartados por Vessel: Descanso Tropical, Negresco Costa Linda, Lidotel, Isabel la Católica, Villa Parguito, Villa La Azulita, Posada Sotavento, Casa del Sol, Casa Margariteña/Sun Set/El Caney, Playa Juventud.
- Las cotizaciones vencían en 24–72 h (oct 2026): **hay que re-cotizar** antes de reservar.
- **Export:** HTML offline (~218 KB) generado el 9 nov en el box: `/workspace/export/jose-y-vane-trip-aniversario.html` (no se incluye aquí porque trae teléfonos de contacto; pedírselo al box antes de cancelar o descargarlo del chat de Don Viaje).

## Rutinas
- Ninguna activa. (Hubo una puntual el 23 oct 7:00 AM para reintentar 2 envíos aprobados.)

## Pendientes
- Decidir hotel y re-cotizar; LD Palm Beach nunca mandó precio.

## Herramientas
Navegador (Google Maps, Instagram themavops, WhatsApp Web), transcripción de notas de voz (Whisper), páginas/canvas HTML.
