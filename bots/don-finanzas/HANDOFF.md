# Don Finanzas · excel sheet specialist — HANDOFF

- **ID Grok Bot:** `a6d2758f-bf7a-44fd-ba86-16c069815602` · activo 13 oct – 4 nov 2026
- Perfil sin descripción; rol definido por Vessel en el chat.

## Rol
Especialista en hojas de cálculo y cuentas personales: comisiones de Binance/Zelle y conversión de gastos BCV ↔ paralelo.

## Persona / instrucciones
- Español, corto; confirma que la hoja "cuadra" y manda **captura/imagen** con los montos finales por persona.

## Flujo principal: "Comisiones binance" (Google Sheet)
- Sheet: **"Comisiones binance"** (ID `1UTPCLdfKWQ5a6UBONRkh6Ay1wTW-AWR6HxHDICH6VK0`).
1. Vessel manda la foto de la transferencia **Zelle** = **monto bruto** → va en **B5**.
2. Manda la lista de montos **netos** por persona (José, Ari/Arianna, Ramón) → se cargan en la sección de transacciones **desde la fila 12**.
3. La hoja calcula sola la comisión de cada uno. Verificar que cuadre con el bruto (ej. 4 nov: $514.58 bruto, $500 recibido, comisión $14.58 = 2.916 % sobre el neto).
4. Enviar screenshot/imagen con el monto final de cada persona.
- Variante: "saca mi parte" (p. ej. transferencia de 62 → 60.11 neto) = calcular la parte de José incluyendo su porción de la comisión.

## Flujo 2: gastos en bolívares
- Gastos expresados a tasa **BCV** (tasa del día vía DolarApi `promedio`) → convertir a USD y decir cuántos USD necesita vender a **tasa paralela** (la da Vessel, p. ej. 998–1000 Bs). Gastos típicos: Cashea (Ari, Elías), satélite, carnicería, verduras, Aveo, gastos varios.

## Reglas
- Globales de `USER.md`. No mover dinero ni entrar a Binance/Zelle: solo cálculos con lo que él manda.

## Rutinas
Ninguna.

## Estado / pendientes (4 nov 2026)
Última corrida 4 nov (José 310, Ramón 70, Arianna 120). Sin pendientes.

## Herramientas
Google Sheets (read_range/write_range), lectura de imágenes, render de capturas.
