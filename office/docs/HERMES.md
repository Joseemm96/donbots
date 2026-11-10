# Conectar la oficina a Hermes

Estado al **10 nov 2026**: propuesta. No está probada contra un Hermes instalado.

Grok Bot no expone el estado de los bots hacia afuera. Vessel quiere pasar los agentes a Hermes en su propio VPS y abrir esta oficina desde cualquier lado, detrás de Tailscale o una clave. Este archivo dice cómo engancharla sin inventar una API de Hermes que no hemos visto.

## Lo que la oficina ya entiende

Todo pasa por `AgentSource` (`src/types.ts`):

- `list()` devuelve los agentes.
- `subscribe(listener)` avisa cuando cambia la lista. Devuelve una función para soltar la suscripción.
- `sendTask(agentId, task)` manda una tarea.

Cada agente trae `id` (el slug de `bots/<id>/`), `name`, `role`, `area` (`web` | `contenido` | `personal` | `ceo`), `state` (`trabajando` | `esperando` | `libre`), `task`, `routines` y `activity` (`{ at, text }`, `at` en ISO). El estado es lo que decide a qué sala camina.

`MockSource` implementa eso en el navegador. `HermesSource` es el otro lado del mismo contrato, pero **no llama a Hermes**. Llama a un puente que habría que escribir en el VPS.

## El puente no es Hermes

No consta aquí un endpoint oficial de Hermes para “lista de agentes / estado / asignar tarea”. No lo afirmamos. Las rutas de abajo son una **propuesta nuestra** para un proceso chico al lado de Hermes. Hay que confirmarlas (o cambiarlas) cuando el VPS esté armado. En el código están marcadas con `TODO`:

- `GET /api/agents` → `{ "agents": [ ... ] }` con la forma de arriba. Un array pelado también lo acepta el stub.
- `GET /api/events` → SSE. Cada `data:` es ese mismo JSON.
- `POST /api/agents/<id>/tasks` con `{ "task": "..." }`.

`VITE_HERMES_BASE_URL` es el origen de ese puente (`https://oficina.tu-tailnet`). `VITE_AGENT_SOURCE=hermes` lo activa. Sin la URL, la oficina no inventa datos: muestra el error.

El stub usa `EventSource`, que no manda un header `Authorization`. Si el puente pide una clave, lo más simple es cookie de mismo origen, o cambiar el stub a WebSocket. No pongas la clave en una variable `VITE_`: queda visible en el JS.

## De dónde saldría el estado (a confirmar)

Tres ideas. Cuál sirva depende de cómo quede Hermes en el VPS. Ninguna está verificada contra la instalación de Vessel.

### A. Leer sesiones o logs en disco

Un proceso en el VPS vigila el directorio donde Hermes guarda sesiones y logs. **La ruta exacta y el formato hay que leerlos en esa instalación** (CLI, archivos de config, docs que vengan con esa versión). No los copiamos aquí porque no los vimos.

Con eso se puede inferir, con reglas nuestras:

- hay una sesión activa reciente → `trabajando`
- el log está pidiendo un OK de Vessel (mensaje saliente, ClickUp, un envío) → `esperando`
- no hay nada corriendo → `libre`

El texto de la tarea puede ser la última línea útil del log, recortada. La actividad reciente, las últimas líneas ya redactadas (sin correos ni teléfonos).

Ese proceso publica el SSE y el POST. La página estática solo habla con él.

### B. Webhook

Si Hermes, o un wrapper, puede avisar al empezar y al terminar un turno, el puente actualiza el estado y lo empuja por SSE. Si el producto no tiene webhooks, esta opción no existe: no la damos por hecha.

### C. Asignar una tarea

`sendTask` hoy, en la simulación, cambia el estado a `trabajando` y guarda el texto. En el VPS el puente podría escribir un archivo de bandeja (`inbox/<id>.md`) o invocar la CLI. En [`routines/ROUTINES.md`](../../routines/ROUTINES.md) hay un ejemplo ilustrativo:

```cron
hermes run --agent don-researcher "..."
```

Ese comando **hay que ajustarlo a la CLI real**. No es una especificación.

Mandar una tarea desde la oficina es Vessel hablándole a su propio agente. El agente sigue las reglas de `USER.md`: nada sale a un tercero (correo, WhatsApp, ClickUp, un post) sin el OK explícito. La oficina no debe saltarse eso. Un bot en `esperando` es justo ese momento.

## Cómo dejarlo usable desde afuera

1. `npm run build` y servir `dist/` como en el README (nginx o el servidor que ya uses).
2. El puente escucha en el VPS, en una interfaz que no esté abierta al mundo. Tailscale alcanza para entrar desde el teléfono.
3. La página y el puente, mismo origen o con CORS pensado. `EventSource` es cómodo si comparten origen.
4. Recién ahí, `VITE_AGENT_SOURCE=hermes` y `VITE_HERMES_BASE_URL`, y otro build.

Hasta que eso exista, deja la variable en `mock`.
